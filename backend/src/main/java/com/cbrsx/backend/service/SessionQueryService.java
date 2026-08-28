package com.cbrsx.backend.service;

import com.cbrsx.backend.dto.PagedSessionsDTO;
import com.cbrsx.backend.dto.SessionSummaryDTO;
import com.cbrsx.backend.entity.Scenario;
import com.cbrsx.backend.entity.Trainee;
import com.cbrsx.backend.entity.TrainingSession;
import com.cbrsx.backend.repository.ScenarioRepository;
import com.cbrsx.backend.repository.SessionRepository;
import com.cbrsx.backend.repository.TraineeRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Read-only query service backing the instructor session browser.
 * Supports server-side pagination, status filtering, free-text search
 * across trainee name / batch unit / scenario title / session id, and
 * started-at date range filtering.
 */
@Service
public class SessionQueryService {

    private static final int MAX_PAGE_SIZE = 100;
    /** Hard ceiling on rows streamed by a single CSV export; truncation beyond
     *  this is reported to the caller via {@link SessionExportResult#truncated}. */
    public static final int CSV_EXPORT_MAX = 50_000;

    /**
     * Result of a CSV export query: the materialized rows plus enough metadata
     * for the caller to disclose truncation honestly instead of silently
     * shipping a partial dataset.
     */
    public record SessionExportResult(List<SessionSummaryDTO> rows, long totalMatching, boolean truncated) {}

    private final SessionRepository sessionRepository;
    private final TraineeRepository traineeRepository;
    private final ScenarioRepository scenarioRepository;

    public SessionQueryService(SessionRepository sessionRepository,
                               TraineeRepository traineeRepository,
                               ScenarioRepository scenarioRepository) {
        this.sessionRepository = sessionRepository;
        this.traineeRepository = traineeRepository;
        this.scenarioRepository = scenarioRepository;
    }

    @Transactional(readOnly = true)
    public PagedSessionsDTO getSessions(int page, int size, String status, String traineeId,
                                        String query, LocalDate from, LocalDate to) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        return doGet(safePage, safeSize, status, traineeId, query, from, to);
    }

    @Transactional(readOnly = true)
    public SessionExportResult exportRows(String status, String traineeId,
                                          String query, LocalDate from, LocalDate to) {
        PagedSessionsDTO page = doGet(0, CSV_EXPORT_MAX, status, traineeId, query, from, to);
        boolean truncated = page.getTotalElements() > page.getContent().size();
        return new SessionExportResult(page.getContent(), page.getTotalElements(), truncated);
    }

    private PagedSessionsDTO doGet(int page, int size, String status, String traineeId,
                                   String query, LocalDate from, LocalDate to) {
        Specification<TrainingSession> spec = buildSpecification(status, traineeId, query, from, to);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startedAt"));
        Page<TrainingSession> result = sessionRepository.findAll(spec, pageable);

        Map<String, Trainee> traineesById = loadTrainees(result.getContent());
        Map<String, Scenario> scenariosById = loadScenarios(result.getContent());

        List<SessionSummaryDTO> content = result.getContent().stream()
                .map(s -> toSummary(s, traineesById, scenariosById))
                .collect(Collectors.toList());

        return PagedSessionsDTO.builder()
                .content(content)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    private Specification<TrainingSession> buildSpecification(String status, String traineeId,
                                                              String query, LocalDate from, LocalDate to) {
        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                predicates.add(cb.equal(cb.upper(root.get("passStatus")), status.trim().toUpperCase()));
            } else {
                // Default listing hides voided sessions, matching the void dialog's
                // promise; instructors can still retrieve them via status=VOIDED.
                predicates.add(cb.notEqual(cb.upper(root.get("passStatus")), "VOIDED"));
            }
            if (traineeId != null && !traineeId.isBlank()) {
                predicates.add(cb.equal(root.get("traineeId"), traineeId.trim()));
            }
            if (query != null && !query.isBlank()) {
                String text = query.trim();
                String lowerText = text.toLowerCase();

                List<String> matchingTraineeIds = traineeRepository
                        .findTop500ByNameContainingIgnoreCaseOrBatchUnitContainingIgnoreCase(text, text)
                        .stream()
                        .map(Trainee::getTraineeId)
                        .collect(Collectors.toList());

                List<String> matchingScenarioIds = scenarioRepository
                        .findTop200ByTitleContainingIgnoreCase(text)
                        .stream()
                        .map(Scenario::getScenarioId)
                        .collect(Collectors.toList());

                Predicate bySessionId = cb.like(cb.lower(root.get("sessionId")), "%" + lowerText + "%");
                Predicate byTrainee = matchingTraineeIds.isEmpty()
                        ? cb.disjunction()
                        : root.get("traineeId").in(matchingTraineeIds);
                Predicate byScenarioTitle = matchingScenarioIds.isEmpty()
                        ? cb.disjunction()
                        : root.get("scenarioId").in(matchingScenarioIds);

                predicates.add(cb.or(bySessionId, byTrainee, byScenarioTitle));
            }
            if (from != null) {
                Instant startOfDay = from.atStartOfDay(ZoneOffset.UTC).toInstant();
                predicates.add(cb.greaterThanOrEqualTo(root.get("startedAt"), startOfDay));
            }
            if (to != null) {
                Instant endOfDay = to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
                predicates.add(cb.lessThan(root.get("startedAt"), endOfDay));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private SessionSummaryDTO toSummary(TrainingSession s, Map<String, Trainee> traineesById,
                                        Map<String, Scenario> scenariosById) {
        Trainee trainee = s.getTraineeId() != null ? traineesById.get(s.getTraineeId()) : null;
        Scenario scenario = s.getScenarioId() != null ? scenariosById.get(s.getScenarioId()) : null;
        return SessionSummaryDTO.builder()
                .sessionId(s.getSessionId())
                .traineeId(s.getTraineeId())
                .traineeName(trainee != null ? trainee.getName() : "Unknown")
                .batchUnit(trainee != null ? trainee.getBatchUnit() : "-")
                .scenarioTitle(scenario != null ? scenario.getTitle() : "Unknown Scenario")
                .startedAt(s.getStartedAt())
                .completedAt(s.getCompletedAt())
                .finalScore(s.getFinalScore())
                .passStatus(s.getPassStatus())
                .build();
    }

    private Map<String, Trainee> loadTrainees(List<TrainingSession> sessions) {
        Set<String> ids = sessions.stream()
                .map(TrainingSession::getTraineeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return traineeRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Trainee::getTraineeId, Function.identity()));
    }

    private Map<String, Scenario> loadScenarios(List<TrainingSession> sessions) {
        Set<String> ids = sessions.stream()
                .map(TrainingSession::getScenarioId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return new HashMap<>();
        }
        return scenarioRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Scenario::getScenarioId, Function.identity()));
    }
}

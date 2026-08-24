package com.cbrsx.backend.repository;

import com.cbrsx.backend.entity.TrainingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<TrainingSession, String>, JpaSpecificationExecutor<TrainingSession> {
    List<TrainingSession> findByTraineeId(String traineeId);
    // [Task 3] Query for longitudinal skill-growth tracking ordered chronologically
    List<TrainingSession> findByTraineeIdOrderByStartedAtAsc(String traineeId);
    List<TrainingSession> findByPassStatus(String passStatus);
    long countByPassStatusIgnoreCase(String passStatus);
    List<TrainingSession> findTop10ByOrderByStartedAtDesc();
    List<TrainingSession> findTop10ByPassStatusNotIgnoreCaseOrderByStartedAtDesc(String passStatus);

    @Query("SELECT AVG(s.finalScore) FROM TrainingSession s WHERE s.passStatus IN ('PASSED', 'FAILED') AND s.finalScore IS NOT NULL")
    Double averageFinalScoreOfCompleted();

    @Query("SELECT COUNT(s) FROM TrainingSession s WHERE s.passStatus IN ('PASSED', 'FAILED')")
    long countCompletedSessions();
}

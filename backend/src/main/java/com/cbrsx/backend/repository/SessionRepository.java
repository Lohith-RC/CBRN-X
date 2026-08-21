package com.cbrsx.backend.repository;

import com.cbrsx.backend.entity.TrainingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<TrainingSession, String> {
    List<TrainingSession> findByTraineeId(String traineeId);
    List<TrainingSession> findByPassStatus(String passStatus);
}

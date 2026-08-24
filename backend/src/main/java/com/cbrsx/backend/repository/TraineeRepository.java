package com.cbrsx.backend.repository;

import com.cbrsx.backend.entity.Trainee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TraineeRepository extends JpaRepository<Trainee, String> {
    List<Trainee> findTop500ByNameContainingIgnoreCaseOrBatchUnitContainingIgnoreCase(String name, String batchUnit);
}

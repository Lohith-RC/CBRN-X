package com.cbrsx.backend.repository;

import com.cbrsx.backend.entity.Trainee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TraineeRepository extends JpaRepository<Trainee, String> {
}

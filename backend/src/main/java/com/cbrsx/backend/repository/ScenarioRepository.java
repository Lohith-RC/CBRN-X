package com.cbrsx.backend.repository;

import com.cbrsx.backend.entity.Scenario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ScenarioRepository extends JpaRepository<Scenario, String> {
    Optional<Scenario> findByCode(String code);
}

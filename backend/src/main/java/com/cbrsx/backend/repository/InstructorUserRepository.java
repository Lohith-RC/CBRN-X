package com.cbrsx.backend.repository;

import com.cbrsx.backend.entity.InstructorUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InstructorUserRepository extends JpaRepository<InstructorUser, String> {

    List<InstructorUser> findByEnabledTrue();
}

package com.taskmanager.project.domain;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    @Query("select p from Project p where p.id in "
            + "(select m.projectId from ProjectMembership m where m.userId = :userId)")
    Page<Project> findAllForMember(UUID userId, Pageable pageable);
}

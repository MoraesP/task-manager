package com.taskmanager.project.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InvitationRepository extends JpaRepository<Invitation, UUID> {

    Optional<Invitation> findByTokenHash(String tokenHash);

    List<Invitation> findByProjectIdAndStatus(UUID projectId, InvitationStatus status);

    boolean existsByProjectIdAndEmailIgnoreCaseAndStatus(UUID projectId, String email, InvitationStatus status);
}

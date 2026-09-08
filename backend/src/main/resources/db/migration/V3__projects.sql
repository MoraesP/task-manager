CREATE TABLE projects (
    id          UUID PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    owner_id    UUID NOT NULL REFERENCES users (id),
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_projects_owner ON projects (owner_id);

CREATE TABLE project_memberships (
    id         UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role       VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_membership_project_user UNIQUE (project_id, user_id)
);

CREATE INDEX idx_memberships_user ON project_memberships (user_id);

CREATE TABLE invitations (
    id            UUID PRIMARY KEY,
    project_id    UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    email         VARCHAR(320) NOT NULL,
    role          VARCHAR(20) NOT NULL,
    token_hash    VARCHAR(255) NOT NULL,
    status        VARCHAR(20) NOT NULL,
    created_by_id UUID NOT NULL REFERENCES users (id),
    expires_at    TIMESTAMPTZ NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_invitations_token UNIQUE (token_hash)
);

CREATE INDEX idx_invitations_project_status ON invitations (project_id, status);
CREATE UNIQUE INDEX uq_invitations_pending_email
    ON invitations (project_id, lower(email))
    WHERE status = 'PENDING';

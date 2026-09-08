CREATE TABLE tasks (
    id            UUID PRIMARY KEY,
    project_id    UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    status        VARCHAR(20) NOT NULL,
    priority      VARCHAR(20) NOT NULL,
    priority_rank SMALLINT NOT NULL,
    assignee_id   UUID NOT NULL REFERENCES users (id),
    deadline      TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_tasks_project             ON tasks (project_id);
CREATE INDEX idx_tasks_project_status      ON tasks (project_id, status);
CREATE INDEX idx_tasks_project_priority    ON tasks (project_id, priority_rank);
CREATE INDEX idx_tasks_project_created     ON tasks (project_id, created_at);
CREATE INDEX idx_tasks_project_deadline    ON tasks (project_id, deadline);
CREATE INDEX idx_tasks_assignee_status     ON tasks (assignee_id, status);

-- Trigram indexes backing the text search (ADR 0005).
CREATE INDEX idx_tasks_title_trgm       ON tasks USING gin (title gin_trgm_ops);
CREATE INDEX idx_tasks_description_trgm  ON tasks USING gin (description gin_trgm_ops);

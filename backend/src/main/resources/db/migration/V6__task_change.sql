-- Histórico de alterações da tarefa (audit log): quem criou e cada alteração de
-- campo feita depois, com valor antigo e novo. Uma linha por campo alterado.

ALTER TABLE tasks ADD COLUMN created_by_id UUID REFERENCES users (id);

CREATE TABLE task_change (
    id           UUID PRIMARY KEY,
    task_id      UUID NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    author_id    UUID NOT NULL REFERENCES users (id),
    change_type  VARCHAR(40) NOT NULL,
    old_value    TEXT,
    new_value    TEXT,
    occurred_at  TIMESTAMPTZ NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL,
    updated_at   TIMESTAMPTZ NOT NULL
);

-- Leitura sempre por tarefa, em ordem cronológica.
CREATE INDEX idx_task_change_task ON task_change (task_id, occurred_at);

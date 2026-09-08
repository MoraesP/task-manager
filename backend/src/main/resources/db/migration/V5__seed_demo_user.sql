-- Demo account so the API can be exercised immediately.
-- Email: demo@taskmanager.local   Password: password123
INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demo User',
    'demo@taskmanager.local',
    '$2a$12$NoLAHg8daauhzB6liezDc.nyO5zgNgJStgzfzYlYjmZtmrVdPN..2',
    now(),
    now()
);

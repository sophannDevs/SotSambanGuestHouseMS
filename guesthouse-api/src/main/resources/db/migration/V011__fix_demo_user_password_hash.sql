-- V003 seeded all demo users with a bcrypt hash that does not actually decode to
-- the documented password "password123" (verified with BCryptPasswordEncoder).
-- This corrects the hash so the documented demo credentials work.
-- Password: password123 -> $2b$10$grahohs77hzlGdVdGZQVRODOd7UAhf7U7kS9SAZ0Oneb7zrglLlTG
UPDATE users
SET password_hash = '$2b$10$grahohs77hzlGdVdGZQVRODOd7UAhf7U7kS9SAZ0Oneb7zrglLlTG'
WHERE email IN ('owner@sotsamban.local', 'manager@sotsamban.local', 'receptionist@sotsamban.local');

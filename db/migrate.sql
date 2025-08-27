-- Insert existing users
INSERT OR REPLACE INTO users (id, name, linkedin_profile, registered_at) VALUES 
('bc5a51a9-8528-4c3a-80e2-d155008b483d', 'Harshit Taneja', 'https://www.linkedin.com/in/harshit-s-973041200/', '2025-08-21T10:08:25.094Z');

-- Insert existing quizzes
INSERT OR REPLACE INTO quizzes (id, title, description, time_per_question, is_active, created_at) VALUES 
('2e17f71d-40b1-4c39-8132-faefb170487c', 'General Knowledge Quiz', 'Test your general knowledge', 30, FALSE, '2025-08-21T10:07:22.746Z'),
('f56bffe6-bcbf-46d8-9a69-25572908483a', 'xaxax', 'axaxax', 30, FALSE, '2025-08-24T08:57:41.271Z');

-- Insert existing questions
INSERT OR REPLACE INTO questions (id, quiz_id, question, options, correct_answer, category, difficulty, points) VALUES 
('1', '2e17f71d-40b1-4c39-8132-faefb170487c', 'What is the capital of Japan?', '["Tokyo","Osaka","Kyoto","Hiroshima"]', 0, 'Geography', 'easy', 10),
('2', '2e17f71d-40b1-4c39-8132-faefb170487c', 'Which programming language was created by Brendan Eich?', '["Python","JavaScript","Java","C++"]', 1, 'Technology', 'medium', 20);

-- Insert existing sessions
INSERT OR REPLACE INTO sessions (id, quiz_id, is_active, started_at, ended_at) VALUES 
('19dec62a-f8e2-4582-88ee-ea2a835812fd', 'f56bffe6-bcbf-46d8-9a69-25572908483a', FALSE, '2025-08-24T08:58:51.512Z', '2025-08-24T08:58:53.475Z'),
('c5603a98-70cb-4294-94fe-2854cfd1f34c', '2e17f71d-40b1-4c39-8132-faefb170487c', TRUE, '2025-08-24T09:24:16.438Z', NULL),
('da3d3c04-3b72-40f7-9718-734703da0529', 'f56bffe6-bcbf-46d8-9a69-25572908483a', TRUE, '2025-08-24T09:24:22.607Z', NULL);

-- Insert existing results
INSERT OR REPLACE INTO results (id, user_id, quiz_id, player_name, score, total_questions, time_spent, answers, completed_at) VALUES 
('b965f4a5-98a9-4200-b1a4-a3373a3af7b9', 'bc5a51a9-8528-4c3a-80e2-d155008b483d', '2e17f71d-40b1-4c39-8132-faefb170487c', 'Harshit Taneja', 19, 2, 36, '[{"questionId":"1","selectedAnswer":0,"correct":true,"timeSpent":2,"points":19}]', '2025-08-24T09:26:12.399Z'); 
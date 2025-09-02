-- Sample Questions (question bank)
INSERT INTO public.questions (id, question, options, correct_answer, category, difficulty, positive_points, negative_points, time, quiz_ids) VALUES
('q1', 'What is the capital of Japan?', '["Tokyo", "Osaka", "Kyoto", "Hiroshima"]', 0, 'Geography', 'easy', 10, 2, 30, '{}'),
('q2', 'Which programming language was created by Brendan Eich?', '["Python", "JavaScript", "Java", "C++"]', 1, 'Technology', 'medium', 15, 3, 45, '{}'),
('q3', 'What is the largest planet in our solar system?', '["Earth", "Jupiter", "Saturn", "Mars"]', 1, 'Science', 'easy', 10, 2, 25, '{}'),
('q4', 'Who painted the Mona Lisa?', '["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"]', 2, 'Art', 'medium', 15, 3, 35, '{}'),
('q5', 'What is the chemical symbol for gold?', '["Go", "Gd", "Au", "Ag"]', 2, 'Science', 'hard', 20, 5, 40, '{}'),
('q6', 'Which year did World War II end?', '["1944", "1945", "1946", "1947"]', 1, 'History', 'medium', 15, 3, 30, '{}'),
('q7', 'What is the square root of 144?', '["10", "12", "14", "16"]', 1, 'Mathematics', 'easy', 10, 2, 20, '{}'),
('q8', 'Which planet is known as the Red Planet?', '["Venus", "Mars", "Jupiter", "Saturn"]', 1, 'Science', 'easy', 10, 2, 25, '{}');

-- Sample Quizzes
INSERT INTO public.quizzes (id, title, description, status, total_time, total_questions, created_at) VALUES
('quiz1', 'General Knowledge Quiz', 'Test your general knowledge across various topics', 'active', 0, 0, NOW()),
('quiz2', 'Science & Technology Quiz', 'Challenge yourself with science and tech questions', 'inactive', 0, 0, NOW()),
('quiz3', 'History & Geography Quiz', 'Explore your knowledge of world history and geography', 'inactive', 0, 0, NOW());

-- Attach questions to quizzes
UPDATE public.questions SET quiz_ids = ARRAY['quiz1'] WHERE id IN ('q1', 'q2', 'q3', 'q4');
UPDATE public.questions SET quiz_ids = ARRAY['quiz2'] WHERE id IN ('q2', 'q3', 'q5', 'q8');
UPDATE public.questions SET quiz_ids = ARRAY['quiz3'] WHERE id IN ('q1', 'q6', 'q8');
UPDATE public.questions SET quiz_ids = ARRAY['quiz1', 'quiz2'] WHERE id = 'q7'; -- Math question in both

-- Recalculate quiz stats
SELECT public.recalculate_quiz_stats('quiz1');
SELECT public.recalculate_quiz_stats('quiz2');
SELECT public.recalculate_quiz_stats('quiz3');

-- Sample Results for testing leaderboard
INSERT INTO public.results (id, user_id, quiz_id, score, time_spent, completed_at) VALUES
('result1', '4f67ef5b-9ac3-4ae1-904c-380a079856cd', 'quiz1', 25, 65, NOW() - INTERVAL '1 hour'),
('result2', '4f67ef5b-9ac3-4ae1-904c-380a079856cd', 'quiz2', 45, 120, NOW() - INTERVAL '30 minutes'); 
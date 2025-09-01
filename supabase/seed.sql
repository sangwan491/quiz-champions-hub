-- Seed sample data for quizzes and questions (status-based, question bank)

-- Users (minimal sample for testing results later if needed)
insert into public.users (id, name, phone, registered_at)
values
  ('u1', 'Sample Player', '+10000000000', now())
on conflict (id) do nothing;

-- Quizzes
insert into public.quizzes (id, title, description, status, total_time, total_questions, created_at)
values
  ('qz_gk', 'General Knowledge Quiz', 'Test your general knowledge', 'inactive', 0, 0, now()),
  ('qz_sc', 'Science & Tech Quiz', 'STEM focused quiz', 'inactive', 0, 0, now())
on conflict (id) do nothing;

-- Questions (question bank)
insert into public.questions (id, question, options, correct_answer, category, difficulty, points, time, quiz_ids)
values
  ('qn1', 'What is the capital of Japan?', '["Tokyo", "Osaka", "Kyoto", "Hiroshima"]', 0, 'Geography', 'easy', 10, 30, '{qz_gk}'),
  ('qn2', 'Which language was created by Brendan Eich?', '["Python", "JavaScript", "Java", "C++"]', 1, 'Technology', 'medium', 20, 30, '{qz_sc,qz_gk}'),
  ('qn3', 'Speed of light is approximately?', '["3x10^8 m/s", "3x10^6 m/s", "3x10^5 km/s", "1x10^8 m/s"]', 0, 'Science', 'medium', 15, 30, '{qz_sc}'),
  ('qn4', 'Who wrote Hamlet?', '["Charles Dickens", "William Shakespeare", "Mark Twain", "Leo Tolstoy"]', 1, 'Literature', 'easy', 10, 25, '{qz_gk}'),
  ('qn5', 'Proton charge is?', '["Positive", "Negative", "Neutral", "Depends"]', 0, 'Physics', 'easy', 10, 20, '{qz_sc}')
on conflict (id) do nothing;

-- Recalculate aggregates
select public.recalculate_quiz_stats('qz_gk');
select public.recalculate_quiz_stats('qz_sc'); 
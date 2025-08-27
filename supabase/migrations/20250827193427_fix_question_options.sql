-- Fix existing questions with empty options
UPDATE public.questions 
SET options = '["Tokyo", "Osaka", "Kyoto", "Hiroshima"]'::jsonb
WHERE id = '1' AND question = 'What is the capital of Japan?';

UPDATE public.questions 
SET options = '["Python", "JavaScript", "Java", "C++"]'::jsonb
WHERE id = '2' AND question = 'Which programming language was created by Brendan Eich?';

-- Update questions with empty or invalid options
UPDATE public.questions 
SET options = '["Option A", "Option B", "Option C", "Option D"]'::jsonb
WHERE options IS NULL 
   OR options = '[]'::jsonb
   OR jsonb_array_length(options) = 0;

-- Add evaluation_form_url column to courses table
-- This allows instructors to set a Google Form URL for course evaluation

ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS evaluation_form_url TEXT;

COMMENT ON COLUMN courses.evaluation_form_url IS '課後評估表單網址（Google Form 或其他問卷連結）';

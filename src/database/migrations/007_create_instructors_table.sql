-- Create instructors table for instructor applications and management
CREATE TABLE IF NOT EXISTS instructors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    qualifications TEXT,
    specialization VARCHAR(255),
    years_of_experience INTEGER,
    application_status VARCHAR(20) DEFAULT 'pending' CHECK (application_status IN ('pending', 'approved', 'rejected')),
    approval_date TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create instructor ratings table
CREATE TABLE IF NOT EXISTS instructor_ratings (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER REFERENCES instructors(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(instructor_id, student_id, course_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_instructors_user_id ON instructors(user_id);
CREATE INDEX IF NOT EXISTS idx_instructors_status ON instructors(application_status);
CREATE INDEX IF NOT EXISTS idx_instructors_active ON instructors(is_active);
CREATE INDEX IF NOT EXISTS idx_instructor_ratings_instructor ON instructor_ratings(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_ratings_student ON instructor_ratings(student_id);

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_instructors_updated_at 
    BEFORE UPDATE ON instructors 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

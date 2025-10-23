-- Create instructor applications table
CREATE TABLE IF NOT EXISTS instructor_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT NOT NULL,
    qualifications TEXT NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    years_of_experience INTEGER NOT NULL DEFAULT 0,
    target_audiences TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INTEGER REFERENCES users(id),
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique application per user (only one pending application per user)
    UNIQUE(user_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_instructor_applications_user_id ON instructor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_instructor_applications_status ON instructor_applications(status);
CREATE INDEX IF NOT EXISTS idx_instructor_applications_submitted_at ON instructor_applications(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_instructor_applications_reviewed_at ON instructor_applications(reviewed_at DESC);

-- Create composite index for admin queries
CREATE INDEX IF NOT EXISTS idx_instructor_applications_status_submitted 
ON instructor_applications(status, submitted_at DESC);

-- Create composite index for user queries
CREATE INDEX IF NOT EXISTS idx_instructor_applications_user_status 
ON instructor_applications(user_id, status);

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_instructor_applications_updated_at 
    BEFORE UPDATE ON instructor_applications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create job applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    applicant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
    cover_letter TEXT,
    resume_url VARCHAR(500),
    
    -- Ensure unique application per user per job
    UNIQUE(job_id, applicant_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_date ON job_applications(application_date);

-- Create composite index for employer queries (jobs by employer with applications)
CREATE INDEX IF NOT EXISTS idx_applications_job_status ON job_applications(job_id, status);

-- Create composite index for applicant queries
CREATE INDEX IF NOT EXISTS idx_applications_applicant_status ON job_applications(applicant_id, status);
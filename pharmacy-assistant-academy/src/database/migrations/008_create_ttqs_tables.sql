-- TTQS Quality Management System Tables

-- Training Plans (PDDRO - Plan)
CREATE TABLE IF NOT EXISTS training_plans (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    objectives TEXT,
    target_audience TEXT,
    duration_weeks INTEGER,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training Execution Records (PDDRO - Do)
CREATE TABLE IF NOT EXISTS training_executions (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES training_plans(id),
    course_id INTEGER REFERENCES courses(id),
    execution_date DATE NOT NULL,
    instructor_id INTEGER REFERENCES users(id),
    attendance_count INTEGER,
    completion_rate DECIMAL(5,2),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Four-Level Evaluations (PDDRO - Review)
-- Level 1: Reaction (Satisfaction Survey)
CREATE TABLE IF NOT EXISTS reaction_evaluations (
    id SERIAL PRIMARY KEY,
    execution_id INTEGER REFERENCES training_executions(id),
    user_id INTEGER REFERENCES users(id),
    course_satisfaction INTEGER CHECK (course_satisfaction BETWEEN 1 AND 5),
    instructor_satisfaction INTEGER CHECK (instructor_satisfaction BETWEEN 1 AND 5),
    content_satisfaction INTEGER CHECK (content_satisfaction BETWEEN 1 AND 5),
    facility_satisfaction INTEGER CHECK (facility_satisfaction BETWEEN 1 AND 5),
    overall_satisfaction INTEGER CHECK (overall_satisfaction BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Level 2: Learning (Test Scores)
CREATE TABLE IF NOT EXISTS learning_evaluations (
    id SERIAL PRIMARY KEY,
    execution_id INTEGER REFERENCES training_executions(id),
    user_id INTEGER REFERENCES users(id),
    pre_test_score INTEGER,
    post_test_score INTEGER,
    improvement_rate DECIMAL(5,2),
    passed BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Level 3: Behavior (Application Ability)
CREATE TABLE IF NOT EXISTS behavior_evaluations (
    id SERIAL PRIMARY KEY,
    execution_id INTEGER REFERENCES training_executions(id),
    user_id INTEGER REFERENCES users(id),
    evaluator_id INTEGER REFERENCES users(id),
    skill_application_score INTEGER CHECK (skill_application_score BETWEEN 1 AND 5),
    work_quality_score INTEGER CHECK (work_quality_score BETWEEN 1 AND 5),
    efficiency_score INTEGER CHECK (efficiency_score BETWEEN 1 AND 5),
    overall_behavior_score INTEGER CHECK (overall_behavior_score BETWEEN 1 AND 5),
    evaluation_date DATE,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Level 4: Results (Employment Outcomes)
CREATE TABLE IF NOT EXISTS result_evaluations (
    id SERIAL PRIMARY KEY,
    execution_id INTEGER REFERENCES training_executions(id),
    user_id INTEGER REFERENCES users(id),
    employment_status VARCHAR(20) CHECK (employment_status IN ('employed', 'unemployed', 'seeking')),
    employment_date DATE,
    job_match_rate INTEGER CHECK (job_match_rate BETWEEN 0 AND 100),
    salary_level DECIMAL(10,2),
    employer_satisfaction INTEGER CHECK (employer_satisfaction BETWEEN 1 AND 5),
    retention_months INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Improvement Actions (PDDRO - Outcome)
CREATE TABLE IF NOT EXISTS improvement_actions (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES training_plans(id),
    issue_description TEXT NOT NULL,
    root_cause_analysis TEXT,
    action_plan TEXT NOT NULL,
    responsible_person INTEGER REFERENCES users(id),
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    completion_date DATE,
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Digital Document Management
CREATE TABLE IF NOT EXISTS ttqs_documents (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES training_plans(id),
    document_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER,
    version VARCHAR(20),
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_training_plans_status ON training_plans(status);
CREATE INDEX IF NOT EXISTS idx_training_executions_plan ON training_executions(plan_id);
CREATE INDEX IF NOT EXISTS idx_training_executions_course ON training_executions(course_id);
CREATE INDEX IF NOT EXISTS idx_reaction_evaluations_execution ON reaction_evaluations(execution_id);
CREATE INDEX IF NOT EXISTS idx_learning_evaluations_execution ON learning_evaluations(execution_id);
CREATE INDEX IF NOT EXISTS idx_behavior_evaluations_execution ON behavior_evaluations(execution_id);
CREATE INDEX IF NOT EXISTS idx_result_evaluations_execution ON result_evaluations(execution_id);
CREATE INDEX IF NOT EXISTS idx_improvement_actions_plan ON improvement_actions(plan_id);
CREATE INDEX IF NOT EXISTS idx_ttqs_documents_plan ON ttqs_documents(plan_id);

-- Create triggers for updated_at
CREATE TRIGGER update_training_plans_updated_at 
    BEFORE UPDATE ON training_plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_executions_updated_at 
    BEFORE UPDATE ON training_executions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_result_evaluations_updated_at 
    BEFORE UPDATE ON result_evaluations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_improvement_actions_updated_at 
    BEFORE UPDATE ON improvement_actions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

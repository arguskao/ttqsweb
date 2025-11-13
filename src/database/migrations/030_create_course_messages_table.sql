-- Create course messages table for instructor-student communication
CREATE TABLE IF NOT EXISTS course_messages (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_broadcast BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    
    -- 確保訊息邏輯正確
    CONSTRAINT check_broadcast_or_recipient CHECK (
        (is_broadcast = TRUE AND recipient_id IS NULL) OR
        (is_broadcast = FALSE AND recipient_id IS NOT NULL)
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_messages_course ON course_messages(course_id);
CREATE INDEX IF NOT EXISTS idx_course_messages_sender ON course_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_course_messages_recipient ON course_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_course_messages_created_at ON course_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_messages_unread ON course_messages(recipient_id, is_read) WHERE is_read = FALSE;

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_course_messages_course_recipient ON course_messages(course_id, recipient_id);

-- Add comment
COMMENT ON TABLE course_messages IS '課程訊息表，用於講師與學員之間的溝通';
COMMENT ON COLUMN course_messages.is_broadcast IS '是否為群發訊息（發送給課程所有學員）';
COMMENT ON COLUMN course_messages.is_read IS '訊息是否已讀';

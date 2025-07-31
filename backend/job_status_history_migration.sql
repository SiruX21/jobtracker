-- Create job_status_history table to track status changes
CREATE TABLE job_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    from_status VARCHAR(255),
    to_status VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_by INT,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_job_id (job_id),
    INDEX idx_changed_at (changed_at)
);

-- Insert initial status history for existing jobs
INSERT INTO job_status_history (job_id, from_status, to_status, changed_at, created_by)
SELECT 
    id as job_id,
    NULL as from_status,
    status as to_status,
    application_date as changed_at,
    user_id as created_by
FROM jobs
WHERE status IS NOT NULL;

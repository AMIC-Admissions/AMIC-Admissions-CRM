-- Add report templates table
CREATE TABLE IF NOT EXISTS report_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  filters JSON NOT NULL,
  selectedFields JSON NOT NULL,
  createdBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_created_by (createdBy),
  UNIQUE KEY unique_name_per_user (name, createdBy)
);

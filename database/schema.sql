
CREATE DATABASE IF NOT EXISTS skillbridge_ai;
USE skillbridge_ai;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','industry','faculty','institution') NOT NULL,
  department VARCHAR(120),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(80) DEFAULT 'Technical'
);

CREATE TABLE IF NOT EXISTS student_skills (
  user_id INT NOT NULL,
  skill_id INT NOT NULL,
  proficiency DECIMAL(5,2) NOT NULL DEFAULT 0,
  PRIMARY KEY(user_id, skill_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(160) NOT NULL,
  industry VARCHAR(100),
  location VARCHAR(120),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS opportunities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT,
  title VARCHAR(180) NOT NULL,
  type ENUM('internship','job','training','fellowship','project') DEFAULT 'internship',
  location VARCHAR(120),
  description TEXT,
  stipend VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS opportunity_skills (
  opportunity_id INT NOT NULL,
  skill_id INT NOT NULL,
  required_level DECIMAL(5,2) NOT NULL DEFAULT 60,
  weight DECIMAL(6,3) NOT NULL DEFAULT 1,
  PRIMARY KEY(opportunity_id, skill_id),
  FOREIGN KEY(opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  opportunity_id INT NOT NULL,
  student_id INT NOT NULL,
  status ENUM('applied','shortlisted','selected','rejected') DEFAULT 'applied',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(opportunity_id, student_id),
  FOREIGN KEY(opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS faculty_programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_user_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  type ENUM('faculty_internship','FDP','research','guest_lecture','mentorship') NOT NULL,
  organization VARCHAR(160),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(faculty_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS institution_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  institution_user_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  type ENUM('workshop','hackathon','industry_visit','placement_drive','training') NOT NULL,
  event_date DATE,
  description TEXT,
  FOREIGN KEY(institution_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mentorships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mentor_user_id INT NOT NULL,
  student_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  status ENUM('active','completed') DEFAULT 'active',
  FOREIGN KEY(mentor_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT IGNORE INTO skills(name,category) VALUES
('Python','Programming'),('SQL','Data'),('React','Web'),('JavaScript','Web'),
('CSS','Web'),('Communication','Soft Skill'),('Machine Learning','AI'),
('Excel','Data'),('Power BI','Data'),('Git','Tools'),('Java','Programming'),
('Cloud','Cloud'),('Data Structures','CS'),('Problem Solving','CS');

INSERT IGNORE INTO users(name,email,password_hash,role,department) VALUES
('Demo Student','demo@student.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','student','Computer Engineering'),
('Insight HR','industry@insightlabs.com','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','industry','Technology'),
('Dr. Faculty','faculty@skillbridge.edu','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','faculty','Computer Engineering'),
('SkillBridge Institute','institution@skillbridge.edu','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','institution','Computer Engineering');

INSERT IGNORE INTO companies(user_id,name,industry,location)
SELECT id,'Insight Labs','Analytics & AI','Pune' FROM users WHERE email='industry@insightlabs.com';

INSERT IGNORE INTO opportunities(company_id,title,type,location,description,stipend)
SELECT c.id,'Data Analyst Intern','internship','Pune','Analytics internship with SQL, Excel and Power BI.','₹15,000/month'
FROM companies c WHERE c.name='Insight Labs';

INSERT IGNORE INTO opportunities(company_id,title,type,location,description,stipend)
SELECT c.id,'Frontend Developer Intern','internship','Hybrid','Build responsive React applications.','₹18,000/month'
FROM companies c WHERE c.name='Insight Labs';

INSERT IGNORE INTO opportunities(company_id,title,type,location,description,stipend)
SELECT c.id,'Junior ML Engineer','job','Remote','Entry-level machine learning role.','₹6 LPA'
FROM companies c WHERE c.name='Insight Labs';

INSERT IGNORE INTO student_skills(user_id,skill_id,proficiency)
SELECT u.id,s.id,
CASE s.name WHEN 'Python' THEN 85 WHEN 'SQL' THEN 80 WHEN 'React' THEN 60
WHEN 'Communication' THEN 55 WHEN 'Machine Learning' THEN 45 WHEN 'JavaScript' THEN 70
WHEN 'CSS' THEN 72 WHEN 'Excel' THEN 65 WHEN 'Power BI' THEN 50 WHEN 'Git' THEN 68
WHEN 'Data Structures' THEN 70 WHEN 'Problem Solving' THEN 65 ELSE 40 END
FROM users u CROSS JOIN skills s WHERE u.email='demo@student.com';

INSERT IGNORE INTO opportunity_skills(opportunity_id,skill_id,required_level,weight)
SELECT o.id,s.id,75,1.2 FROM opportunities o JOIN skills s
WHERE o.title='Data Analyst Intern' AND s.name IN ('SQL','Excel','Power BI','Python');

INSERT IGNORE INTO opportunity_skills(opportunity_id,skill_id,required_level,weight)
SELECT o.id,s.id,70,1.2 FROM opportunities o JOIN skills s
WHERE o.title='Frontend Developer Intern' AND s.name IN ('React','JavaScript','CSS','Git');

INSERT IGNORE INTO opportunity_skills(opportunity_id,skill_id,required_level,weight)
SELECT o.id,s.id,75,1.2 FROM opportunities o JOIN skills s
WHERE o.title='Junior ML Engineer' AND s.name IN ('Python','Machine Learning','Data Structures','Problem Solving');

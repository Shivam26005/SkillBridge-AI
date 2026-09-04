-- SkillBridge AI PostgreSQL Schema
-- Run this inside Aiven's defaultdb database

CREATE TABLE IF NOT EXISTS users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student','industry','faculty','institution')),
  department VARCHAR(120),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(80) DEFAULT 'Technical'
);

CREATE TABLE IF NOT EXISTS student_skills (
  user_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  proficiency DECIMAL(5,2) NOT NULL DEFAULT 0,
  PRIMARY KEY(user_id, skill_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS companies (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER,
  name VARCHAR(160) NOT NULL,
  industry VARCHAR(100),
  location VARCHAR(120),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS opportunities (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id INTEGER,
  title VARCHAR(180) NOT NULL,
  type VARCHAR(20) DEFAULT 'internship'
    CHECK (type IN ('internship','job','training','fellowship','project')),
  location VARCHAR(120),
  description TEXT,
  stipend VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS opportunity_skills (
  opportunity_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  required_level DECIMAL(5,2) NOT NULL DEFAULT 60,
  weight DECIMAL(6,3) NOT NULL DEFAULT 1,
  PRIMARY KEY(opportunity_id, skill_id),
  FOREIGN KEY(opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  opportunity_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'applied'
    CHECK (status IN ('applied','shortlisted','selected','rejected')),
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(opportunity_id, student_id),
  FOREIGN KEY(opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS faculty_programs (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  faculty_user_id INTEGER NOT NULL,
  title VARCHAR(180) NOT NULL,
  type VARCHAR(30) NOT NULL
    CHECK (type IN ('faculty_internship','FDP','research','guest_lecture','mentorship')),
  organization VARCHAR(160),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(faculty_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS institution_events (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_user_id INTEGER NOT NULL,
  title VARCHAR(180) NOT NULL,
  type VARCHAR(30) NOT NULL
    CHECK (type IN ('workshop','hackathon','industry_visit','placement_drive','training')),
  event_date DATE,
  description TEXT,
  FOREIGN KEY(institution_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mentorships (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mentor_user_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  title VARCHAR(180) NOT NULL,
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active','completed')),
  FOREIGN KEY(mentor_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================================
-- SKILLS
-- =========================================================

INSERT INTO skills(name, category) VALUES
('Python','Programming'),
('SQL','Data'),
('React','Web'),
('JavaScript','Web'),
('CSS','Web'),
('Communication','Soft Skill'),
('Machine Learning','AI'),
('Excel','Data'),
('Power BI','Data'),
('Git','Tools'),
('Java','Programming'),
('Cloud','Cloud'),
('Data Structures','CS'),
('Problem Solving','CS')
ON CONFLICT (name) DO NOTHING;

-- =========================================================
-- USERS
-- =========================================================

INSERT INTO users(name,email,password_hash,role,department) VALUES
('Demo Student','demo@student.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 'student','Computer Engineering'),

('Insight HR','industry@insightlabs.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 'industry','Technology'),

('Dr. Faculty','faculty@skillbridge.edu',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 'faculty','Computer Engineering'),

('SkillBridge Institute','institution@skillbridge.edu',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 'institution','Computer Engineering')

ON CONFLICT (email) DO NOTHING;

-- =========================================================
-- COMPANY
-- =========================================================

INSERT INTO companies(user_id,name,industry,location)
SELECT id,'Insight Labs','Analytics & AI','Pune'
FROM users
WHERE email='industry@insightlabs.com'
ON CONFLICT DO NOTHING;

-- =========================================================
-- OPPORTUNITIES
-- =========================================================

INSERT INTO opportunities(company_id,title,type,location,description,stipend)
SELECT c.id,
       'Data Analyst Intern',
       'internship',
       'Pune',
       'Analytics internship with SQL, Excel and Power BI.',
       '₹15,000/month'
FROM companies c
WHERE c.name='Insight Labs'
AND NOT EXISTS (
  SELECT 1 FROM opportunities
  WHERE title='Data Analyst Intern'
);

INSERT INTO opportunities(company_id,title,type,location,description,stipend)
SELECT c.id,
       'Frontend Developer Intern',
       'internship',
       'Hybrid',
       'Build responsive React applications.',
       '₹18,000/month'
FROM companies c
WHERE c.name='Insight Labs'
AND NOT EXISTS (
  SELECT 1 FROM opportunities
  WHERE title='Frontend Developer Intern'
);

INSERT INTO opportunities(company_id,title,type,location,description,stipend)
SELECT c.id,
       'Junior ML Engineer',
       'job',
       'Remote',
       'Entry-level machine learning role.',
       '₹6 LPA'
FROM companies c
WHERE c.name='Insight Labs'
AND NOT EXISTS (
  SELECT 1 FROM opportunities
  WHERE title='Junior ML Engineer'
);

-- =========================================================
-- STUDENT SKILLS
-- =========================================================

INSERT INTO student_skills(user_id,skill_id,proficiency)
SELECT u.id,s.id,
CASE s.name
  WHEN 'Python' THEN 85
  WHEN 'SQL' THEN 80
  WHEN 'React' THEN 60
  WHEN 'Communication' THEN 55
  WHEN 'Machine Learning' THEN 45
  WHEN 'JavaScript' THEN 70
  WHEN 'CSS' THEN 72
  WHEN 'Excel' THEN 65
  WHEN 'Power BI' THEN 50
  WHEN 'Git' THEN 68
  WHEN 'Data Structures' THEN 70
  WHEN 'Problem Solving' THEN 65
  ELSE 40
END
FROM users u
CROSS JOIN skills s
WHERE u.email='demo@student.com'
ON CONFLICT (user_id, skill_id) DO NOTHING;

-- =========================================================
-- OPPORTUNITY SKILLS
-- =========================================================

INSERT INTO opportunity_skills(opportunity_id,skill_id,required_level,weight)
SELECT o.id,s.id,75,1.2
FROM opportunities o
JOIN skills s ON s.name IN ('SQL','Excel','Power BI','Python')
WHERE o.title='Data Analyst Intern'
ON CONFLICT (opportunity_id, skill_id) DO NOTHING;

INSERT INTO opportunity_skills(opportunity_id,skill_id,required_level,weight)
SELECT o.id,s.id,70,1.2
FROM opportunities o
JOIN skills s ON s.name IN ('React','JavaScript','CSS','Git')
WHERE o.title='Frontend Developer Intern'
ON CONFLICT (opportunity_id, skill_id) DO NOTHING;

INSERT INTO opportunity_skills(opportunity_id,skill_id,required_level,weight)
SELECT o.id,s.id,75,1.2
FROM opportunities o
JOIN skills s ON s.name IN ('Python','Machine Learning','Data Structures','Problem Solving')
WHERE o.title='Junior ML Engineer'
ON CONFLICT (opportunity_id, skill_id) DO NOTHING;
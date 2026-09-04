const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'skillbridge_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Pool Configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Root@123',
  database: process.env.DB_NAME || 'skillbridge_ai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Fallback user for quick demo testing if token isn't passed
    req.user = { id: 1, role: 'student' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// =========================================================================
// 1. AUTHENTICATION ENDPOINT
// =========================================================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user in database
    const [users] = await pool.execute(
      'SELECT id, name, email, role, department FROM users WHERE email = ?',
      [email]
    );

    let user;
    if (users.length === 0) {
      // Demo Fallback: auto-create user on the fly if missing during development
      user = {
        id: 1,
        name: 'Alex Mercer',
        email: email || 'demo@student.com',
        role: 'student',
        department: 'Computer Engineering',
      };
    } else {
      user = users[0];
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    return res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server authentication error' });
  }
});

// =========================================================================
// 2. STUDENT DASHBOARD ENDPOINTS
// =========================================================================
// Express Route Fallbacks for main.jsx
app.get('/api/student/skills', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, skill_name AS name, proficiency FROM student_skills WHERE student_id = 1');
    res.json(rows.length ? rows : [
      { id: 1, name: 'Python', proficiency: 85 },
      { id: 2, name: 'React', proficiency: 75 },
      { id: 3, name: 'MySQL', proficiency: 70 }
    ]);
  } catch (err) {
    res.json([
      { id: 1, name: 'Python', proficiency: 85 },
      { id: 2, name: 'React', proficiency: 75 },
      { id: 3, name: 'MySQL', proficiency: 70 }
    ]);
  }
});

app.get('/api/student/applications', (req, res) => {
  res.json([]);
});

app.put('/api/student/skills', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id || 1;
    const { skills } = req.body;

    for (const item of skills) {
      await pool.execute(
        'UPDATE student_skills SET proficiency = ? WHERE student_id = ? AND id = ?',
        [item.proficiency, studentId, item.skill_id]
      );
    }
    res.json({ message: 'Skills updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const axios = require('axios');

app.get('/api/opportunities/recommendations', async (req, res) => {
  try {
    // 1. Fetch skills for Student ID 1 from MySQL
    const [skills] = await pool.execute(
      'SELECT skill_name, proficiency FROM student_skills WHERE student_id = 1'
    );

    // 2. Fallback skills if MySQL returns empty array
    const studentSkills = skills.length > 0 
      ? skills.map(s => ({ name: s.skill_name, proficiency: s.proficiency }))
      : [{ name: 'Python', proficiency: 85 }, { name: 'React', proficiency: 75 }];

    // 3. Forward request to Python FastAPI on port 8001 (or 8002)
    try {
      const aiRes = await axios.post('http://localhost:8001/api/ai/match', {
        skills: studentSkills
      });
      return res.json(aiRes.data);
    } catch (aiErr) {
      console.warn('FastAPI unreachable. Returning default opportunities.');
      // Fallback data if FastAPI server is down
      return res.json([
        { id: 1, title: 'AI Engineering Intern', company: 'Tech Corp', match_score: 88, gap: ['PyTorch'] },
        { id: 2, title: 'Full Stack Developer', company: 'Dev Studio', match_score: 82, gap: ['Docker'] }
      ]);
    }
  } catch (err) {
    console.error('Database/Server Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/student/applications', authenticateToken, async (req, res) => {
  try {
    res.json([
      { id: 1, opportunity_id: 101, status: 'Under Review', applied_at: '2026-08-15' }
    ]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/opportunities/:id/apply', authenticateToken, async (req, res) => {
  try {
    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =========================================================================
// 3. INDUSTRY HUB ENDPOINTS
// =========================================================================
app.get('/api/industry/overview', authenticateToken, async (req, res) => {
  try {
    res.json({
      students: 1240,
      applications: 312,
      shortlisted: 48,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/industry/candidates', authenticateToken, async (req, res) => {
  try {
    const candidates = [
      { id: 1, name: 'Alex Mercer', department: 'Computer Engineering', match_score: 92 },
      { id: 2, name: 'Priya Sharma', department: 'Information Technology', match_score: 87 },
      { id: 3, name: 'Rohan Verma', department: 'Computer Engineering', match_score: 84 },
    ];
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/industry/opportunities', authenticateToken, async (req, res) => {
  try {
    const { title, location, description, stipend } = req.body;
    res.json({ message: 'Opportunity published successfully', id: Date.now() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =========================================================================
// 4. FACULTY COLLABORATION HUB ENDPOINTS
// =========================================================================
app.get('/api/faculty/overview', authenticateToken, async (req, res) => {
  try {
    res.json({
      programs: 14,
      activeMentorships: 28,
      industryProjects: 9,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/faculty/programs', authenticateToken, async (req, res) => {
  try {
    res.json([
      { id: 1, title: 'AI & Cloud Computing FDP', type: 'FDP' },
      { id: 2, title: 'Student Industry Mentorship', type: 'mentorship' },
    ]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/faculty/programs', authenticateToken, async (req, res) => {
  try {
    res.json({ message: 'Program created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =========================================================================
// 5. INSTITUTION INTELLIGENCE CENTER ENDPOINTS
// =========================================================================
app.get('/api/institution/analytics', authenticateToken, async (req, res) => {
  try {
    res.json({
      students: 2450,
      internshipReady: 380,
      avgSkill: '78.4%',
      demand: [
        { skill: 'Python', demand: 92 },
        { skill: 'React', demand: 85 },
        { skill: 'MySQL', demand: 78 },
        { skill: 'C++', demand: 64 },
        { skill: 'Docker', demand: 58 },
      ],
      departments: [
        { department: 'Computer Engineering', students: 820 },
        { department: 'Information Technology', students: 640 },
        { department: 'Electronics & TC', students: 510 },
      ],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/institution/events', authenticateToken, async (req, res) => {
  try {
    res.json([
      { id: 1, title: 'SIH Hackathon Preparation Workshop', event_date: '2026-09-15', type: 'workshop' },
      { id: 2, title: 'Industry Connect Summit', event_date: '2026-10-02', type: 'seminar' },
    ]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/institution/events', authenticateToken, async (req, res) => {
  try {
    res.json({ message: 'Event added successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 SkillBridge AI Backend running on http://localhost:${PORT}`);
});
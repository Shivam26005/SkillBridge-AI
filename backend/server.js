require('dotenv').config();

const bcrypt = require('bcryptjs');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const jwt = require('jsonwebtoken');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured');
}
// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());

// PostgreSQL Pool Configuration
// PostgreSQL Pool Configuration
const dbUrl = new URL(process.env.DATABASE_URL);

dbUrl.search = '';

const pool = new Pool({
  host: dbUrl.hostname,
  port: dbUrl.port,
  database: dbUrl.pathname.slice(1),
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),

  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(path.join(__dirname, 'ca.pem'), 'utf8')
  }
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err){
       return res.status(403).json({
         message: 'Invalid or expired token' 
      });
    }

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

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, password_hash, role, department
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    const passwordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: '1d'
      }
    );

    delete user.password_hash;

    return res.json({
      token,
      user
    });

  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Server authentication error'
    });
  }
});

// =========================================================================
// 2. USER REGISTRATION
// =========================================================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'Name, email, password and role are required'
      });
    }

    // Validate role
    const allowedRoles = [
      'student',
      'industry',
      'faculty',
      'institution'
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid role'
      });
    }

    // Check whether email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users
       (name, email, password_hash, role, department)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, department`,
      [
        name,
        email,
        passwordHash,
        role,
        department || null
      ]
    );

    const user = result.rows[0];

    // Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: '1d'
      }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user
    });

  } catch (error) {
    console.error('Registration error:', error);

    res.status(500).json({
      message: 'Server registration error'
    });
  }
});

// =========================================================================
// 2. STUDENT DASHBOARD ENDPOINTS
// =========================================================================
// Express Route Fallbacks for main.jsx
app.get('/api/student/skills',authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        ss.proficiency
      FROM student_skills ss
      JOIN skills s ON ss.skill_id = s.id
      WHERE ss.user_id = $1
      ORDER BY s.id
    `, [studentId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Student skills error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/student/applications',authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id,
        a.opportunity_id,
        o.title,
        c.name AS company,
        a.status,
        a.applied_at
      FROM applications a
      JOIN opportunities o
        ON a.opportunity_id = o.id
      JOIN companies c
        ON o.company_id = c.id
      WHERE a.student_id = $1
      ORDER BY a.applied_at DESC
    `, [req.user.id]);

    res.json(result.rows);

  } catch (err) {
    console.error('Applications error:', err);
    res.status(500).json({
      message: err.message
    });
  }
});

app.put('/api/student/skills', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id || 1;
    const { skills } = req.body;

    for (const item of skills) {
      await pool.query(
        `UPDATE student_skills
        SET proficiency = $1
        WHERE user_id = $2
        AND skill_id = $3`,
        [item.proficiency, studentId, item.skill_id]
      );
    }
    res.json({ message: 'Skills updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/opportunities/recommendations',authenticateToken, async (req, res) => {
  try {
    // 1. Get student's skills from PostgreSQL
    const studentResult = await pool.query(`
      SELECT 
        s.name AS skill_name,
        ss.proficiency
      FROM student_skills ss
      JOIN skills s ON ss.skill_id = s.id
      WHERE ss.user_id = $1
    `, [req.user.id]);

    const studentSkills = studentResult.rows.map(skill => ({
      name: skill.skill_name,
      proficiency: Number(skill.proficiency)
    }));

    // 2. Get all opportunities and their required skills
    const opportunityResult = await pool.query(`
      SELECT
        o.id AS opportunity_id,
        o.title,
        o.description,
        o.location,
        o.stipend,
        c.name AS company_name,
        s.name AS skill_name,
        os.required_level
      FROM opportunities o
      JOIN companies c
        ON o.company_id = c.id
      JOIN opportunity_skills os
        ON o.id = os.opportunity_id
      JOIN skills s
        ON os.skill_id = s.id
      ORDER BY o.id
    `);

    // 3. Group skills under each opportunity
    const opportunities = {};

    for (const row of opportunityResult.rows) {
      if (!opportunities[row.opportunity_id]) {
        opportunities[row.opportunity_id] = {
          id: row.opportunity_id,
          title: row.title,
          description: row.description,
          location: row.location,
          stipend: row.stipend,
          company: row.company_name,
          job_requirements: []
        };
      }

      opportunities[row.opportunity_id].job_requirements.push({
        skill: row.skill_name,
        required_level: Number(row.required_level)
      });
    }

    // 4. Send each opportunity to FastAPI AI
    const recommendations = [];

    for (const opportunity of Object.values(opportunities)) {
      try {
        const aiRes = await axios.post(
          `${process.env.AI_SERVICE_URL}/api/ai/match`,
          {
            student_skills: studentSkills,
            job_requirements: opportunity.job_requirements
          },
          {
            timeout: 5000
          }
        );

        const learningMap = {
          Excel: [
            'Excel formulas and functions',
            'Pivot Tables',
            'Data cleaning and analysis'
          ],

          'Power BI': [
            'Power Query',
            'DAX fundamentals',
            'Dashboard development'
          ],

          Python: [
            'Python functions and OOP',
            'NumPy and Pandas',
            'Data analysis projects'
          ],

          SQL: [
            'SQL joins',
            'GROUP BY and aggregate functions',
            'Subqueries and advanced SQL'
          ],

          React: [
            'React components',
            'Hooks and state management',
            'Building React projects'
          ],

          JavaScript: [
            'ES6 fundamentals',
            'Async/Await',
            'DOM and API integration'
          ],

          CSS: [
            'Flexbox',
            'CSS Grid',
            'Responsive web design'
          ],

          Git: [
            'Git fundamentals',
            'Branching and merging',
            'Pull requests and collaboration'
          ],

          'Machine Learning': [
            'Data preprocessing',
            'Regression and classification',
            'Model evaluation'
          ],

          'Data Structures': [
            'Arrays and linked lists',
            'Stacks and queues',
            'Trees and problem solving'
          ],

          'Problem Solving': [
            'Time complexity',
            'Problem-solving patterns',
            'Competitive programming practice'
          ]
        };

        const enhancedGaps = (aiRes.data.skill_gaps || []).map((gap) => ({
          ...gap,
          learning_path:
            learningMap[gap.skill] || [
              `Fundamentals of ${gap.skill}`,
              `Intermediate ${gap.skill} concepts`,
              `Practice ${gap.skill} through projects`
            ]
        }));

        recommendations.push({
          id: opportunity.id,
          title: opportunity.title,
          company: opportunity.company,
          description: opportunity.description,
          location: opportunity.location,
          stipend: opportunity.stipend,
          match_score: aiRes.data.match_score,
          skill_gaps: enhancedGaps
        });

      } catch (aiErr) {
        console.error(
          `AI matching failed for opportunity ${opportunity.id}:`,
          aiErr.message
        );

        // Fallback matching if AI service is temporarily unavailable
        let totalWeight = 0;
        let acquiredWeight = 0;
        const fallbackGaps = [];

        const studentMap = {};

        for (const skill of studentSkills) {
          studentMap[skill.name.toLowerCase()] = Number(skill.proficiency);
        }

        for (const req of opportunity.job_requirements) {
          const required = Number(req.required_level);
          const current =
            studentMap[req.skill.toLowerCase()] || 0;

          totalWeight += required;
          acquiredWeight += Math.min(current, required);

          if (current < required) {
            fallbackGaps.push({
              skill: req.skill,
              gap: Number((required - current).toFixed(1)),
              current,
              required
            });
          }
        }

        const fallbackScore =
          totalWeight > 0
            ? Number(((acquiredWeight / totalWeight) * 100).toFixed(1))
            : 0;

        recommendations.push({
          id: opportunity.id,
          title: opportunity.title,
          company: opportunity.company,
          description: opportunity.description,
          location: opportunity.location,
          stipend: opportunity.stipend,
          match_score: fallbackScore,
          skill_gaps: fallbackGaps
        });
      }
    }

    // 5. Highest matching opportunities first
    recommendations.sort(
      (a, b) => b.match_score - a.match_score
    );

    res.json(recommendations);

  } catch (err) {
    console.error('Recommendation error:', err);
    res.status(500).json({
      error: err.message
    });
  }
});

app.post('/api/opportunities/:id/apply', authenticateToken, async (req, res) => {
  try {
    const opportunityId = Number(req.params.id);

    // Get the logged-in student's ID from the JWT
    const studentId = req.user.id;

    // Check if the opportunity exists
    const opportunity = await pool.query(
      'SELECT id FROM opportunities WHERE id = $1',
      [opportunityId]
    );

    if (opportunity.rows.length === 0) {
      return res.status(404).json({
        message: 'Opportunity not found'
      });
    }

    // Prevent duplicate applications
    const existing = await pool.query(
      `SELECT id
       FROM applications
       WHERE opportunity_id = $1
       AND student_id = $2`,
      [opportunityId, studentId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: 'You have already applied for this opportunity'
      });
    }

    // Insert application
    await pool.query(
      `INSERT INTO applications
       (opportunity_id, student_id, status)
       VALUES ($1, $2, $3)`,
      [opportunityId, studentId, 'applied']
    );

    res.json({
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Apply error:', error);

    res.status(500).json({
      message: error.message
    });
  }
});
// =========================================================================
// 3. INDUSTRY HUB ENDPOINTS
// =========================================================================
app.get('/api/skills', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name
      FROM skills
      ORDER BY name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Skills error:', error);
    res.status(500).json({
      message: error.message
    });
  }
});

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
app.get('/api/industry/candidates/:opportunityId', authenticateToken, async (req, res) => {
  try {
    const opportunityId = Number(req.params.opportunityId);

    if (!opportunityId) {
      return res.status(400).json({
        message: 'Invalid opportunity ID'
      });
    }

    // Get required skills for this opportunity
    const requirementsResult = await pool.query(`
      SELECT
        s.name,
        os.required_level,
        os.weight
      FROM opportunity_skills os
      JOIN skills s
        ON os.skill_id = s.id
      WHERE os.opportunity_id = $1
      ORDER BY s.name
    `, [opportunityId]);

    const requirements = requirementsResult.rows;

    if (requirements.length === 0) {
      return res.json([]);
    }

    // Get all students and their skills
    const studentsResult = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.department,
        a.id AS application_id,
        a.status AS application_status,
        s.name AS skill,
        ss.proficiency
      FROM users u
      JOIN student_skills ss
        ON u.id = ss.user_id
      JOIN skills s
        ON ss.skill_id = s.id
      LEFT JOIN applications a
        ON a.student_id = u.id
        AND a.opportunity_id = $1
      WHERE u.role = 'student'
      ORDER BY u.id
    `, [opportunityId]);

    // Group skills by student
    const students = {};

    for (const row of studentsResult.rows) {

      if (!students[row.id]) {
        students[row.id] = {
          id: row.id,
          name: row.name,
          email: row.email,
          department: row.department,
          application_id: row.application_id,
          application_status: row.application_status,
          skills: {}
        };
      }

      students[row.id].skills[row.skill.toLowerCase()] =
        Number(row.proficiency);
    }

    // Calculate weighted match score
    const ranked = Object.values(students).map(student => {

      let totalWeight = 0;
      let achievedWeight = 0;
      const skillGaps = [];

      for (const req of requirements) {

        const required = Number(req.required_level);
        const weight = Number(req.weight) || 1;

        const current =
          student.skills[req.name.toLowerCase()] || 0;

        totalWeight += required * weight;

        achievedWeight +=
          Math.min(current, required) * weight;

        if (current < required) {
          skillGaps.push({
            skill: req.name,
            current,
            required,
            gap: Number((required - current).toFixed(1))
          });
        }
      }

      const matchScore =
        totalWeight > 0
          ? Number(((achievedWeight / totalWeight) * 100).toFixed(1))
          : 0;

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        department: student.department,
        application_id: student.application_id,
        application_status: student.application_status,
        match_score: matchScore,
        skill_gaps: skillGaps
      };

    });

    ranked.sort(
      (a, b) => b.match_score - a.match_score
    );

    res.json(ranked);

  } catch (error) {

    console.error('Candidate ranking error:', error);

    res.status(500).json({
      message: error.message
    });

  }
});

app.put('/api/industry/applications/:applicationId/shortlist', authenticateToken, async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);

    if (!applicationId) {
      return res.status(400).json({
        message: 'Invalid application ID'
      });
    }

    const result = await pool.query(
      `UPDATE applications
       SET status = 'shortlisted'
       WHERE id = $1
       RETURNING id, opportunity_id, student_id, status`,
      [applicationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Application not found'
      });
    }

    res.json({
      message: 'Candidate shortlisted successfully',
      application: result.rows[0]
    });

  } catch (error) {
    console.error('Shortlist error:', error);

    res.status(500).json({
      message: error.message
    });
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
  const client = await pool.connect();

  try {
    const {
      title,
      type,
      location,
      description,
      stipend,
      requiredSkills
    } = req.body;

    if (!title || !location || !description) {
      return res.status(400).json({
        message: 'Title, location and description are required'
      });
    }

    if (
      !Array.isArray(requiredSkills) ||
      requiredSkills.length === 0
    ) {
      return res.status(400).json({
        message: 'At least one required skill must be selected'
      });
    }

    const companyResult = await client.query(
      `SELECT id
       FROM companies
       ORDER BY id
       LIMIT 1`
    );

    if (companyResult.rows.length === 0) {
      return res.status(400).json({
        message: 'No company found'
      });
    }

    const companyId = companyResult.rows[0].id;

    await client.query('BEGIN');

    const opportunityResult = await client.query(
      `INSERT INTO opportunities
       (company_id, title, description, location, stipend)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, location, stipend`,
      [
        companyId,
        title,
        description,
        location,
        stipend || null
      ]
    );

    const opportunityId = opportunityResult.rows[0].id;

    for (const skill of requiredSkills) {
      await client.query(
        `INSERT INTO opportunity_skills
         (opportunity_id, skill_id, required_level, weight)
         VALUES ($1, $2, $3, $4)`,
        [
          opportunityId,
          Number(skill.skill_id),
          Number(skill.required_level),
          Number(skill.weight)
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Opportunity created successfully',
      opportunity: opportunityResult.rows[0],
      requiredSkills
    });

  } catch (error) {

    await client.query('ROLLBACK');

    console.error('Create opportunity error:', error);

    res.status(500).json({
      message: error.message
    });

  } finally {
    client.release();
  }
});

app.get('/api/industry/opportunities', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.id,
        o.title,
        o.description,
        o.location,
        o.stipend,
        c.name AS company
      FROM opportunities o
      JOIN companies c
        ON o.company_id = c.id
      ORDER BY o.id DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error('Industry opportunities error:', error);

    res.status(500).json({
      message: error.message
    });
  }
});

// =========================================================================
// 4. FACULTY COLLABORATION HUB ENDPOINTS
// =========================================================================
app.get('/api/faculty/overview', authenticateToken, async (req, res) => {
  try {
    const programsResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM faculty_programs
       WHERE faculty_user_id = $1`,
      [req.user.id]
    );

    const mentorshipResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM mentorships
       WHERE mentor_user_id = $1`,
      [req.user.id]
    );

    res.json({
      programs: Number(programsResult.rows[0].count),
      activeMentorships: Number(mentorshipResult.rows[0].count),
      industryProjects: 0
    });

  } catch (error) {
    console.error('Faculty overview error:', error);

    res.status(500).json({
      message: error.message
    });
  }
});

app.post('/api/faculty/programs', authenticateToken, async (req, res) => {
  try {
    const { title, type, organization, description } = req.body;

    if (!title || !type) {
      return res.status(400).json({
        message: 'Title and type are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO faculty_programs
       (faculty_user_id, title, type, organization, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.user.id,
        title,
        type,
        organization || null,
        description || null
      ]
    );

    res.status(201).json({
      message: 'Program created successfully',
      program: result.rows[0]
    });

  } catch (error) {
    console.error('Faculty program creation error:', error);

    res.status(500).json({
      message: error.message
    });
  }
});

app.get('/api/faculty/programs', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         title,
         type,
         organization,
         description,
         created_at
       FROM faculty_programs
       WHERE faculty_user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Faculty programs error:', error);

    res.status(500).json({
      message: error.message
    });
  }
});

// =========================================================================
// 5. INSTITUTION INTELLIGENCE CENTER ENDPOINTS
// =========================================================================
app.get('/api/institution/analytics', authenticateToken, async (req, res) => {
  try {
    // Total students
    const studentsResult = await pool.query(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE role = 'student'
    `);

    // Internship-ready students
    // Students who have at least one shortlisted or selected application
    const readyResult = await pool.query(`
      SELECT COUNT(DISTINCT student_id) AS count
      FROM applications
      WHERE status IN ('shortlisted', 'selected')
    `);

    // Average skill proficiency
    const avgSkillResult = await pool.query(`
      SELECT ROUND(AVG(proficiency), 1) AS average
      FROM student_skills
    `);

    // Department distribution
    const departmentResult = await pool.query(`
      SELECT
        COALESCE(department, 'Unspecified') AS department,
        COUNT(*) AS students
      FROM users
      WHERE role = 'student'
      GROUP BY department
      ORDER BY students DESC
    `);

    // Skill demand based on opportunity requirements
    const demandResult = await pool.query(`
      SELECT
        s.name AS skill,
        COUNT(os.opportunity_id) AS demand
      FROM opportunity_skills os
      JOIN skills s
        ON os.skill_id = s.id
      GROUP BY s.id, s.name
      ORDER BY demand DESC
      LIMIT 5
    `);

    res.json({
      students: Number(studentsResult.rows[0].count),

      internshipReady: Number(
        readyResult.rows[0].count
      ),

      avgSkill: `${Number(
        avgSkillResult.rows[0].average || 0
      ).toFixed(1)}%`,

      demand: demandResult.rows.map(row => ({
        skill: row.skill,
        demand: Number(row.demand)
      })),

      departments: departmentResult.rows.map(row => ({
        department: row.department,
        students: Number(row.students)
      }))
    });

  } catch (error) {
    console.error('Institution analytics error:', error);

    res.status(500).json({
      message: error.message
    });
  }
});

app.get('/api/institution/events', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         title,
         type,
         event_date,
         description
       FROM institution_events
       WHERE institution_user_id = $1
       ORDER BY event_date ASC, id DESC`,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Institution events error:', error);

    res.status(500).json({
      message: error.message
    });
  }
});


app.post('/api/institution/events', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      type,
      event_date,
      description
    } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({
        message: 'Title and event date are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO institution_events
       (
         institution_user_id,
         title,
         type,
         event_date,
         description
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.user.id,
        title,
        type || 'workshop',
        event_date,
        description || null
      ]
    );

    res.status(201).json({
      message: 'Event added successfully',
      event: result.rows[0]
    });

  } catch (error) {
    console.error('Institution event creation error:', error);

    res.status(500).json({
      message: error.message
    });
  }
});
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS current_time');

    res.json({
      connected: true,
      message: 'Aiven PostgreSQL connected successfully',
      time: result.rows[0].current_time
    });
  } catch (error) {
    console.error('DATABASE ERROR:', error);

    res.status(500).json({
      connected: false,
      error: error.message || 'Unknown database error',
      code: error.code || 'NO_ERROR_CODE'
    });
  }
});
// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 SkillBridge AI Backend running on http://localhost:${PORT}`);
});


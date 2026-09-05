import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
async function api(path, opt = {}) {
  const token = localStorage.getItem('token');

  const r = await fetch(API + path, {
    ...opt,
    headers: {
      'content-type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(opt.headers || {})
    }
  });

  const d = await r.json();

  if (!r.ok) {
    throw Error(d.message || 'Request failed');
  }

  return d;
}


/* =========================
   LOGIN
========================= */

function Login({ onLogin }) {
  const [email, setEmail] = useState('demo@student.com');
  const [password, setPassword] = useState('demo');
  const [role, setRole] = useState('student');
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();

    try {
      const d = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password
        })
      });

      if (d.user.role !== role) {
        setErr('Selected role does not match this account.');
        return;
      }

      localStorage.setItem('token', d.token);
      localStorage.setItem('user', JSON.stringify(d.user));

      onLogin(d.user);
    } catch (x) {
      setErr(x.message);
    }
  }

  return (
    <div className="login">
      <div className="loginCard">

        <div className="logo">SB</div>

        <h1>SkillBridge AI</h1>

        <p>From Skills to Opportunities</p>

        <div className="roleGrid">
          {['student', 'industry', 'faculty', 'institution'].map((r) => (
            <button
              key={r}
              type="button"
              className={role === r ? 'role active' : 'role'}
              onClick={() => setRole(r)}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={submit}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
          />

          <button className="primary" type="submit">
            Sign in
          </button>
        </form>

        {err && <div className="error">{err}</div>}

        <small>Demo passwords: demo</small>

      </div>
    </div>
  );
}

function SignUp({ onLogin, onBack , onLoginPage }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError('Please fill all required fields.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      const d = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          department: form.department
        })
      });

      localStorage.setItem('token', d.token);
      localStorage.setItem('user', JSON.stringify(d.user));

      onLogin(d.user);

    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">

      <div className="auth-card">

        <button
          className="back-home"
          onClick={onBack}
        >
          ← Back to Home
        </button>

        <div className="auth-header">
          <div className="auth-logo">SB</div>

          <h1>Create your SkillBridge account</h1>

          <p>
            Join the platform connecting skills,
            education and opportunities.
          </p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <label>Full Name</label>

          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
          />

          <label>Email</label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
          />

          <label>I am a</label>

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            <option value="student">Student</option>
            <option value="industry">Industry</option>
            <option value="faculty">Faculty</option>
            <option value="institution">Institution</option>
          </select>

          <label>Department / Organization</label>

          <input
            type="text"
            name="department"
            placeholder="Optional"
            value={form.department}
            onChange={handleChange}
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            placeholder="Create a password"
            value={form.password}
            onChange={handleChange}
          />

          <label>Confirm Password</label>

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={form.confirmPassword}
            onChange={handleChange}
          />

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

        </form>

        <p className="auth-footer">
          Already have an account?
          <button
            type="button"
            onClick={onLoginPage}
          >
            Back to Login
          </button>
        </p>

      </div>

    </div>
  );
}


/* =========================
   PUBLIC LANDING PAGE
========================= */

function LandingPage({ onLogin, onSignUp }) {
  return (
    <div className="landing-page">

      {/* NAVBAR */}
      <nav className="landing-nav">
        <div className="landing-brand">
          <span>SB</span>
          <strong>SkillBridge AI</strong>
        </div>

        <div className="landing-links">
          <a href="#home">Home</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#features">Features</a>
          <a href="#roles">For Everyone</a>
          <a href="#about">About</a>
        </div>

        <div className="landing-actions">
          <button
            className="landing-login"
            onClick={onLogin}
          >
            Login
          </button>

          <button
            className="landing-signup"
            onClick={onSignUp}
          >
            Sign Up
          </button>
        </div>
      </nav>


      {/* HERO */}
      <section className="landing-hero" id="home">

        <div className="hero-content">

          <div className="landing-badge">
            🚀 AI-Powered Skill Intelligence Platform
          </div>

          <h1>
            Bridge the Gap Between
            <span> Skills & Opportunities</span>
          </h1>

          <p>
            SkillBridge AI connects students, academia and industry
            through intelligent skill mapping, personalized learning,
            internships and placement opportunities.
          </p>

          <div className="hero-buttons">

            <button
              className="hero-primary"
              onClick={onSignUp}
            >
              Get Started →
            </button>

            <button
              className="hero-secondary"
              onClick={onLogin}
            >
              Explore Platform
            </button>

          </div>

          <div className="hero-trust">
            <span>✓ Skill Mapping</span>
            <span>✓ AI Matching</span>
            <span>✓ Career Readiness</span>
          </div>

        </div>


        

      </section>


      {/* WHY SKILLBRIDGE */}
      <section className="landing-section" id="features">

        <div className="section-heading">

          <div className="landing-badge">
            WHY SKILLBRIDGE?
          </div>

          <h2>
            One platform. The complete career journey.
          </h2>

          <p>
            From identifying skill gaps to discovering the right
            opportunity, SkillBridge brings the entire ecosystem together.
          </p>

        </div>


        <div className="feature-grid">

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>AI Skill Mapping</h3>
            <p>
              Understand current skills, identify gaps and discover
              what skills are required for your target career.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered Matching</h3>
            <p>
              Match student capabilities with relevant internships,
              projects and industry opportunities.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Personalized Learning</h3>
            <p>
              Get targeted learning paths based on your skill gaps
              and career goals.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💼</div>
            <h3>Internships & Placements</h3>
            <p>
              Discover relevant opportunities and improve your
              readiness for real-world careers.
            </p>
          </div>

        </div>

      </section>


      {/* HOW IT WORKS */}
      <section className="landing-section workflow-section" id="how-it-works">

        <div className="section-heading">

          <div className="landing-badge">
            HOW IT WORKS
          </div>

          <h2>
            From skills to opportunities
          </h2>

        </div>


        <div className="workflow">

          <div className="workflow-step">
            <div>01</div>
            <h3>Assess</h3>
            <p>Evaluate your current skills and capabilities.</p>
          </div>

          <div className="workflow-arrow">→</div>

          <div className="workflow-step">
            <div>02</div>
            <h3>Analyze</h3>
            <p>AI identifies your skill gaps and career readiness.</p>
          </div>

          <div className="workflow-arrow">→</div>

          <div className="workflow-step">
            <div>03</div>
            <h3>Learn</h3>
            <p>Follow a personalized roadmap to close skill gaps.</p>
          </div>

          <div className="workflow-arrow">→</div>

          <div className="workflow-step">
            <div>04</div>
            <h3>Match</h3>
            <p>Find opportunities aligned with your capabilities.</p>
          </div>

          <div className="workflow-arrow">→</div>

          <div className="workflow-step">
            <div>05</div>
            <h3>Place</h3>
            <p>Connect with industry for internships and careers.</p>
          </div>

        </div>

      </section>


      {/* ROLES */}
      <section className="landing-section" id="roles">

        <div className="section-heading">

          <div className="landing-badge">
            BUILT FOR THE COMPLETE ECOSYSTEM
          </div>

          <h2>
            Everyone has a role in the SkillBridge ecosystem.
          </h2>

        </div>


        <div className="role-cards">

          <div className="ecosystem-card">
            <div className="ecosystem-icon">🎓</div>
            <h3>Students</h3>
            <p>
              Build skills, identify gaps, discover internships
              and become career-ready.
            </p>
          </div>

          <div className="ecosystem-card">
            <div className="ecosystem-icon">🏢</div>
            <h3>Industry</h3>
            <p>
              Discover skilled candidates and connect with
              emerging talent.
            </p>
          </div>

          <div className="ecosystem-card">
            <div className="ecosystem-icon">👨‍🏫</div>
            <h3>Faculty</h3>
            <p>
              Collaborate with industry and create programs
              aligned with real skill demand.
            </p>
          </div>

          <div className="ecosystem-card">
            <div className="ecosystem-icon">🏫</div>
            <h3>Institutions</h3>
            <p>
              Monitor skill trends, student readiness and
              industry collaboration.
            </p>
          </div>

        </div>

      </section>


      {/* CAREER GAP SIMULATOR */}
      <section className="career-section" id="about">

        <div className="career-content">

          <div className="landing-badge">
            CAREER GAP SIMULATOR
          </div>

          <h2>
            Know exactly what stands between you and your dream role.
          </h2>

          <p>
            SkillBridge analyzes your current capabilities against
            industry requirements and turns the gap into an actionable
            learning roadmap.
          </p>

          <button
            className="hero-primary"
            onClick={onSignUp}
          >
            Check Your Readiness →
          </button>

        </div>


        <div className="career-card">

          <div className="career-card-top">
            <span>Target Role</span>
            <strong>Full Stack Developer</strong>
          </div>

          <div className="career-score">
            <span>Current Readiness</span>
            <strong>72%</strong>
          </div>

          <div className="skill-gap">

            <div>
              <span>React.js</span>
              <b>85%</b>
            </div>

            <div className="mini-progress">
              <span style={{ width: '85%' }}></span>
            </div>

            <div>
              <span>Node.js</span>
              <b>68%</b>
            </div>

            <div className="mini-progress">
              <span style={{ width: '68%' }}></span>
            </div>

            <div>
              <span>System Design</span>
              <b>48%</b>
            </div>

            <div className="mini-progress">
              <span style={{ width: '48%' }}></span>
            </div>

          </div>

        </div>

      </section>


      {/* CTA */}
      <section className="landing-cta">

        <h2>
          Ready to bridge the gap?
        </h2>

        <p>
          Start your journey from skills to meaningful opportunities.
        </p>

        <button
          className="hero-primary"
          onClick={onSignUp}
        >
          Create Your Account →
        </button>

      </section>


      {/* FOOTER */}
      <footer className="landing-footer">

        <div>
          <div className="landing-brand">
            <span>SB</span>
            <strong>SkillBridge AI</strong>
          </div>

          <p>
            AI-powered skill mapping for academia, students and industry.
          </p>
        </div>

        <div className="footer-links">
          <span>SIH 2026</span>
          <span>Skill Intelligence</span>
          <span>Academia + Industry</span>
        </div>

      </footer>

    </div>
  );
}

/* =========================
   HERO
========================= */

function HeroBanner({ role }) {
  return (
    <section className="hero">

      <div>
        <div className="eyebrow">
          SIH 2026 • SKILL INTELLIGENCE
        </div>

        <h1>
          Turn skill gaps into real opportunities.
        </h1>

        <p>
          SkillBridge AI connects assessment, learning,
          mentorship, internships and placement in one
          explainable career loop.
        </p>
      </div>

      <div className="heroFlow">
        <span>Assess</span>
        <i>→</i>
        <span>Analyze</span>
        <i>→</i>
        <span>Learn</span>
        <i>→</i>
        <span>Match</span>
        <i>→</i>
        <span>Place</span>
      </div>

    </section>
  );
}


/* =========================
   LAYOUT
========================= */

function Layout({ user, onLogout, children }) {
  return (
    <>
      <header>

        <div className="brand">
          <span>SB</span> SkillBridge AI
        </div>

        <div>
          {user.name} · <b>{user.role}</b>{' '}

          <button onClick={onLogout}>
            Logout
          </button>
        </div>

      </header>

      <main>
        {children}
      </main>
    </>
  );
}


/* =========================
   CARD
========================= */

function Card({ title, value, sub }) {
  return (
    <div className="card stat">

      <div>{title}</div>

      <strong>{value}</strong>

      <small>{sub}</small>

    </div>
  );
}


/* =========================
   STUDENT
========================= */

function Student() {

  const [skills, setSkills] = useState([]);
  const [recs, setRecs] = useState([]);
  const [apps, setApps] = useState([]);
  const [tab, setTab] = useState('overview');

  useEffect(() => {

    Promise.all([
      api('/student/skills'),
      api('/opportunities/recommendations'),
      api('/student/applications')
    ])
      .then(([skillsData, recommendationsData, applicationsData]) => {

        console.log('Student Skills:', skillsData);
        console.log('AI Recommendations:', recommendationsData);
        console.log('Applications:', applicationsData);

        setSkills(skillsData);
        setRecs(recommendationsData);
        setApps(applicationsData);

      })
      .catch((error) => {
        console.error('Student dashboard error:', error);
      });

  }, []);


  async function save() {

    try {

      await api('/student/skills', {
        method: 'PUT',
        body: JSON.stringify({
          skills: skills.map((s) => ({
            skill_id: s.id,
            proficiency: Number(s.proficiency)
          }))
        })
      });

      alert('Skills saved');

      const updatedRecommendations =
        await api('/opportunities/recommendations');

      setRecs(updatedRecommendations);

    } catch (error) {

      console.error('Save skills error:', error);

      alert('Failed to save skills');

    }
  }


  return (
    <div className="student-dashboard">

      <HeroBanner role="student" />


      {/* Navigation */}

      <nav>

        {[
          'overview',
          'assessment',
          'opportunities',
          'portfolio'
        ].map((t) => (

          <button
            key={t}
            className={tab === t ? 'tab on' : 'tab'}
            onClick={() => setTab(t)}
          >
            {t}
          </button>

        ))}

      </nav>


      {/* =========================
          OVERVIEW
      ========================= */}

      {tab === 'overview' && (

        <>

          <h2>
            Student Command Center 🎓
          </h2>


          <div className="stats">

            <Card
              title="Skills tracked"
              value={skills.length}
              sub="Your profile signals"
            />


            <Card
              title="Top match"
              value={
                recs.length > 0
                  ? `${Number(recs[0].match_score).toFixed(1)}%`
                  : '0%'
              }
              sub={
                recs[0]?.title || 'No match yet'
              }
            />


            <Card
              title="Applications"
              value={apps.length}
              sub="Tracked applications"
            />

          </div>


          <section className="panel">

            <h3>
              AI Career Gap
            </h3>

            <p>
              Pick an opportunity in the Opportunities
              tab to see where your strongest skill gaps are.
            </p>


            {recs.slice(0, 3).map((r) => (

              <div
                className="row"
                key={r.id}
              >

                <b>
                  {r.title}
                </b>

                <span className="badge">
                  {Number(r.match_score).toFixed(1)}% match
                </span>

              </div>

            ))}


            {recs.length === 0 && (

              <p>
                No AI recommendations available.
              </p>

            )}

          </section>

        </>

      )}


      {/* =========================
          ASSESSMENT
      ========================= */}

      {tab === 'assessment' && (

        <section className="panel">

          <h2>
            Skill Assessment
          </h2>

          <p>
            Rate each skill from 0 to 100.
          </p>


          {skills.map((s) => (

            <div
              className="skill"
              key={s.id}
            >

              <label>

                <span>
                  {s.name}
                </span>

                <b>
                  {Number(s.proficiency).toFixed(0)}
                </b>

              </label>


              <input
                type="range"
                min="0"
                max="100"
                value={s.proficiency}
                onChange={(e) => {

                  const value = Number(e.target.value);

                  setSkills(
                    skills.map((x) =>
                      x.id === s.id
                        ? {
                            ...x,
                            proficiency: value
                          }
                        : x
                    )
                  );

                }}
              />

            </div>

          ))}


          <button
            className="primary"
            onClick={save}
          >
            Save & Recalculate
          </button>

        </section>

      )}

      {tab === 'opportunities' && (
        <div className="dashboard-page">

          <div className="page-heading">
            <span className="page-label">AI CAREER MATCHING</span>
            <h2>Recommended Opportunities</h2>
            <p>
              Opportunities matched with your skills, proficiency and career goals.
            </p>
          </div>

          {recs.length > 0 ? (
            <div className="opportunity-grid">
              {recs.map((job) => (
                <div className="portal-opportunity" key={job.id}>

                  <div className="opportunity-top">
                    <div>
                      <h3>{job.title}</h3>
                      <p>{job.company}</p>
                    </div>

                    <div className="match-score">
                      {job.match_score}%
                      <small>AI Match</small>
                    </div>
                  </div>

                  <p className="opportunity-description">
                    {job.description}
                  </p>

                  <div className="opportunity-details">
                    <span>📍 {job.location}</span>
                    <span>💰 {job.stipend}</span>
                  </div>

                  <button className="primary">
                    View Opportunity
                  </button>

                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No recommendations yet</h3>
              <p>
                Complete your profile and skill assessment to receive
                AI-powered opportunities.
              </p>
            </div>
          )}

        </div>
      )}

      


      {/* =========================
          OPPORTUNITIES
      ========================= */}

      {tab === 'opportunities' && (

        <section>

          <h2>
            AI-Matched Opportunities 🚀
          </h2>


          {recs.map((r) => (

            <div
              className="op"
              key={r.id}
            >

              <div>

                <h3>
                  {r.title}
                </h3>


                <p>
                  {r.company} · {r.location}
                </p>


                <p>
                  {r.description}
                </p>

              </div>


              <div className="match">

                {Number(r.match_score).toFixed(1)}%

                <small>
                  match
                </small>


                <button
                  type="button"
                  onClick={async () => {
                    console.log('Apply clicked for opportunity:', r.id);

                    try {
                      const result = await api(
                        '/opportunities/' + r.id + '/apply',
                        {
                          method: 'POST'
                        }
                      );

                      console.log('Application response:', result);
                      alert('Applied successfully!');

                      const updatedApplications =
                        await api('/student/applications');

                      console.log(
                        'Updated applications:',
                        updatedApplications
                      );

                      setApps(updatedApplications);

                    } catch (error) {
                      console.error('Apply error:', error);
                      alert('Application failed: ' + error.message);
                    }
                  }}
                >
                  Apply
                </button>

              </div>


              {/* Skill Gaps */}
            <div className="tags">
              {(r.skill_gaps || []).map((x) => (
                <span key={x.skill}>
                  {x.skill} gap {Math.round(x.gap)}
                </span>
              ))}
            </div>

            {/* AI Learning Recommendations */}
            {(r.skill_gaps || []).length > 0 && (
              <div className="learningBox">
                <h4>🎯 AI Learning Recommendations</h4>

                {r.skill_gaps.map((x) => (
                  <div className="learningItem" key={x.skill}>

                    <div className="learningContent">
                      <div className="learningHeader">
                        <b>{x.skill}</b>

                        <span className="priority">
                          {x.gap >= 20
                            ? '🔴 High Priority'
                            : x.gap >= 10
                            ? '🟡 Medium Priority'
                            : '🟢 Low Priority'}
                        </span>
                      </div>

                      <p>
                        Current: {x.current} · Required: {x.required} ·
                        Gap: {Math.round(x.gap)}
                      </p>

                      <strong>Learning Path</strong>

                      <ul>
                        {(x.learning_path || []).map((topic, index) => (
                          <li key={index}>
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                ))}
              </div>
            )}

              {(r.skill_gaps || []).length > 0 && (

                <div className="learningBox">

                  <h4>🎯 AI Learning Recommendations</h4>

                  {r.skill_gaps.map((x) => (

                    <div
                      className="learningItem"
                      key={x.skill}
                    >

                      <div>

                        <b>
                          {x.skill}
                        </b>

                        <p>
                          Current: {x.current} ·
                          Required: {x.required} ·
                          Gap: {Math.round(x.gap)}
                        </p>

                      </div>

                      <span className="badge">
                        {x.gap >= 20
                          ? 'High Priority'
                          : x.gap >= 10
                          ? 'Medium Priority'
                          : 'Low Priority'}
                      </span>

                    </div>

                  ))}

                </div>

              )}

            </div>

          ))}


          {recs.length === 0 && (

            <div className="panel">

              <p>
                No opportunities found.
              </p>

            </div>

          )}

        </section>

      )}


      {/* =========================
          PORTFOLIO
      ========================= */}

      {tab === 'portfolio' && (

        <section className="panel">

          <h2>
            Digital Portfolio
          </h2>


          <div className="portfolio">

            <h3>
              {(() => {

                const storedUser =
                  localStorage.getItem('user');

                return storedUser
                  ? JSON.parse(storedUser).name
                  : 'Student';

              })()}
            </h3>


            <p>
              Computer Engineering · AI-generated skill profile
            </p>


            {skills
              .filter((s) => Number(s.proficiency) >= 70)
              .map((s) => (

                <span
                  className="pill"
                  key={s.id}
                >
                  {s.name} {s.proficiency}
                </span>

              ))}

          </div>

        </section>

      )}

    </div>
  );
}


/* =========================
   INDUSTRY
========================= */

function Industry() {

  const [data, setData] = useState(null);
  const [cand, setCand] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  const [opportunities, setOpportunities] = useState([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState('');

  const [form, setForm] = useState({
    title: '',
    type: 'internship',
    location: 'Pune',
    description: '',
    stipend: ''
  });

  const [skillForm, setSkillForm] = useState({
    skill_id: '',
    required_level: 70,
    weight: 1.2
  });


  const load = async () => {
    try {

      const [a, b, s, o] = await Promise.all([
        api('/industry/overview'),
        api('/industry/candidates'),
        api('/skills'),
        api('/industry/opportunities')
      ]);

      setData(a);
      setCand(b);
      setSkills(s);
      setOpportunities(o);

    } catch (error) {
      console.error('Industry error:', error);
    }
  };
  async function loadCandidatesForOpportunity(opportunityId) {
    if (!opportunityId) {
      return;
    }
    console.log("Selected opportunity:", opportunityId);
    try {
      const result = await api(
        `/industry/candidates/${opportunityId}`
      );
      console.log("Candidate result:", result);

      setCand(result);
    } catch (error) {
      console.error('Candidate ranking error:', error);
      alert(error.message);
    }
  }


  useEffect(() => {
    load();
  }, []);


  function addSkill() {

    if (!skillForm.skill_id) {
      alert('Please select a skill');
      return;
    }

    const alreadyAdded = selectedSkills.some(
      x => Number(x.skill_id) === Number(skillForm.skill_id)
    );

    if (alreadyAdded) {
      alert('This skill is already selected');
      return;
    }

    const skill = skills.find(
      x => Number(x.id) === Number(skillForm.skill_id)
    );

    if (!skill) return;

    setSelectedSkills([
      ...selectedSkills,
      {
        skill_id: Number(skill.id),
        name: skill.name,
        required_level: Number(skillForm.required_level),
        weight: Number(skillForm.weight)
      }
    ]);

    setSkillForm({
      skill_id: '',
      required_level: 70,
      weight: 1.2
    });
  }


  function removeSkill(skillId) {

    setSelectedSkills(
      selectedSkills.filter(
        x => Number(x.skill_id) !== Number(skillId)
      )
    );

  }


  async function create(e) {

    e.preventDefault();

    if (selectedSkills.length === 0) {
      alert('Please add at least one required skill');
      return;
    }

    try {

      await api('/industry/opportunities', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          requiredSkills: selectedSkills.map(x => ({
            skill_id: x.skill_id,
            required_level: x.required_level,
            weight: x.weight
          }))
        })
      });


      alert('Opportunity created successfully!');

      setForm({
        title: '',
        type: 'internship',
        location: 'Pune',
        description: '',
        stipend: ''
      });

      setSelectedSkills([]);

      load();

    } catch (error) {

      alert(error.message);

    }

  }


  return (
    <>
      <HeroBanner role="industry" />

      <h2>
        Industry Talent Hub 🏢
      </h2>


      {data && (

        <div className="stats">

          <Card
            title="Student pool"
            value={data.students}
            sub="Discoverable profiles"
          />

          <Card
            title="Applications"
            value={data.applications}
            sub="Your opportunities"
          />

          <Card
            title="Shortlisted"
            value={data.shortlisted}
            sub="Pipeline"
          />

        </div>

      )}


      <div className="two">

        <section className="panel">

          <h3>
            Post Internship / Job
          </h3>


          <form onSubmit={create}>

            <input
              placeholder="Job / Internship title"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value
                })
              }
            />


            <select
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value
                })
              }
            >
              <option value="internship">
                Internship
              </option>

              <option value="job">
                Job
              </option>
            </select>


            <input
              placeholder="Location"
              value={form.location}
              onChange={(e) =>
                setForm({
                  ...form,
                  location: e.target.value
                })
              }
            />


            <textarea
              placeholder="Job description"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value
                })
              }
            />


            <input
              placeholder="Stipend / Salary"
              value={form.stipend}
              onChange={(e) =>
                setForm({
                  ...form,
                  stipend: e.target.value
                })
              }
            />


            <h4>
              Required Skills
            </h4>


            <select
              value={skillForm.skill_id}
              onChange={(e) =>
                setSkillForm({
                  ...skillForm,
                  skill_id: e.target.value
                })
              }
            >

              <option value="">
                Select skill
              </option>

              {skills.map(skill => (

                <option
                  key={skill.id}
                  value={skill.id}
                >
                  {skill.name}
                </option>

              ))}

            </select>


            <input
              type="number"
              min="0"
              max="100"
              placeholder="Required level"
              value={skillForm.required_level}
              onChange={(e) =>
                setSkillForm({
                  ...skillForm,
                  required_level: e.target.value
                })
              }
            />


            <input
              type="number"
              min="0.1"
              step="0.1"
              placeholder="Weight"
              value={skillForm.weight}
              onChange={(e) =>
                setSkillForm({
                  ...skillForm,
                  weight: e.target.value
                })
              }
            />


            <button
              type="button"
              onClick={addSkill}
              className="primary"
            >
              + Add Required Skill
            </button>


            {selectedSkills.length > 0 && (

              <div className="tags">

                {selectedSkills.map(skill => (

                  <span
                    className="pill"
                    key={skill.skill_id}
                  >
                    {skill.name}
                    {' '}
                    {skill.required_level}%
                    {' '}
                    ×{skill.weight}

                    <button
                      type="button"
                      onClick={() =>
                        removeSkill(skill.skill_id)
                      }
                    >
                      ×
                    </button>

                  </span>

                ))}

              </div>

            )}


            <button
              type="submit"
              className="primary"
            >
              Publish Opportunity
            </button>

          </form>

        </section>


        <section className="panel">

          <h3>
            Your Opportunities
          </h3>

          {opportunities.length === 0 ? (
            <p>No opportunities created yet.</p>
          ) : (
            <select
              value={selectedOpportunity}
              onChange={(e) => {
                const opportunityId = e.target.value;

                setSelectedOpportunity(opportunityId);

                if (opportunityId) {
                  loadCandidatesForOpportunity(opportunityId);
                } else {
                  setCand([]);
                }
              }}
            >
              <option value="">
                Select an opportunity
              </option>

              {opportunities.map((opportunity) => (
                <option
                  key={opportunity.id}
                  value={opportunity.id}
                >
                  {opportunity.title}
                </option>
              ))}
            </select>
          )}

          <h3>
            AI Candidate Ranking
          </h3>

          {!selectedOpportunity && (
            <p>Select an opportunity to view candidate rankings.</p>
          )}

          {selectedOpportunity && cand.length === 0 && (
            <p>No candidates available for this opportunity.</p>
          )}

          {selectedOpportunity && cand.map((c, index) => (
            <div
              className="row"
              key={c.id || c.email || index}
            >
              <span>
                <b>{c.name}</b>

                <small>
                  {' '}
                  {c.department}
                </small>

                {c.skill_gaps && c.skill_gaps.length > 0 && (
                  <small style={{ display: 'block', marginTop: '5px' }}>
                    Skill gaps:{' '}
                    {c.skill_gaps
                      .map(gap => gap.skill)
                      .join(', ')}
                  </small>
                )}

                {c.application_status === 'shortlisted' && (
                  <small style={{ display: 'block', marginTop: '5px' }}>
                    ✓ Shortlisted
                  </small>
                )}
              </span>

              <div>
                <b className="badge">
                  {c.match_score}%
                </b>

                {c.application_id &&
                  c.application_status === 'applied' && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await api(
                            `/industry/applications/${c.application_id}/shortlist`,
                            {
                              method: 'PUT'
                            }
                          );

                          alert('Candidate shortlisted successfully');

                          loadCandidatesForOpportunity(
                            selectedOpportunity
                          );

                        } catch (error) {
                          alert(error.message);
                        }
                      }}
                    >
                      Shortlist
                    </button>
                  )}
              </div>
            </div>
          ))}

        </section>

      </div>
    </>
  );
}
/* =========================
   FACULTY
========================= */

function Faculty() {

  const [data, setData] = useState();
  const [items, setItems] = useState([]);

  const [form, setForm] = useState({
    title: '',
    type: 'FDP',
    organization: '',
    description: ''
  });


  const load = () =>
    Promise.all([
      api('/faculty/overview'),
      api('/faculty/programs')
    ])
      .then(([a, b]) => {
        setData(a);
        setItems(b);
      })
      .catch((error) => {
        console.error('Faculty error:', error);
      });


  useEffect(() => {
    load();
  }, []);


  async function add(e) {

    e.preventDefault();

    try {

      await api('/faculty/programs', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      setForm({
        title: '',
        type: 'FDP',
        organization: '',
        description: ''
      });

      load();

    } catch (error) {
      alert(error.message);
    }
  }


  return (
    <>
      <HeroBanner role="faculty" />

      <h2>
        Faculty Collaboration Hub 👩‍🏫
      </h2>


      {data && (

        <div className="stats">

          <Card
            title="Programs"
            value={data.programs}
            sub="FDP / internships / research"
          />

          <Card
            title="Mentorships"
            value={data.activeMentorships}
            sub="Active"
          />

          <Card
            title="Industry projects"
            value={data.industryProjects}
            sub="Available"
          />

        </div>

      )}


      <div className="two">

        <section className="panel">

          <h3>
            Create Faculty Program
          </h3>

          <form onSubmit={add}>

            {[
              'title',
              'organization',
              'description'
            ].map((k) => (

              <input
                key={k}
                placeholder={k}
                value={form[k]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [k]: e.target.value
                  })
                }
              />

            ))}


            <select
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value
                })
              }
            >
              <option>FDP</option>
              <option>faculty_internship</option>
              <option>research</option>
              <option>guest_lecture</option>
              <option>mentorship</option>
            </select>


            <button className="primary">
              Publish
            </button>

          </form>

        </section>


        <section className="panel">

          <h3>
            My Programs
          </h3>


          {items.map((x, index) => (

            <div
              className="row"
              key={x.id || index}
            >

              <b>
                {x.title}
              </b>

              <span>
                {x.type}
              </span>

            </div>

          ))}

        </section>

      </div>
    </>
  );
}


/* =========================
   INSTITUTION
========================= */

function Institution() {

  const [d, setD] = useState();
  const [events, setEvents] = useState([]);

  const [form, setForm] = useState({
    title: '',
    type: 'workshop',
    event_date: '',
    description: ''
  });


  const load = () =>
    Promise.all([
      api('/institution/analytics'),
      api('/institution/events')
    ])
      .then(([a, b]) => {
        setD(a);
        setEvents(b);
      })
      .catch((error) => {
        console.error('Institution error:', error);
      });


  useEffect(() => {
    load();
  }, []);


  async function add(e) {

    e.preventDefault();

    try {

      await api('/institution/events', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      setForm({
        title: '',
        type: 'workshop',
        event_date: '',
        description: ''
      });

      load();

    } catch (error) {
      alert(error.message);
    }
  }


  return (
    <>
      <HeroBanner role="institution" />

      <h2>
        Institution Intelligence Center 🏫
      </h2>


      {d && (

        <>

          <div className="stats">

            <Card
              title="Students"
              value={d.students}
              sub="Registered learners"
            />

            <Card
              title="Internship-ready"
              value={d.internshipReady}
              sub="Shortlisted / selected"
            />

            <Card
              title="Avg skill score"
              value={d.avgSkill}
              sub="Across tracked skills"
            />

          </div>


          <div className="two">

            <section className="panel">

              <h3>
                Skill Demand
              </h3>

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <BarChart data={d.demand}>

                  <XAxis dataKey="skill" />

                  <YAxis />

                  <Tooltip />

                  <Bar dataKey="demand" />

                </BarChart>

              </ResponsiveContainer>

            </section>


            <section className="panel">

              <h3>
                Department Distribution
              </h3>


              {d.departments.map((x, index) => (

                <div
                  className="row"
                  key={x.department || index}
                >

                  <b>
                    {x.department || 'Unspecified'}
                  </b>

                  <span>
                    {x.students}
                  </span>

                </div>

              ))}

            </section>

          </div>

        </>

      )}


      <section className="panel">

        <h3>
          Institution Events
        </h3>


        <form
          className="inline"
          onSubmit={add}
        >

          <input
            placeholder="title"
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value
              })
            }
          />


          <input
            type="date"
            value={form.event_date}
            onChange={(e) =>
              setForm({
                ...form,
                event_date: e.target.value
              })
            }
          />


          <button className="primary">
            Add
          </button>

        </form>


        {events.map((x, index) => (

          <div
            className="row"
            key={x.id || index}
          >

            <b>
              {x.title}
            </b>

            <span>
              {x.event_date} · {x.type}
            </span>

          </div>

        ))}

      </section>

    </>
  );
}


/* =========================
   APP
========================= */

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user') || 'null')
  );

  const [page, setPage] = useState(
    localStorage.getItem('user')
      ? 'dashboard'
      : 'landing'
  );

  function openLogin() {
    setPage('login');
  }



  function openSignUp() {
    setPage('signup');
  }

  function openLanding() {
    setPage('landing');
  }

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
    setPage('dashboard');
  }

  function out() {
    localStorage.clear();
    setUser(null);
    setPage('landing');
  }

  /* Public Landing Page */
  if (!user && page === 'landing') {
    return (
      <LandingPage
        onLogin={openLogin}
        onSignUp={openSignUp}
      />
    );
  }

  /* Login Page */
  if (!user && page === 'login') {
    return (
      <div>
        <button
          className="back-home"
          onClick={openLanding}
        >
          ← Back to Home
        </button>

        <Login onLogin={handleLogin} />

        <div className="auth-switch">
          Don't have an account?{' '}
          <button onClick={openSignUp}>
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  /* Sign Up Page */
  if (!user && page === 'signup') {
    return (
      <SignUp
        onLogin={handleLogin}
        onBack={openLanding}
        onLoginPage={openLogin}
      />
    );
  }

  /* Dashboard */
  return (
    <Layout
      user={user}
      onLogout={out}
    >
      {user.role === 'student' ? (
        <Student />
      ) : user.role === 'industry' ? (
        <Industry />
      ) : user.role === 'faculty' ? (
        <Faculty />
      ) : (
        <Institution />
      )}
    </Layout>
  );
}


/* =========================
   START REACT APP
========================= */

createRoot(
  document.getElementById('root')
).render(
  <App />
);
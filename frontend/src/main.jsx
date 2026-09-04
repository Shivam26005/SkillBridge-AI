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
    <div>

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
    JSON.parse(
      localStorage.getItem('user') || 'null'
    )
  );


  if (!user) {
    return <Login onLogin={setUser} />;
  }


  function out() {

    localStorage.clear();

    setUser(null);

  }


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
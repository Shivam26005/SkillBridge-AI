import React, { useEffect, useState } from 'react';
import { studentService } from './api/studentService';
import './styles.css';

function OpportunityCard({ job }) {
  return (
    <article className="opportunity-card">
      <div className="opportunity-card-header">
        <div>
          <span className="opportunity-type">AI MATCH</span>

          <h3>{job.title}</h3>

          <p className="company-name">
            {job.company}
          </p>
        </div>

        <div className="match-score">
          <strong>{job.match_score}%</strong>
          <span>AI Match</span>
        </div>
      </div>

      <div className="opportunity-details">
        <span>📍 {job.location || 'Location not specified'}</span>
        <span>💰 {job.stipend || 'Not specified'}</span>
      </div>

      <p className="opportunity-description">
        {job.description || 'No description available.'}
      </p>

      <div className="skill-gap-section">
        <h4>📚 Skill Gaps</h4>

        {job.skill_gaps && job.skill_gaps.length > 0 ? (
          <div className="skill-gap-list">
            {job.skill_gaps.map((gap, index) => (
              <div
                className="skill-gap"
                key={`${gap.skill}-${index}`}
              >
                <strong>{gap.skill}</strong>

                <span>
                  Current: {gap.current}%
                  <b> → </b>
                  Required: {gap.required}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="success-text">
            ✅ You meet all required skill levels!
          </p>
        )}
      </div>
    </article>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  const [profileData, setProfileData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] = useState('');
  const [recommendationError, setRecommendationError] =
    useState('');

  useEffect(() => {
    // ================================
    // FETCH STUDENT PROFILE
    // ================================

    studentService
      .getProfile(1)
      .then((data) => {
        console.log(
          'Fetched Student Data Successfully:',
          data
        );

        setProfileData(data);
      })
      .catch((err) => {
        console.error(
          'Failed to fetch profile:',
          err
        );

        setErrorMessage(
          err.message ||
            'Error connecting to backend'
        );
      })
      .finally(() => {
        setLoading(false);
      });

    // ================================
    // FETCH AI RECOMMENDATIONS
    // ================================

    fetch(
      'http://localhost:5000/api/opportunities/recommendations'
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            'Failed to fetch recommendations'
          );
        }

        return response.json();
      })
      .then((data) => {
        console.log(
          'AI Recommendations:',
          data
        );

        setRecommendations(
          Array.isArray(data) ? data : []
        );
      })
      .catch((err) => {
        console.error(
          'Failed to fetch recommendations:',
          err
        );

        setRecommendationError(
          err.message ||
            'Failed to load recommendations'
        );
      })
      .finally(() => {
        setRecommendationLoading(false);
      });
  }, []);

  const profile = profileData?.profile;
  const skills = profileData?.skills || [];

  const averageSkill =
    skills.length > 0
      ? Math.round(
          skills.reduce(
            (sum, skill) =>
              sum +
              Number(skill.proficiency || 0),
            0
          ) / skills.length
        )
      : 0;

  const firstLetter =
    profile?.name?.charAt(0)?.toUpperCase() ||
    'S';

  return (
    <div className="student-dashboard">

      <div className="student-dashboard-inner">

        {/* =================================
            NAVIGATION
        ================================= */}

        <nav
          className="student-nav"
          aria-label="Student dashboard navigation"
        >
          <button
            type="button"
            className={`student-nav-item ${
              activeTab === 'overview'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('overview')
            }
          >
            Overview
          </button>

          <button
            type="button"
            className={`student-nav-item ${
              activeTab === 'assessment'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('assessment')
            }
          >
            Assessment
          </button>

          <button
            type="button"
            className={`student-nav-item ${
              activeTab === 'opportunities'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('opportunities')
            }
          >
            Opportunities
          </button>

          <button
            type="button"
            className={`student-nav-item ${
              activeTab === 'portfolio'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('portfolio')
            }
          >
            Portfolio
          </button>
        </nav>


        {/* =================================
            DASHBOARD HEADER
        ================================= */}

        <header className="student-header">

          <div>
            <span className="student-eyebrow">
              SKILLBRIDGE AI
            </span>

            <h1>
              Student Dashboard
            </h1>

            <p>
              Turn your skills into your next
              opportunity.
            </p>
          </div>

          <div className="student-header-badge">
            🤖 AI Powered
          </div>

        </header>


        {/* =================================
            LOADING
        ================================= */}

        {loading && (
          <div className="status-card status-loading">
            Loading profile data from PostgreSQL...
          </div>
        )}


        {/* =================================
            PROFILE ERROR
        ================================= */}

        {errorMessage && (
          <div className="status-card status-error">
            <strong>Error:</strong>{' '}
            {errorMessage}
          </div>
        )}


        {/* =================================
            OVERVIEW
        ================================= */}

        {activeTab === 'overview' && (
          <div className="dashboard-page">

            {/* PROFILE */}

            {profile && (
              <section className="profile-card">

                <div className="profile-avatar">
                  {firstLetter}
                </div>

                <div className="profile-info">

                  <span className="section-label">
                    YOUR PROFILE
                  </span>

                  <h2>
                    {profile.name}
                  </h2>

                  <p>
                    <strong>
                      Department:
                    </strong>{' '}
                    {profile.department ||
                      'Not specified'}
                  </p>

                  <p>
                    <strong>
                      Email:
                    </strong>{' '}
                    {profile.email ||
                      'Not specified'}
                  </p>

                </div>

                <div className="profile-stat">

                  <strong>
                    {averageSkill}%
                  </strong>

                  <span>
                    Average Skill
                  </span>

                </div>

              </section>
            )}


            {/* SKILLS */}

            <section className="dashboard-section">

              <div className="section-heading-row">

                <div>
                  <span className="section-label">
                    YOUR SKILLS
                  </span>

                  <h2>
                    Technical Skill Matrix
                  </h2>
                </div>

                <span className="skill-count">
                  {skills.length} skills
                </span>

              </div>


              {skills.length > 0 ? (

                <div className="skill-grid">

                  {skills.map(
                    (skill, index) => {

                      const proficiency =
                        Math.min(
                          100,
                          Math.max(
                            0,
                            Number(
                              skill.proficiency ||
                                0
                            )
                          )
                        );

                      return (
                        <div
                          className="skill-card"
                          key={
                            skill.id || index
                          }
                        >

                          <div className="skill-card-top">

                            <strong>
                              {skill.skill_name}
                            </strong>

                            <span>
                              {proficiency.toFixed(
                                0
                              )}
                              %
                            </span>

                          </div>

                          <div className="progress-track">

                            <div
                              className="progress-fill"
                              style={{
                                width: `${proficiency}%`
                              }}
                            />

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              ) : (

                <div className="empty-state">

                  <h3>
                    No skills found
                  </h3>

                  <p>
                    Add skills to your profile
                    to unlock AI recommendations.
                  </p>

                </div>

              )}

            </section>


            {/* AI RECOMMENDATIONS */}

            <section className="dashboard-section">

              <div className="section-heading-row">

                <div>

                  <span className="section-label">
                    AI RECOMMENDATIONS
                  </span>

                  <h2>
                    Opportunities picked for you
                  </h2>

                  <p>
                    Opportunities ranked according
                    to your current skills.
                  </p>

                </div>

              </div>


              {recommendationLoading && (
                <div className="status-card status-loading">
                  🤖 AI is analyzing your skills...
                </div>
              )}


              {recommendationError && (
                <div className="status-card status-error">
                  <strong>Error:</strong>{' '}
                  {recommendationError}
                </div>
              )}


              {!recommendationLoading &&
                !recommendationError &&
                recommendations.length > 0 && (

                  <div className="opportunity-grid">

                    {recommendations
                      .slice(0, 3)
                      .map((job) => (
                        <OpportunityCard
                          key={job.id}
                          job={job}
                        />
                      ))}

                  </div>

                )}


              {!recommendationLoading &&
                !recommendationError &&
                recommendations.length === 0 && (

                  <div className="empty-state">

                    <h3>
                      No opportunities found
                    </h3>

                    <p>
                      Try adding more skills
                      to improve your recommendations.
                    </p>

                  </div>

                )}

            </section>

          </div>
        )}


        {/* =================================
            ASSESSMENT
        ================================= */}

        {activeTab === 'assessment' && (

          <section className="dashboard-page dashboard-placeholder">

            <div className="page-heading">

              <span className="section-label">
                ASSESSMENT CENTER
              </span>

              <h2>
                Measure your skills
              </h2>

              <p>
                Test your technical knowledge
                and discover where you can improve.
              </p>

            </div>


            <div className="dashboard-placeholder-card">

              <div className="placeholder-icon">
                🧠
              </div>

              <h3>
                Skill Assessment
              </h3>

              <p>
                Assessment modules will appear
                here when the assessment backend
                is connected.
              </p>

              <button
                type="button"
                className="primary"
              >
                Start Assessment
              </button>

            </div>

          </section>

        )}


        {/* =================================
            OPPORTUNITIES
        ================================= */}

        {activeTab === 'opportunities' && (

          <section className="dashboard-page">

            <div className="page-heading">

              <span className="section-label">
                OPPORTUNITIES
              </span>

              <h2>
                Find your next opportunity
              </h2>

              <p>
                AI-ranked opportunities based
                on your current technical profile.
              </p>

            </div>


            {recommendationLoading && (
              <div className="status-card status-loading">
                🤖 Loading AI recommendations...
              </div>
            )}


            {recommendationError && (
              <div className="status-card status-error">
                <strong>Error:</strong>{' '}
                {recommendationError}
              </div>
            )}


            {!recommendationLoading &&
              !recommendationError &&
              recommendations.length > 0 && (

                <div className="opportunity-grid">

                  {recommendations.map(
                    (job) => (
                      <OpportunityCard
                        key={job.id}
                        job={job}
                      />
                    )
                  )}

                </div>

              )}


            {!recommendationLoading &&
              !recommendationError &&
              recommendations.length === 0 && (

                <div className="empty-state">

                  <h3>
                    No opportunities available
                  </h3>

                  <p>
                    Complete your profile and
                    add more skills to get
                    recommendations.
                  </p>

                </div>

              )}

          </section>

        )}


        {/* =================================
            PORTFOLIO
        ================================= */}

        {activeTab === 'portfolio' && (

          <section className="dashboard-page">

            <div className="page-heading">

              <span className="section-label">
                PORTFOLIO
              </span>

              <h2>
                Your career snapshot
              </h2>

              <p>
                A clean view of the skills
                currently stored in your profile.
              </p>

            </div>


            <div className="portfolio-dashboard">

              {/* PROFILE */}

              <section className="portfolio-profile">

                <div className="portfolio-avatar">
                  {firstLetter}
                </div>

                <div>

                  <h2>
                    {profile?.name ||
                      'Student'}
                  </h2>

                  <p>
                    {profile?.department ||
                      'Computer Engineering'}
                  </p>

                  <p>
                    {profile?.email ||
                      'Email not available'}
                  </p>

                </div>

              </section>


              {/* SKILLS */}

              <section className="portfolio-section">

                <h3>
                  Technical Skills
                </h3>

                {skills.length > 0 ? (

                  <div className="portfolio-skills">

                    {skills.map(
                      (skill, index) => (

                        <span
                          key={
                            skill.id || index
                          }
                        >
                          {skill.skill_name}
                          {' · '}
                          {Number(
                            skill.proficiency ||
                              0
                          ).toFixed(0)}
                          %
                        </span>

                      )
                    )}

                  </div>

                ) : (

                  <p>
                    No skills added yet.
                  </p>

                )}

              </section>


              {/* CAREER SNAPSHOT */}

              <section className="portfolio-section">

                <h3>
                  Career Snapshot
                </h3>

                <div className="portfolio-stats">

                  <div>
                    <strong>
                      {skills.length}
                    </strong>

                    <span>
                      Skills
                    </span>
                  </div>

                  <div>
                    <strong>
                      {recommendations.length}
                    </strong>

                    <span>
                      AI Matches
                    </span>
                  </div>

                  <div>
                    <strong>
                      {averageSkill}%
                    </strong>

                    <span>
                      Average Skill
                    </span>
                  </div>

                </div>

              </section>

            </div>

          </section>

        )}

      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { studentService } from './api/studentService';

export default function App() {
  const [profileData, setProfileData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [recommendationError, setRecommendationError] = useState('');

  useEffect(() => {
    // Fetch student profile
    studentService.getProfile(1)
      .then((data) => {
        console.log("Fetched Student Data Successfully:", data);
        setProfileData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch profile:", err);
        setErrorMessage(err.message || 'Error connecting to backend');
        setLoading(false);
      });

    // Fetch AI recommendations
    fetch('http://localhost:5000/api/opportunities/recommendations')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }
        return response.json();
      })
      .then((data) => {
        console.log("AI Recommendations:", data);
        setRecommendations(data);
        setRecommendationLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch recommendations:", err);
        setRecommendationError(err.message);
        setRecommendationLoading(false);
      });

  }, []);

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '40px auto',
        fontFamily: 'sans-serif',
        padding: '20px'
      }}
    >

      {/* Header */}
      <header
        style={{
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '16px',
          marginBottom: '24px'
        }}
      >
        <h1 style={{ margin: 0, color: '#2d3748' }}>
          SkillBridge AI - Student Dashboard
        </h1>
      </header>

      {/* Profile Loading */}
      {loading && (
        <div
          style={{
            padding: '20px',
            background: '#ebf8ff',
            borderRadius: '8px',
            color: '#2b6cb0',
            marginBottom: '20px'
          }}
        >
          Loading profile data from PostgreSQL...
        </div>
      )}

      {/* Profile Error */}
      {errorMessage && (
        <div
          style={{
            padding: '20px',
            background: '#fff5f5',
            borderRadius: '8px',
            color: '#c53030',
            marginBottom: '20px'
          }}
        >
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {profileData && profileData.profile && (
        <div>

          {/* Profile Card */}
          <div
            style={{
              background: '#f7fafc',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}
          >
            <h2 style={{ margin: '0 0 8px 0', color: '#1a202c' }}>
              {profileData.profile.name}
            </h2>

            <p style={{ margin: '4px 0', color: '#4a5568' }}>
              <strong>Department:</strong>{' '}
              {profileData.profile.department}
            </p>

            <p style={{ margin: '4px 0', color: '#4a5568' }}>
              <strong>Email:</strong>{' '}
              {profileData.profile.email}
            </p>
          </div>

          {/* Skill Proficiency Matrix */}
          <h3 style={{ color: '#2d3748' }}>
            Technical Skill Matrix
          </h3>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginBottom: '40px'
            }}
          >
            {profileData.skills &&
              profileData.skills.map((skill, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #e2e8f0',
                    padding: '16px',
                    borderRadius: '8px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}
                  >
                    <span style={{ fontWeight: 'bold' }}>
                      {skill.skill_name}
                    </span>

                    <span
                      style={{
                        color: '#3182ce',
                        fontWeight: 'bold'
                      }}
                    >
                      {parseFloat(skill.proficiency).toFixed(0)}%
                    </span>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      background: '#edf2f7',
                      height: '12px',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${skill.proficiency}%`,
                        background: '#3182ce',
                        height: '100%',
                        transition: 'width 0.4s ease-in-out'
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>

          {/* AI Recommendations */}
          <div>
            <h2 style={{ color: '#2d3748' }}>
              🤖 AI Recommended Opportunities
            </h2>

            <p style={{ color: '#718096' }}>
              Opportunities ranked according to your current skills.
            </p>

            {/* Loading */}
            {recommendationLoading && (
              <div
                style={{
                  padding: '20px',
                  background: '#ebf8ff',
                  borderRadius: '8px',
                  color: '#2b6cb0'
                }}
              >
                AI is analyzing your skills...
              </div>
            )}

            {/* Error */}
            {recommendationError && (
              <div
                style={{
                  padding: '20px',
                  background: '#fff5f5',
                  borderRadius: '8px',
                  color: '#c53030'
                }}
              >
                <strong>Error:</strong> {recommendationError}
              </div>
            )}

            {/* Recommendations */}
            {!recommendationLoading &&
              !recommendationError &&
              recommendations.map((job) => (
                <div
                  key={job.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px',
                    background: '#ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >

                  {/* Job Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '20px'
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: '0 0 8px 0',
                          color: '#1a202c'
                        }}
                      >
                        {job.title}
                      </h3>

                      <p
                        style={{
                          margin: '4px 0',
                          color: '#4a5568'
                        }}
                      >
                        <strong>Company:</strong> {job.company}
                      </p>

                      <p
                        style={{
                          margin: '4px 0',
                          color: '#4a5568'
                        }}
                      >
                        📍 {job.location}
                      </p>

                      <p
                        style={{
                          margin: '4px 0',
                          color: '#4a5568'
                        }}
                      >
                        💰 {job.stipend}
                      </p>
                    </div>

                    {/* Match Score */}
                    <div
                      style={{
                        minWidth: '110px',
                        textAlign: 'center',
                        padding: '12px',
                        borderRadius: '10px',
                        background: '#f0fff4'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '26px',
                          fontWeight: 'bold',
                          color: '#38a169'
                        }}
                      >
                        {job.match_score}%
                      </div>

                      <div
                        style={{
                          fontSize: '13px',
                          color: '#276749'
                        }}
                      >
                        AI Match
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      color: '#4a5568',
                      marginTop: '16px'
                    }}
                  >
                    {job.description}
                  </p>

                  {/* Skill Gaps */}
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ marginBottom: '10px' }}>
                      📚 Skill Gaps
                    </h4>

                    {job.skill_gaps && job.skill_gaps.length > 0 ? (
                      job.skill_gaps.map((gap, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            marginBottom: '8px',
                            background: '#fffaf0',
                            borderRadius: '6px'
                          }}
                        >
                          <span>
                            <strong>{gap.skill}</strong>
                          </span>

                          <span style={{ color: '#c05621' }}>
                            Current: {gap.current}% → Required:{' '}
                            {gap.required}%
                          </span>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#38a169' }}>
                        ✅ You meet all required skill levels!
                      </p>
                    )}
                  </div>

                </div>
              ))}

            {/* No recommendations */}
            {!recommendationLoading &&
              !recommendationError &&
              recommendations.length === 0 && (
                <div
                  style={{
                    padding: '20px',
                    background: '#f7fafc',
                    borderRadius: '8px'
                  }}
                >
                  No opportunities found.
                </div>
              )}
          </div>

        </div>
      )}

    </div>
  );
}
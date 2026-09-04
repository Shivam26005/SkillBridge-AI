import React, { useEffect, useState } from 'react';
import { studentService } from './api/studentService';

export default function App() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
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
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <header style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, color: '#2d3748' }}>SkillBridge AI - Student Dashboard</h1>
      </header>

      {loading && (
        <div style={{ padding: '20px', background: '#ebf8ff', borderRadius: '8px', color: '#2b6cb0' }}>
          Loading profile data from MySQL database...
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '20px', background: '#fff5f5', borderRadius: '8px', color: '#c53030' }}>
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {profileData && profileData.profile && (
        <div>
          {/* Profile Card */}
          <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 8px 0', color: '#1a202c' }}>{profileData.profile.name}</h2>
            <p style={{ margin: '4px 0', color: '#4a5568' }}>
              <strong>Department:</strong> {profileData.profile.department}
            </p>
            <p style={{ margin: '4px 0', color: '#4a5568' }}>
              <strong>Email:</strong> {profileData.profile.email}
            </p>
          </div>

          {/* Skill Proficiency Matrix */}
          <h3 style={{ color: '#2d3748' }}>Technical Skill Matrix</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {profileData.skills && profileData.skills.map((skill, index) => (
              <div key={index} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>{skill.skill_name}</span>
                  <span style={{ color: '#3182ce', fontWeight: 'bold' }}>
                    {parseFloat(skill.proficiency).toFixed(0)}%
                  </span>
                </div>
                <div style={{ width: '100%', background: '#edf2f7', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
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
        </div>
      )}
    </div>
  );
}
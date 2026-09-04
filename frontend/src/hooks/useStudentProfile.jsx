import { useState, useEffect, useCallback } from 'react';
import { studentService } from '../api/studentService';

export const useStudentProfile = (studentId = 1) => {
  const [data, setData] = useState({ profile: null, skills: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentService.getProfile(studentId);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile: data.profile,
    skills: data.skills,
    loading,
    error,
    refetch: fetchProfile,
  };
};
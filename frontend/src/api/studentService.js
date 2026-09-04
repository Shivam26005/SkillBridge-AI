import axiosInstance from './axiosInstance';

export const studentService = {
  getProfile: async (studentId = 1) => {
    const response = await axiosInstance.get(`/students/${studentId}/profile`);
    return response.data; // Return data directly so App.jsx doesn't deal with nested res.data
  },
};
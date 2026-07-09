import api from './api';

export const login = async (username, password) => {
  // Replace '/login/' with your actual Django login endpoint if different
  const response = await api.post('/login/', { username, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    // Default DRF auth token doesn't return user object, so we save the username
    const userData = response.data.user || { username };
    localStorage.setItem('user', JSON.stringify(userData));
    response.data.user = userData;
  }
  return response.data;
};

export const register = async (username, email, password) => {
  const response = await api.post('/register/', { username, email, password });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
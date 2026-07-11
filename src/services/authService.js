import api from './api';

export const login = async (username, password) => {
  const response = await api.post('/login/', { username, password });
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  return response.data;
};

export const sendRegisterOtp = async (email) => {
  const response = await api.post('/auth/send-register-otp/', { email });
  return response.data;
};

export const register = async (username, email, password, otp) => {
  const response = await api.post('/register/', { username, email, password, otp });
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
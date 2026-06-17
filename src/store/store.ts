import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logoutUser } from './authSlice';
import axios from 'axios';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://xoto.ae/api';

axios.defaults.baseURL = API_BASE;

axios.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logoutUser(undefined));
    }
    return Promise.reject(error);
  }
);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

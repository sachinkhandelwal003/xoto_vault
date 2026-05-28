import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store/store';
import { rehydrateAuthState } from '../store/authSlice';

const PersistLogin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(rehydrateAuthState());
  }, [dispatch]);

  return <>{children}</>;
};

export default PersistLogin;

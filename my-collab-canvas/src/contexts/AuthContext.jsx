import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = (username, password) => {
    // In a real app, this would make an API call to authenticate
    // For now, we'll use a simple mock
    if (username && password) {
      setUser({ username });
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const register = (username, password) => {
    // In a real app, this would make an API call to register
    // For now, we'll use a simple mock
    if (username && password) {
      setUser({ username });
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

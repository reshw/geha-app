import { useEffect } from 'react';
import useStore from '../store/useStore';
import authService from '../services/authService';

export const useAuth = () => {
  const { user, isLoggedIn, setUser, logout } = useStore();
  
  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser && !user) {
      const userData = JSON.parse(storedUser);
      authService.getUserData(userData.id).then((fullUserData) => {
        if (fullUserData) {
          setUser(fullUserData);
        }
      });
    }
  }, [user, setUser]);
  
  const login = async (userData) => {
    localStorage.setItem('userData', JSON.stringify(userData));
    const fullUserData = await authService.getUserData(userData.id);
    setUser(fullUserData);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('userData');
    logout();
  };

  const updateUser = (updatedData) => {
    const newUserData = { ...user, ...updatedData };
    localStorage.setItem('userData', JSON.stringify(newUserData));
    setUser(newUserData);
  };

  return { user, isLoggedIn, login, logout: handleLogout, updateUser };
};

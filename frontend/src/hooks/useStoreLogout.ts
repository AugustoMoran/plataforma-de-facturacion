import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout as clearAuth } from '../store/authSlice';
import { useLogoutMutation } from '../services/authApi';

export const useStoreLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutRequest, { isLoading }] = useLogoutMutation();

  const logout = async () => {
    try {
      await logoutRequest().unwrap();
    } catch {
      // ignore — clear local session anyway
    }
    dispatch(clearAuth());
    navigate('/');
  };

  return { logout, isLoggingOut: isLoading };
};

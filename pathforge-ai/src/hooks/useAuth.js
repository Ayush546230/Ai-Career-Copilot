import { useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
    const { user, login, logout, loading } = useAuthContext();
    return { user, login, logout, isLoading: loading };
};

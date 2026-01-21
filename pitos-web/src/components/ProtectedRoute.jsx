import React from 'react';
import { useAuth } from '../context/AuthContext';
import NotFound from '../pages/NotFound';

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if (loading) return null; // Ocultar carga para evitar parpadeos o información visual

    // Si no hay usuario, O si el usuario no tiene el rol requerido -> Mostrar 404
    if (!user || (roles && !roles.includes(user.role))) {
        return <NotFound />;
    }

    return children;
};

export default ProtectedRoute;

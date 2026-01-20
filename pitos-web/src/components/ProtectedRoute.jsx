import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="text-white p-10">Cargando...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return <div className="text-white p-10">No tienes permisos para ver esta página.</div>;
    }

    return children;
};

export default ProtectedRoute;

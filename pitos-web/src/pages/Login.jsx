import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                login(data.token, data.role);
                // Redirect based on role
                if (data.role === 'admin') navigate('/ventas');
                else if (data.role === 'cocina') navigate('/cocina');
                else if (data.role === 'repartidor') navigate('/repartidor');
                else navigate('/'); 
            } else {
                setError(data.error || 'Login fallido');
            }
        } catch (err) {
            setError('Error de conexión');
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
            <div className="bg-neutral-800 p-8 rounded-2xl border border-white/10 w-full max-w-sm shadow-xl">
                <div className="flex items-center justify-center mb-8">
                     <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-2xl border-2 border-red-600">P</div>
                </div>
                <h2 className="text-2xl font-bold text-white text-center mb-6">Acceso Empleados</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-neutral-400 text-sm mb-1">Usuario</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-neutral-500 w-5 h-5" />
                            <input 
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 pl-10 text-white focus:outline-none focus:border-yellow-500"
                                placeholder="ej. admin"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-neutral-400 text-sm mb-1">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-neutral-500 w-5 h-5" />
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 pl-10 text-white focus:outline-none focus:border-yellow-500"
                                placeholder="•••••••"
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <button 
                        type="submit" 
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition-colors"
                    >
                        Ingresar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;

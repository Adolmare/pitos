import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center text-white px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-orange-500 mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Página no encontrada</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Parece que has llegado a una ruta que no existe o no tienes acceso a ella.
        </p>
        
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-orange-500/20"
        >
          <Home size={20} />
          Volver al Menú
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
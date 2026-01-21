import React from 'react';
import { Phone, MapPin, Instagram, Facebook } from 'lucide-react';

const Footer = () => {
  return (
        <footer id="contacto" className="bg-black text-white py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold border border-red-600">R</div>
            <span className="font-bold text-xl">RESTAURANTE</span>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            #1 En Calidad y Precios Bajos. <br/>
            Comidas rápidas, asados al carbón y los mejores cócteles.
          </p>
          <div className="flex gap-4">
            <a href="https://www.instagram.com/pitos_pizza/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram className="hover:text-pink-500 cursor-pointer transition" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-4 text-yellow-400">Domicilios</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-300">
              <Phone size={18} className="text-red-500" />
              <span>Sahagún: <strong className="text-white">300 304 2324</strong></span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Phone size={18} className="text-red-500" />
              <span>Chinú: <strong className="text-white">300 295 1566</strong></span>
            </div>
            
          </div>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-4 text-yellow-400">Ubicación</h4>
          <div className="flex items-start gap-3 text-gray-300">
            <MapPin size={20} className="text-red-500 mt-1" />
            <p>Visítanos en nuestras sedes. <br/>Abierto todos los días.</p>
          </div>
        </div>
      </div>
      <div className="text-center mt-12 pt-8 border-t border-white/5 text-gray-500 text-sm">
        © {new Date().getFullYear()} Restaurante. Desarrollado por Devlfo.
      </div>
    </footer>
  );
};

export default Footer;

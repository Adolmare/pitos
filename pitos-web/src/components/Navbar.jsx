import React from 'react';
import { Phone, Menu as MenuIcon, X, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { 
    setIsCartOpen, 
    cartCount 
  } = useCart();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-neutral-900/90 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xl border-2 border-red-600">
              R
            </div>
            <span className="font-bold text-2xl tracking-tighter">
              RESTAURANTE
            </span>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {[
                { name: 'Inicio', href: '#inicio' },
                { name: 'Menú', href: '#menu' },
                { name: 'Contacto', href: '#contacto' }
              ].map((item) => (
                <a key={item.name} href={item.href} className="hover:text-yellow-500 transition-colors duration-300 font-medium text-lg">
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Cart Button */}
             <button 
               onClick={() => setIsCartOpen(true)}
               className="relative p-2 text-white hover:text-yellow-500 transition-colors"
             >
               <ShoppingCart size={24} />
               {cartCount > 0 && (
                 <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                   {cartCount}
                 </span>
               )}
             </button>

             <div className="hidden md:block">
               <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg shadow-red-600/30 flex items-center gap-2">
                 <Phone size={18} /> Domicilios
               </button>
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:text-yellow-500 p-2">
                {isMenuOpen ? <X size={28} /> : <MenuIcon size={28} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden bg-neutral-900 absolute w-full border-b border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 text-center">
            {[
              { name: 'Inicio', href: '#inicio' },
              { name: 'Menú', href: '#menu' },
              { name: 'Contacto', href: '#contacto' }
            ].map((item) => (
              <a 
                key={item.name} 
                href={item.href} 
                className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
             <button className="w-full mt-4 bg-red-600 text-white px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-red-700 transition">
               <Phone size={18} /> Domicilios
             </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Star, Plus } from 'lucide-react';
import { CATEGORIES, MENU_ITEMS } from '../data/menu';
import { useCart } from '../context/CartContext';

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const { addToCart } = useCart();

  const filteredItems = activeCategory === 'all' 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter(item => item.category === activeCategory);


  return (
    <div id="menu" className="py-20 px-4 max-w-7xl mx-auto scroll-mt-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4">Nuestro <span className="text-red-600">Menú</span></h2>
        <div className="w-24 h-1 bg-yellow-500 mx-auto rounded-full" />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap justify-center gap-3 mb-16">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-8 py-3 rounded-full font-bold tracking-wide transition-all duration-300 cursor-pointer overflow-hidden relative group ${
              activeCategory === cat.id 
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] scale-110' 
                : 'bg-neutral-800/80 text-gray-400 hover:text-white border border-white/5 hover:border-white/20'
            }`}
          >
             <span className="relative z-10">{cat.name}</span>
             {activeCategory !== cat.id && (
               <div className="absolute inset-0 bg-white/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
             )}
          </button>
        ))}
      </div>

      {/* Grid Items */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10"
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="bg-neutral-900/60 backdrop-blur-md rounded-3xl overflow-hidden group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 border border-white/5 relative"
            >
              {/* Image Container with Overlay */}
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-60" />
                <img 
                  src={item.image} 
                  alt={item.name} 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 z-20">
                  <span className="bg-yellow-400 text-black px-4 py-2 rounded-full font-black text-lg shadow-lg">
                    ${item.price.toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="p-8 relative z-20 -mt-10">
                <div className="bg-neutral-800/80 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-xl">
                    <h3 className="text-2xl font-black text-white mb-2 leading-tight">
                        {item.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed font-light">
                        {item.description}
                    </p>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <div className="flex text-yellow-500 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" className="text-yellow-500" />
                        ))}
                    </div>
                    <button 
                        onClick={() => addToCart(item)}
                        className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center hover:bg-yellow-400 hover:scale-110 transition-all shadow-lg cursor-pointer"
                        title="Agregar al carrito"
                    >
                        <Plus size={24} />
                    </button>
                    </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Menu;

import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <div id="inicio" className="relative w-full h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
          className="w-full h-full"
        >
          <img 
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1920&q=80" 
            alt="Pizza Background" 
            fetchPriority="high"
            loading="eager"
            className="w-full h-full object-cover opacity-20 contrast-125 saturate-50"
          />
        </motion.div>
        {/* Dynamic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/80 to-red-900/10 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 50 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-block mb-8 relative"
          >
             <span className="text-yellow-400 font-extrabold tracking-widest uppercase py-3 px-8 border border-yellow-500/30 rounded-full bg-black/60 backdrop-blur-md shadow-[0_0_30px_rgba(234,179,8,0.2)]">
              Comidas Rápidas & Pizzería
            </span>
             <motion.div 
                className="absolute -top-8 -right-8 text-6xl drop-shadow-lg filter"
                animate={{ rotate: 15, y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
             >
               🍕
             </motion.div>
          </motion.div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-8 leading-[0.9] drop-shadow-2xl tracking-tighter">
            SABOR <br/> 
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500">EXPLOSIVO</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            La verdadera experiencia gastronómica de <strong className="text-white">Sahagún y Chinú</strong>. <br/> Calidad premium, precios de locura.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <motion.a 
              href="#menu"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-10 py-5 rounded-full font-bold text-xl hover:from-red-500 hover:to-orange-500 transition shadow-[0_10px_40px_rgba(220,38,38,0.4)] flex items-center gap-3 group cursor-pointer border border-red-500/20"
            >
              Hacer Pedido
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </motion.a>
            
            <motion.a 
              href="#contacto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 rounded-full font-bold text-xl text-white border border-white/10 bg-white/5 hover:bg-white/10 transition backdrop-blur-md cursor-pointer"
            >
              Ver Ubicación
            </motion.a>
          </div>
        </motion.div>
      </div>
      
      {/* Decorative floating elements */}
      <motion.div 
        animate={{ y: [-20, 20, -20], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-10 hidden lg:block opacity-30 invert blur-sm"
      >
        <img src="https://cdn-icons-png.flaticon.com/512/3075/3075977.png" className="w-32 h-32" alt="burger" />
      </motion.div>
      
      <motion.div 
        animate={{ y: [20, -20, 20], rotate: [0, -5, 5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-40 right-10 hidden lg:block opacity-30 invert blur-sm"
      >
         <img src="https://cdn-icons-png.flaticon.com/512/1046/1046784.png" className="w-24 h-24" alt="fries" />
      </motion.div>
    </div>
  );
};

export default Hero;

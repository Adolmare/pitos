import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/status')
      .then(res => res.json())
      .then(data => setIsRestaurantOpen(data.isOpen))
      .catch(err => console.error(err));

      // Poll status every 30s to keep it updated for users
      const interval = setInterval(() => {
        fetch('http://localhost:3000/api/status')
        .then(res => res.json())
        .then(data => setIsRestaurantOpen(data.isOpen))
        .catch(err => console.error(err));
      }, 30000);
      return () => clearInterval(interval);
  }, []);

  return (
    <section id="inicio" className="relative w-full min-h-[100vh] lg:min-h-screen flex items-center bg-[#0f0f0f] overflow-hidden pt-24 pb-12 lg:py-0">
      
      {/* Background Gradients - Fresh & Modern approach with cleaner glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center h-full">
        
        {/* Left Column: Content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1"
        >
          {/* Status Badge */}
          <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md mb-8 group transition-colors cursor-default ${isRestaurantOpen ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}
          >
            <span className="relative flex h-3 w-3">
              {isRestaurantOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isRestaurantOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="text-gray-300 text-sm font-semibold tracking-wide group-hover:text-white transition-colors">
              {isRestaurantOpen ? 'Abierto ahora • Servicio Rápido' : 'Cerrado • Abre pronto'}
            </span>
          </motion.div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-[1.1] mb-6 tracking-tight">
            Comida que <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 relative inline-block">
              Enamora
              {/* Modern Underline Decorator */}
              <svg className="absolute w-[110%] h-3 -bottom-1 -left-1 text-red-500 selection:bg-none" viewBox="0 0 100 10" preserveAspectRatio="none">
                 <path d="M0 5 Q 50 12 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
              </svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-lg leading-relaxed">
            La mejor comida rápida de <strong className="text-white">Sahagún y Chinú</strong>. Ingredientes frescos, sabor auténtico y precios increíbles.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <motion.a
              href="#menu"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 bg-red-600 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-red-600/40 hover:bg-red-500 transition-all flex items-center justify-center gap-2"
            >
              Ver Menú
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </motion.a>
            <motion.a
               href="#nosotros"
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               className="px-8 py-4 rounded-2xl text-white font-bold text-lg border border-white/10 hover:bg-white/5 transition-colors text-center"
            >
              Cómo llegar
            </motion.a>
          </div>
        </motion.div>

        {/* Right Column: Visual Interaction */}
        <div className="relative h-[400px] sm:h-[500px] lg:h-[700px] w-full flex items-center justify-center lg:justify-end order-1 lg:order-2 perspective-1000">
          <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ duration: 1, ease: "easeOut" }}
             className="relative z-10 w-[300px] sm:w-[450px] lg:w-[600px] aspect-square"
          > 
             {/* Abstract Background Shape behind food */}
             <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 to-orange-500/20 rounded-full blur-3xl animate-pulse" />
             
             {/* Spinning Circle Plate Border */}
             <div className="absolute inset-4 sm:inset-10 border border-white/10 rounded-full animate-[spin_60s_linear_infinite]" />
             
             {/* Main Image - Using a really high quality cutout style */}
             <motion.img 
               animate={{ y: [-15, 15, -15] }}
               transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
               src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop" 
               alt="Delicious Burger" 
               className="w-full h-full object-cover rounded-full shadow-2xl relative z-10"
               style={{ 
                 maskImage: 'radial-gradient(circle at center, black 60%, transparent 70%)', 
                 WebkitMaskImage: 'radial-gradient(circle at center, black 60%, transparent 70%)' 
               }}
             />

             {/* Floating 3D Cards */}
             <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-[10%] lg:right-0 right-[-10px] bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3 z-20"
             >
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center text-2xl">
                  🌮
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Sabor Único</p>
                  <p className="text-xs text-gray-400">Receta secreta</p>
                </div>
             </motion.div>

             <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0, y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                className="absolute bottom-[20%] left-0 lg:-left-10 bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3 z-20"
             >
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-2xl">
                  🔥
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Caliente & Fresco</p>
                  <p className="text-xs text-gray-400">Preparado al instante</p>
                </div>
             </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

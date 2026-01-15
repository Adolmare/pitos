import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Menu from '../components/Menu';
import Footer from '../components/Footer';
import CartModal from '../components/CartModal';

const Home = () => {
  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-yellow-500 selection:text-black">
        <Navbar />
        <CartModal />
        <Hero />
        <Menu />
        <Footer />
    </div>
  );
};

export default Home;
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Home from './pages/Home';
import Kitchen from './pages/Kitchen';

const App = () => {
  return (
    <CartProvider>
      <BrowserRouter>
         <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cocina" element={<Kitchen />} />
         </Routes>
      </BrowserRouter>
    </CartProvider>
  );
};
export default App;


import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Kitchen from './pages/Kitchen';
import Repartidor from './pages/Repartidor';
import Sales from './pages/Sales';
import Login from './pages/Login';
import Products from './pages/Products'; 
import Tables from './pages/Tables';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/AdminDashboard';

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
           <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              
              <Route path="/admin" element={
                  <ProtectedRoute roles={['admin']}>
                      <AdminDashboard />
                  </ProtectedRoute>
              } />

              <Route path="/cocina" element={
                  <ProtectedRoute roles={['admin', 'cocina']}>
                      <Kitchen />
                  </ProtectedRoute>
              } />
              
              <Route path="/repartidor" element={
                  <ProtectedRoute roles={['admin', 'repartidor']}>
                      <Repartidor />
                  </ProtectedRoute>
              } />
              
              <Route path="/ventas" element={
                  <ProtectedRoute roles={['admin']}>
                      <Sales />
                  </ProtectedRoute>
              } />

              <Route path="/productos" element={
                  <ProtectedRoute roles={['admin']}>
                      <Products />
                  </ProtectedRoute>
              } />

              <Route path="/mesas" element={
                  <ProtectedRoute roles={['admin', 'cocina']}>
                      <Tables />
                  </ProtectedRoute>
              } />

              {/* Ruta Catch-all para 404 */}
              <Route path="*" element={<NotFound />} />
           </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};
export default App;


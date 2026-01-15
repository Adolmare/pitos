// src/pages/Kitchen.jsx
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Clock, CheckCircle, MapPin, Phone } from 'lucide-react';

const socket = io('http://localhost:3000'); // Connect to backend

const Kitchen = () => {
  const [orders, setOrders] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Credenciales simples (En producción usar backend/JWT)
    if (credentials.username === 'admin' && credentials.password === 'pitos123') {
        setIsAuthenticated(true);
        setError('');
    } else {
        setError('Usuario o contraseña incorrectos');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // Load initial orders
    fetch('http://localhost:3000/api/orders')
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error("Error fetching orders:", err));

    // Listen for new orders
    socket.on('new-order', (order) => {
        // Play sound notification
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Audio play failed", e));
        
        setOrders(prev => [order, ...prev]);
    });

    socket.on('order-updated', (updatedOrder) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    });

    return () => {
      socket.off('new-order');
      socket.off('order-updated');
    };
  }, []);

  const updateStatus = (id, status) => {
      fetch(`http://localhost:3000/api/orders/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
      });
  };

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
            <div className="bg-neutral-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-3xl mx-auto mb-4 border-2 border-red-600">
                      P
                    </div>
                    <h2 className="text-2xl font-bold text-white">Acceso a Cocina</h2>
                    <p className="text-gray-400">Panel de Control de Pedidos</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Usuario</label>
                        <input 
                            type="text" 
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                            placeholder="Usuario"
                            value={credentials.username}
                            onChange={e => setCredentials({...credentials, username: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Contraseña</label>
                        <input 
                            type="password" 
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                            placeholder="••••••••"
                            value={credentials.password}
                            onChange={e => setCredentials({...credentials, password: e.target.value})}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all"
                    >
                        Ingresar al Sistema
                    </button>
                    
                    <div className="text-center mt-4 text-xs text-gray-500">
                        Credenciales por defecto: admin / pitos123
                    </div>
                </form>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <header className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-4xl font-bold flex items-center gap-3">
            👨‍🍳 Cocina <span className="text-yellow-500">Live Monitor</span>
        </h1>
        <div className="flex items-center gap-4">
            <span className="bg-green-600/20 text-green-500 px-4 py-2 rounded-full border border-green-500/30 animate-pulse">
                ● Sistema Conectado
            </span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {orders.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-600">
                <p className="text-2xl">Esperando pedidos...</p>
            </div>
        )}

        {orders.map(order => (
          <div key={order.id} className={`bg-slate-800 rounded-xl overflow-hidden border-2 shadow-xl ${
              order.status === 'pending' ? 'border-red-500 shadow-red-500/10' : 
              order.status === 'preparing' ? 'border-yellow-500 shadow-yellow-500/10' : 'border-green-500 opacity-75'
          }`}>
            <div className={`p-3 text-center font-bold text-lg uppercase tracking-wide ${
                 order.status === 'pending' ? 'bg-red-600' : 
                 order.status === 'preparing' ? 'bg-yellow-600' : 'bg-green-600'
            }`}>
               {order.status === 'pending' ? 'NUEVO PEDIDO' : order.status} - {new Date(order.receivedAt).toLocaleTimeString()}
            </div>
            
            <div className="p-4 space-y-4">
               {/* Customer Info */}
               <div className="bg-slate-900/50 p-3 rounded-lg text-sm">
                   <p className="font-bold text-lg text-white mb-1">👤 {order.customer.name}</p>
                   <p className="text-gray-400">💳 {order.customer.paymentMethod}</p>
                   <p className="text-xs text-gray-500 mt-2 truncate">📍 {order.customer.address}</p>
                   {order.customer.location && (
                       <a 
                         href={`https://maps.google.com/?q=${order.customer.location.latitude},${order.customer.location.longitude}`} 
                         target="_blank" 
                         rel="noreferrer"
                         className="mt-2 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs bg-blue-500/10 px-2 py-1 rounded"
                        >
                           <MapPin size={12}/> Ver en Mapa GPS
                       </a>
                   )}
               </div>

               {/* Items */}
               <div className="space-y-2">
                   {order.items.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-2">
                           <span className="font-bold text-xl text-yellow-500">{item.quantity}x</span>
                           <span className="flex-1 mx-2 font-medium">{item.name}</span>
                       </div>
                   ))}
               </div>
               
               {/* Notes */}
               {order.customer.notes && (
                   <div className="bg-yellow-500/10 border border-yellow-500/20 p-2 rounded text-yellow-200 text-sm italic">
                       " {order.customer.notes} "
                   </div>
               )}

               {/* Actions */}
               <div className="flex gap-2 pt-2">
                   {order.status === 'pending' && (
                       <button 
                         onClick={() => updateStatus(order.id, 'preparing')}
                         className="flex-1 bg-yellow-600 hover:bg-yellow-500 py-2 rounded font-bold transition"
                        >
                           Empezar
                       </button>
                   )}
                   {order.status === 'preparing' && (
                       <button 
                         onClick={() => updateStatus(order.id, 'completed')}
                         className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded font-bold transition"
                        >
                           Terminar
                       </button>
                   )}
                   {order.status === 'completed' && (
                       <div className="flex-1 text-center text-green-500 font-bold flex items-center justify-center gap-2">
                           <CheckCircle size={20}/> Completado
                       </div>
                   )}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Kitchen;

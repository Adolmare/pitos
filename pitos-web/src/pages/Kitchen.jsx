// src/pages/Kitchen.jsx
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Clock, CheckCircle, MapPin, Phone, LogOut, TrendingUp, LayoutGrid, Users, Utensils } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const socket = io('http://localhost:3000'); // Connect to backend

const Kitchen = () => {
  const [orders, setOrders] = useState([]);
  const [repartidores, setRepartidores] = useState([]);
  const [tables, setTables] = useState([]);
  const { user, logout } = useAuth(); // Utiliza el contexto de autenticación

  useEffect(() => {
    // Load initial orders
    fetch('http://localhost:3000/api/orders', {
        headers: { 'Authorization': `Bearer ${user?.token}` }
    })
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error("Error fetching orders:", err));

    // Load Repartidores
    if (user?.role === 'admin' || user?.role === 'cocina') {
        fetch('http://localhost:3000/api/repartidores', {
            headers: { 'Authorization': `Bearer ${user?.token}` }
        })
        .then(res => res.json())
        .then(data => setRepartidores(data))
        .catch(err => console.error("Error fetching repartidores:", err));

        // Load Tables for Admin AND Cocina context
        if (user?.role === 'admin' || user?.role === 'cocina') {
            fetch('http://localhost:3000/api/tables', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            })
            .then(res => res.json())
            .then(data => setTables(data))
            .catch(err => console.error("Error fetching tables:", err));
        }
    }

    // Listen for new orders
    socket.on('new-order', (order) => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log("Audio play failed", e));
        
        setOrders(prev => [order, ...prev]);
    });

    socket.on('order-updated', (updatedOrder) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    });

    socket.on('tables-updated', (updatedTables) => {
        if (user?.role === 'admin' || user?.role === 'cocina') {
            setTables(updatedTables);
        }
    });

    return () => {
      socket.off('new-order');
      socket.off('order-updated');
      socket.off('tables-updated');
    };
  }, [user]);

  const updateStatus = (id, status) => {
      fetch(`http://localhost:3000/api/orders/${id}/status`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`
          },
          body: JSON.stringify({ status })
      });
  };

  const assignOrder = (orderId, repartidorId) => {
      fetch(`http://localhost:3000/api/orders/${orderId}/assign`, {
          method: 'PUT',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user?.token}`
          },
          body: JSON.stringify({ assignedTo: repartidorId })
      })
      .catch(err => console.error("Error assigning order:", err));
  };


  const getRepartidorStatus = (repId) => {
      const busyCount = orders.filter(o => o.assignedTo === repId && o.status !== 'delivered').length;
      return busyCount > 0 ? `🔌 Ocupado (${busyCount})` : '🟢 Libre';
  };
  
  // Calculate Stats
  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'completed').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <header className="flex flex-col gap-6 mb-8 border-b border-slate-700 pb-6">
        <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold flex items-center gap-3">
                👨‍🍳 Cocina <span className="text-yellow-500">Live Monitor</span>
            </h1>
            <div className="flex items-center gap-4">
                <Link 
                    to="/mesas" 
                    className="bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600 hover:text-white px-4 py-2 rounded-full border border-yellow-500/30 transition-all flex items-center gap-2 font-bold"
                >
                    <LayoutGrid size={18} />
                    <span className="hidden sm:inline">Mesas</span>
                </Link>

                <button 
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 p-3 rounded-full transition-all"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </div>

        {/* ADMIN STATS BAR */}
        {user?.role === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-blue-500/30 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                        <Utensils size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 uppercase font-bold">Pedidos Activos</p>
                        <p className="text-2xl font-bold text-white">{activeOrders} <span className="text-sm font-normal text-slate-500">({pendingOrders} pendientes)</span></p>
                    </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-xl border border-yellow-500/30 flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-400">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 uppercase font-bold">Mesas Ocupadas</p>
                        <p className="text-2xl font-bold text-white">{occupiedTables} <span className="text-sm font-normal text-slate-500">/ {tables.length}</span></p>
                    </div>
                </div>
            </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activeOrders === 0 && occupiedTables === 0 && (
            <div className="col-span-full text-center py-20 text-slate-600">
                <p className="text-2xl">Esperando pedidos...</p>
            </div>
        )}

        {/* --- TABLE ORDERS (ACTIVE MESAS) --- */}
        {tables.filter(t => t.status === 'occupied' && t.items.length > 0).map(table => (
           <div key={`table-${table.id}`} className="bg-slate-800 rounded-xl overflow-hidden border-2 border-orange-500 shadow-xl shadow-orange-500/10">
               <div className="p-3 text-center font-bold text-lg uppercase tracking-wide bg-orange-600">
                   MESA OCUPADA - {table.startTime ? new Date(table.startTime).toLocaleTimeString() : 'En curso'}
               </div>
               
               <div className="p-4 space-y-4">
                  <div className="bg-slate-900/50 p-3 rounded-lg text-sm">
                      <p className="font-bold text-lg text-white mb-1">🍽 {table.name}</p>
                      <p className="text-gray-400">Comensales en Salón</p>
                  </div>

                  <div className="space-y-2">
                       {table.items.map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-2">
                               <span className="font-bold text-xl text-yellow-500">{item.quantity}x</span>
                               <span className="flex-1 mx-2 font-medium">{item.name}</span>
                               <span className="text-xs text-slate-500 italic">Mesa</span>
                           </div>
                       ))}
                  </div>

                  <div className="bg-orange-900/20 text-orange-400 text-center p-2 rounded text-sm italic border border-orange-500/20">
                      Gestionar estado desde Mesas
                  </div>
               </div>
           </div>
        ))}

        {/* --- STANDARD ORDERS --- */}
        {orders
            .filter(order => order.status !== 'completed' && order.status !== 'delivered')
            .map(order => (
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

               <div className="space-y-2">
                   {order.items.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-2">
                           <span className="font-bold text-xl text-yellow-500">{item.quantity}x</span>
                           <span className="flex-1 mx-2 font-medium">{item.name}</span>
                       </div>
                   ))}
               </div>
               
               {order.customer.notes && (
                   <div className="bg-yellow-500/10 border border-yellow-500/20 p-2 rounded text-yellow-200 text-sm italic">
                       " {order.customer.notes} "
                   </div>
               )}


               <div className="flex flex-col gap-2 pt-2">
                   <div className="mb-2">
                       <label className="text-xs text-gray-400 block mb-1">Asignar Repartidor:</label>
                       <select 
                           className="w-full bg-slate-700 text-white rounded p-1 text-sm border border-slate-600"
                           value={order.assignedTo || ""}
                           onChange={(e) => assignOrder(order.id, e.target.value)}
                       >
                           <option value="">-- Sin Asignar --</option>
                           {repartidores.map(rep => (
                               <option key={rep.id} value={rep.id}>
                                   {rep.username} - {getRepartidorStatus(rep.id)}
                               </option>
                           ))}
                       </select>
                   </div>

                   <div className="flex gap-2">
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default Kitchen;

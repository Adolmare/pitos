import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  UtensilsCrossed, 
  DollarSign, 
  Bike, 
  LogOut, 
  TrendingUp, 
  ShoppingBag,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    ordersTotal: 0,
    topProducts: [],
    topDrivers: []
  });
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchStatus();
    // Set up polling for real-time updates
    const interval = setInterval(() => {
        fetchStats();
        fetchStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/status');
        if (response.ok) {
            const data = await response.json();
            setIsRestaurantOpen(data.isOpen);
        }
    } catch (error) {
        console.error('Error fetching status:', error);
    }
  };

  const toggleStatus = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ isOpen: !isRestaurantOpen })
        });
        if (response.ok) {
            const data = await response.json();
            setIsRestaurantOpen(data.isOpen);
        }
    } catch(err) { console.error(err); }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/sales', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Chart Data Configuration
  const productChartData = {
    labels: stats.topProducts.slice(0, 5).map(p => p.name),
    datasets: [
      {
        label: 'Unidades Vendidas',
        data: stats.topProducts.slice(0, 5).map(p => p.quantity),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const driverChartData = {
    labels: stats.topDrivers ? stats.topDrivers.map(d => d.name) : [],
    datasets: [
      {
        label: 'Pedidos Entregados',
        data: stats.topDrivers ? stats.topDrivers.map(d => d.count) : [],
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Navbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <LayoutGrid size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-wide">Panel de Administración</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleStatus}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-bold ${isRestaurantOpen ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            <span>{isRestaurantOpen ? 'ABIERTO' : 'CERRADO'}</span>
          </button>
          <span className="text-gray-400">Hola, {user?.username}</span>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Salir</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto p-6">
        
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/ventas" className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all shadow-lg hover:shadow-blue-500/20 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-900/50 rounded-lg text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <DollarSign size={28} />
              </div>
              <span className="text-gray-400 text-sm">Finanzas</span>
            </div>
            <h3 className="text-xl font-semibold mb-1">Ventas & Reportes</h3>
            <p className="text-gray-400 text-sm">Ver ingresos y detalles de caja</p>
          </Link>

          <Link to="/cocina" className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-orange-500 transition-all shadow-lg hover:shadow-orange-500/20 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-900/50 rounded-lg text-orange-400 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <UtensilsCrossed size={28} />
              </div>
              <span className="text-gray-400 text-sm">Operaciones</span>
            </div>
            <h3 className="text-xl font-semibold mb-1">Monitor de Cocina</h3>
            <p className="text-gray-400 text-sm">Gestionar pedidos y estados</p>
          </Link>

          <Link to="/repartidor" className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/20 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-900/50 rounded-lg text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Bike size={28} />
              </div>
              <span className="text-gray-400 text-sm">Logística</span>
            </div>
            <h3 className="text-xl font-semibold mb-1">Repartidores</h3>
            <p className="text-gray-400 text-sm">Vista de repartos activos</p>
          </Link>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Top Products */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="text-blue-500" />
                Platos Más Vendidos
              </h2>
            </div>
            <div className="h-64 flex justify-center">
              {stats.topProducts.length > 0 ? (
                <Bar options={chartOptions} data={productChartData} />
              ) : (
                <div className="flex items-center justify-center text-gray-500">
                  Sin datos suficientes
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
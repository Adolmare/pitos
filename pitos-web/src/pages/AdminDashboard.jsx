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
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
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
    topDrivers: [],
    orders: []
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
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/status`);
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
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/status`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sales`, {
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

  // Helper to process sales over time (last 7 data points)
  const processSalesData = () => {
    if (!stats.orders || stats.orders.length === 0) return { labels: [], data: [] };
    
    // Group by Date (YYYY-MM-DD)
    const salesByDate = {};
    stats.orders.forEach(order => {
        const date = new Date(order.receivedAt).toLocaleDateString();
        if (!salesByDate[date]) salesByDate[date] = 0;
        salesByDate[date] += (order.total || 0);
    });

    const sortedDates = Object.keys(salesByDate).sort((a,b) => new Date(a) - new Date(b)).slice(-7);
    return {
        labels: sortedDates,
        data: sortedDates.map(date => salesByDate[date])
    };
  };

  const salesTrend = processSalesData();

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

  const salesChartData = {
      labels: salesTrend.labels,
      datasets: [
          {
              label: 'Ventas ($)',
              data: salesTrend.data,
              borderColor: 'rgb(255, 205, 86)',
              backgroundColor: 'rgba(255, 205, 86, 0.5)',
              tension: 0.3
          }
      ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: 'white' } },
      title: { display: false },
    },
    scales: {
      y: { 
          beginAtZero: true,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'gray' }
      },
      x: {
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: 'gray' }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Navbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
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
          <span className="text-gray-400 font-medium">Hola, {user?.username}</span>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto p-6">
        
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/sales" className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all shadow-lg hover:shadow-blue-500/20 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-900/50 rounded-lg text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <DollarSign size={28} />
              </div>
              <span className="text-gray-400 text-sm">Finanzas</span>
            </div>
            <h3 className="text-xl font-semibold mb-1">Ventas Detalladas</h3>
            <p className="text-gray-400 text-sm">Ver ingresos y detalles de caja</p>
          </Link>

          <Link to="/kitchen" className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-orange-500 transition-all shadow-lg hover:shadow-orange-500/20 group">
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

          <Link to="/products" className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-purple-500 transition-all shadow-lg hover:shadow-purple-500/20 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-900/50 rounded-lg text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <ShoppingBag size={28} />
              </div>
              <span className="text-gray-400 text-sm">Inventario</span>
            </div>
            <h3 className="text-xl font-semibold mb-1">Productos</h3>
            <p className="text-gray-400 text-sm">Gestionar menú y precios</p>
          </Link>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Sales Trend Chart */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg col-span-1 lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp className="text-yellow-500" />
                        Tendencia de Ventas (Últimos 7 días con actividad)
                    </h2>
                </div>
                <div className="h-72">
                    <Line options={chartOptions} data={salesChartData} />
                </div>
            </div>

            {/* Top Products */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <ShoppingBag className="text-blue-500" />
                    Platos Más Vendidos
                </h2>
                </div>
                <div className="h-64">
                    <Bar options={chartOptions} data={productChartData} />
                </div>
            </div>

             {/* Driver Performance */}
             <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Bike className="text-emerald-500" />
                    Rendimiento de Repartidores
                </h2>
                </div>
                <div className="h-64">
                     <Bar options={chartOptions} data={driverChartData} />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
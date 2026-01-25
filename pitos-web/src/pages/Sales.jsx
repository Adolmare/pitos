import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { ArrowLeft, Calendar, DollarSign, Download, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const socket = io(API_URL);

const Sales = () => {
    const { logout } = useAuth();
    const [salesData, setSalesData] = useState({ 
        orders: [],
        receipts: [] 
    });
    const [reportType, setReportType] = useState('weekly'); // 'weekly' | 'monthly'
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        chartData: null
    });

    useEffect(() => {
        fetchSales();
        socket.on('sales-updated', fetchSales);
        return () => socket.off('sales-updated');
    }, []);

    useEffect(() => {
        if (salesData.orders && salesData.orders.length > 0) {
            processReport(reportType);
        }
    }, [salesData, reportType]);

    const fetchSales = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/sales`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (res.ok) {
                const data = await res.json();
                setSalesData(data);
            }
        } catch (error) {
            console.error("Error details:", error);
        }
    };

    const processReport = (type) => {
        const now = new Date();
        let filteredOrders = [];
        let labels = [];
        let dataPoints = [];

        // Helper to check if date is in range
        const isSameDay = (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
        const getDate = (o) => new Date(o.timestamp || o.receivedAt);

        if (type === 'weekly') {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                labels.push(d.toLocaleDateString('es-ES', { weekday: 'short' }));
                
                // Sum orders for this specific day
                const dayTotal = salesData.orders
                    .filter(o => isSameDay(getDate(o), d))
                    .reduce((sum, o) => sum + (o.total || 0), 0);
                
                dataPoints.push(dayTotal);
            }
            
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            filteredOrders = salesData.orders.filter(o => getDate(o) > sevenDaysAgo);

        } else if (type === 'monthly') {
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            
            for (let i = 1; i <= daysInMonth; i++) {
                
                const currentMonthCheck = new Date(now.getFullYear(), now.getMonth(), i);
                labels.push(i.toString()); // Just day number for cleaner chart

                if (currentMonthCheck > now) {
                     dataPoints.push(0); // Future days are 0
                     continue;
                }

                const dayTotal = salesData.orders
                    .filter(o => isSameDay(getDate(o), currentMonthCheck))
                    .reduce((sum, o) => sum + (o.total || 0), 0);
                
                dataPoints.push(dayTotal);
            }

             const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
             filteredOrders = salesData.orders.filter(o => getDate(o) >= firstDayOfMonth);
        }

        const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const totalOrders = filteredOrders.length;

        setStats({
            totalRevenue,
            totalOrders,
            chartData: {
                labels,
                datasets: [{
                    label: 'Ventas ($)',
                    data: dataPoints,
                    borderColor: '#EAB308',
                    backgroundColor: 'rgba(234, 179, 8, 0.2)',
                    tension: 0.4,
                    fill: true
                }]
            }
        });
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
             tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(context) {
                        return `$${context.parsed.y.toFixed(2)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#9ca3af', callback: (val) => `$${val}` }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#9ca3af' }
            }
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white font-sans p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-10">
                    <div>
                        <Link to="/admin" className="text-neutral-400 hover:text-white flex items-center gap-2 mb-2 transition-colors">
                            <ArrowLeft size={20} />
                            Volver al Panel
                        </Link>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Filter className="text-blue-500" />
                            Reportes de Rendimiento
                        </h1>
                    </div>
                    
                    {/* Period Selector */}
                    <div className="flex bg-neutral-800 p-1 rounded-lg border border-white/10">
                        <button 
                            onClick={() => setReportType('weekly')}
                            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${reportType === 'weekly' ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                        >
                            Semanal
                        </button>
                        <button 
                            onClick={() => setReportType('monthly')}
                            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${reportType === 'monthly' ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-400 hover:text-white'}`}
                        >
                            Mensual
                        </button>
                    </div>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-neutral-800 p-8 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                        <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <DollarSign size={100} />
                        </div>
                        <p className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-2">Ingresos del Periodo</p>
                        <h2 className="text-5xl font-bold text-white tracking-tight">
                            ${stats.totalRevenue.toFixed(2)}
                        </h2>
                        <div className="mt-4 flex items-center gap-2 text-sm text-blue-400 bg-blue-500/10 w-fit px-3 py-1 rounded-full">
                            <Calendar size={14} />
                            <span>{reportType === 'weekly' ? 'Últimos 7 días' : 'Este mes'}</span>
                        </div>
                    </div>

                    <div className="bg-neutral-800 p-8 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                        <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Download size={100} />
                        </div>
                        <p className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-2">Pedidos Realizados</p>
                        <h2 className="text-5xl font-bold text-white tracking-tight">
                            {stats.totalOrders}
                        </h2>
                         <div className="mt-4 text-sm text-neutral-500">
                            Promedio: ${(stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0).toFixed(2)} / pedido
                        </div>
                    </div>
                </div>

                {/* Main Chart */}
                <div className="bg-neutral-800 p-6 rounded-2xl border border-white/10 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Evolución de Ventas</h3>
                    </div>
                    <div className="h-[400px] w-full">
                        {stats.chartData && <Line options={chartOptions} data={stats.chartData} />}
                    </div>
                </div>

                {/* Detailed Table (Optional for reports) */}
                <div className="mt-8 bg-neutral-800 rounded-2xl border border-white/10 overflow-hidden">
                     <div className="p-6 border-b border-white/10">
                        <h3 className="font-semibold text-white">Detalle de Transacciones (Periodo Actual)</h3>
                     </div>
                     <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-900 sticky top-0 text-xs uppercase text-neutral-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Nombre</th>
                                    <th className="px-6 py-4">ID Pedido</th>
                                    <th className="px-6 py-4">Items</th>
                                    <th className="px-6 py-4">Método Pago</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {salesData.orders
                                    .filter(o => {
                                        const t = o.timestamp || o.receivedAt;
                                        if (!t) return false;
                                        const date = new Date(t);
                                        const now = new Date();
                                        if (reportType === 'weekly') {
                                            const sevenDaysAgo = new Date();
                                            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                                            return date > sevenDaysAgo;
                                        } else {
                                            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                                            return date >= firstDay;
                                        }
                                    })
                                    .sort((a,b) => new Date(b.timestamp || b.receivedAt) - new Date(a.timestamp || a.receivedAt))
                                    .map(order => (
                                    <tr key={order.id || Math.random()} className="hover:bg-white/5">
                                        <td className="px-6 py-4 text-neutral-300">
                                            {new Date(order.timestamp || order.receivedAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">
                                            {order.customer?.name || order.username || 'Cliente'}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-400 font-mono">
                                            #{order.id ? order.id.toString().slice(-4) : '???'}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-300">
                                            <div className="flex flex-col gap-1">
                                                {order.items?.map((item, idx) => (
                                                    <span key={idx} className="text-xs bg-white/5 px-2 py-1 rounded w-fit">
                                                        {item.quantity}x {item.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-300 uppercase text-xs font-bold tracking-wide">
                                            <span className={`px-2 py-1 rounded ${
                                                (order.customer?.paymentMethod === 'card' || order.customer?.paymentMethod === 'tarjeta') 
                                                ? 'bg-purple-500/10 text-purple-400' 
                                                : 'bg-green-500/10 text-green-400'
                                            }`}>
                                                {order.customer?.paymentMethod || 'Efectivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-white">
                                            ${order.total?.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                </div>

            </div>
        </div>
    );
};

export default Sales;


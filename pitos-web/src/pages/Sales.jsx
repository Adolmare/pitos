import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { DollarSign, Receipt, TrendingUp, Calendar, ArrowLeft, ShoppingBag, Eye, X } from 'lucide-react';
import { Link } from 'react-router-dom';
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

const socket = io('http://localhost:3000');

const Sales = () => {
    const [salesData, setSalesData] = useState({ 
        ordersTotal: 0, 
        receiptsTotal: 0, 
        globalTotal: 0, 
        topProducts: [], 
        orders: [], 
        receipts: [] 
    });
    
    const [loading, setLoading] = useState(true);
    const [selectedReceipt, setSelectedReceipt] = useState(null); // For modal

    const fetchSales = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/sales');
            const data = await res.json();
            setSalesData(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching sales:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();

        // Listen for real-time updates
        socket.on('sales-updated', () => {
             fetchSales();
        });

        return () => {
            socket.off('sales-updated');
        };
    }, []);

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleString('es-ES', {
            dateStyle: 'short',
            timeStyle: 'medium'
        });
    };

    const chartData = {
        labels: salesData?.topProducts?.map(p => p.name) || [],
        datasets: [
            {
                label: 'Cantidad Vendida',
                data: salesData?.topProducts?.map(p => p.quantity) || [],
                backgroundColor: 'rgba(234, 179, 8, 0.5)',
                borderColor: 'rgba(234, 179, 8, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#9ca3af' }
            },
            title: {
                display: true,
                text: 'Platos Más Vendidos',
                color: '#ffffff',
                font: { size: 16 }
            },
        },
        scales: {
            y: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white font-sans p-6 pb-20">
            <div className="max-w-7xl mx-auto">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <Link to="/" className="text-neutral-400 hover:text-white flex items-center gap-2 mb-2 transition-colors">
                            <ArrowLeft size={20} />
                            Volver al inicio
                        </Link>
                        <h1 className="text-3xl font-bold text-yellow-500 flex items-center gap-3">
                            <TrendingUp className="text-yellow-500" />
                            Panel Financiero
                        </h1>
                    </div>
                </header>

                {/* --- SECCIÓN 1: KPIs FINANCIEROS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Global */}
                    <div className="bg-neutral-800 p-6 rounded-2xl border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <DollarSign className="w-24 h-24" />
                        </div>
                        <h3 className="text-neutral-400 font-medium uppercase tracking-wider text-sm mb-1">Ventas Totales</h3>
                        <p className="text-5xl font-bold text-white mb-2">
                            ${salesData.globalTotal?.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-neutral-400">
                             <TrendingUp size={16} className="text-green-500" />
                             <span>Ingresos consolidados</span>
                        </div>
                    </div>

                    {/* Desglose Pedidos Web */}
                    <div className="bg-neutral-800 p-6 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-500/20 rounded-lg">
                                <ShoppingBag className="w-6 h-6 text-blue-500" />
                            </div>
                            <span className="text-xs font-bold bg-blue-500/10 text-blue-400 px-2 py-1 rounded">WEB</span>
                        </div>
                        <h3 className="text-neutral-400 font-medium">Pedidos Web</h3>
                        <p className="text-3xl font-bold text-white">
                            ${salesData.ordersTotal?.toFixed(2)}
                        </p>
                        <p className="text-sm text-neutral-500 mt-1">
                            {salesData.orders?.length || 0} pedidos realizados
                        </p>
                    </div>

                    {/* Desglose Comprobantes */}
                    <div className="bg-neutral-800 p-6 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-500/20 rounded-lg">
                                <Receipt className="w-6 h-6 text-green-500" />
                            </div>
                            <span className="text-xs font-bold bg-green-500/10 text-green-400 px-2 py-1 rounded">EFECTIVO/OTROS</span>
                        </div>
                        <h3 className="text-neutral-400 font-medium">Dinero Comprobantes</h3>
                        <p className="text-3xl font-bold text-white">
                            ${salesData.receiptsTotal?.toFixed(2)}
                        </p>
                         <p className="text-sm text-neutral-500 mt-1">
                            {salesData.receipts?.length || 0} comprobantes verificados
                        </p>
                    </div>
                </div>

                {/* --- SECCIÓN CHART: GRÁFICA DE VENTAS --- */}
                <div className="bg-neutral-800 p-6 rounded-2xl border border-white/10 mb-8 overflow-hidden">
                     <div className="h-80 w-full">
                        <Bar options={chartOptions} data={chartData} />
                     </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* --- SECCIÓN 2: PRODUCTOS MÁS VENDIDOS --- */}
                    <div className="bg-neutral-800 rounded-2xl border border-white/10 overflow-hidden h-fit">
                        <div className="p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <ShoppingBag size={20} className="text-yellow-500" />
                                Productos Más Vendidos
                            </h2>
                        </div>
                        <div className="p-6">
                            {salesData.topProducts?.length > 0 ? (
                                <div className="space-y-4">
                                    {salesData.topProducts.map((prod, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 flex items-center justify-center bg-neutral-700 rounded-full font-bold text-sm text-yellow-500">
                                                    #{index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{prod.name}</p>
                                                    <p className="text-sm text-neutral-400">{prod.quantity} unidades vendidas</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-white">${prod.revenue.toFixed(2)}</p>
                                                <p className="text-xs text-neutral-500">Ingresos</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-neutral-500">
                                    No hay datos de productos suficientes.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- SECCIÓN 3: HISTORIAL DE COMPROBANTES --- */}
                    <div className="bg-neutral-800 rounded-2xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Receipt size={20} className="text-green-500" />
                                Comprobantes Recientes
                            </h2>
                        </div>
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="bg-neutral-900/50 text-neutral-400 text-sm uppercase sticky top-0 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Fecha</th>
                                        <th className="px-6 py-4 font-medium text-right">Monto</th>
                                        <th className="px-6 py-4 font-medium text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {salesData.receipts?.map((receipt) => (
                                        <tr key={receipt.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-sm text-neutral-300">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-neutral-500" />
                                                    {formatDate(receipt.timestamp)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-green-400">
                                                +${receipt.amount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => setSelectedReceipt(receipt)}
                                                    className="p-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-white transition-colors"
                                                    title="Ver comprobante"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!salesData.receipts || salesData.receipts.length === 0) && (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-8 text-center text-neutral-500">
                                                No hay comprobantes subidos.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* --- MODAL PARA VER IMAGEN --- */}
                {selectedReceipt && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedReceipt(null)}>
                        <div className="bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="font-bold text-white">Detalle del Comprobante</h3>
                                <button onClick={() => setSelectedReceipt(null)} className="text-neutral-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-4 bg-black flex items-center justify-center overflow-auto flex-1">
                                <img 
                                    src={selectedReceipt.imageUrl} 
                                    alt="Comprobante" 
                                    className="max-w-full max-h-[60vh] object-contain rounded-lg"
                                />
                            </div>
                            <div className="p-6 bg-neutral-800">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-neutral-400 uppercase">Monto Detectado</p>
                                        <p className="text-2xl font-bold text-green-400">${selectedReceipt.amount.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-neutral-400 uppercase">Detectado por OCR</p>
             
                                        <p className="text-sm text-neutral-300 italic truncate">"{selectedReceipt.text?.substring(0, 50)}..."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sales;


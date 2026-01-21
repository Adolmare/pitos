import React, { useState, useEffect } from 'react';
import { Upload, DollarSign, CheckCircle, AlertCircle, Camera, Edit2, LogOut, MapPin, Navigation, ClipboardList, User, TrendingUp, Trophy, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
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

const Repartidor = () => {
    const { user, logout } = useAuth();
    const [view, setView] = useState('orders'); 
    const [orders, setOrders] = useState([]);
    const [adminStats, setAdminStats] = useState(null);

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanResult, setScanResult] = useState(null); 
    const [finalResult, setFinalResult] = useState(null);
    const [error, setError] = useState(null);
    const [manualAmount, setManualAmount] = useState('');

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchStats();
        } else if (view === 'orders') {
            fetch('http://localhost:3000/api/orders', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            })
            .then(res => res.json())
            .then(data => setOrders(data))
            .catch(err => console.error(err));
        }
    }, [view, user]);

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/sales', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAdminStats(data);
            }
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        }
    };

    // --- ADMIN VIEW RENDER ---
    if (user?.role === 'admin') {
        const driverChartData = {
            labels: adminStats?.topDrivers ? adminStats.topDrivers.map(d => d.name) : [],
            datasets: [
                {
                    label: 'Pedidos Entregados',
                    data: adminStats?.topDrivers ? adminStats.topDrivers.map(d => d.count) : [],
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1,
                },
            ],
        };

        const chartOptions = {
            responsive: true,
            plugins: {
                legend: { position: 'top', labels: { color: 'white' } },
                title: { display: false },
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    ticks: { color: 'white' }, 
                    grid: { color: 'rgba(255,255,255,0.1)' } 
                },
                x: { 
                    ticks: { color: 'white' }, 
                    grid: { color: 'rgba(255,255,255,0.1)' } 
                }
            }
        };

        return (
            <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-8 flex items-center justify-between">
                        <div>
                            <Link to="/admin" className="text-gray-400 hover:text-white flex items-center gap-2 mb-2 transition-colors">
                                <ArrowLeft size={20} />
                                Volver al Panel
                            </Link>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <TrendingUp className="text-emerald-500" />
                                Panel de Rendimiento - Repartidores
                            </h1>
                        </div>
                        <button onClick={logout} className="bg-red-600/20 text-red-500 p-2 rounded-lg hover:bg-red-600 hover:text-white transition">
                            <LogOut size={20} />
                        </button>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Chart */}
                        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Trophy className="text-yellow-500" size={20} />
                                Top Repartidores (Entregas)
                            </h3>
                            <div className="h-64">
                                {adminStats?.topDrivers?.length > 0 ? (
                                    <Bar options={chartOptions} data={driverChartData} />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">Sin datos de entregas</div>
                                )}
                            </div>
                        </div>

                        {/* Summary / Stats Card */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                                <h3 className="text-emerald-400 font-bold uppercase text-sm mb-2">Total Entregas Realizadas</h3>
                                <p className="text-4xl font-bold text-white">
                                    {adminStats?.topDrivers?.reduce((acc, curr) => acc + curr.count, 0) || 0}
                                </p>
                            </div>
                            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                                <h3 className="text-blue-400 font-bold uppercase text-sm mb-2">Recaudación Total (Envíos)</h3>
                                <p className="text-4xl font-bold text-white">
                                    ${adminStats?.topDrivers?.reduce((acc, curr) => acc + curr.revenue, 0).toFixed(2) || '0.00'}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">*Suma total de pedidos entregados</p>
                            </div>
                        </div>
                    </div>

                    {/* Detailed List */}
                    <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-700">
                            <h3 className="font-bold text-lg">Detalle por Repartidor</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Repartidor</th>
                                        <th className="px-6 py-4 text-center">Entregas</th>
                                        <th className="px-6 py-4 text-right">Recaudado</th>
                                        <th className="px-6 py-4 text-center">Efectividad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {adminStats?.topDrivers?.map((driver, index) => (
                                        <tr key={index} className="hover:bg-white/5 transition">
                                            <td className="px-6 py-4 font-medium flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                                                    {driver.name.charAt(0).toUpperCase()}
                                                </div>
                                                {driver.name}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg font-bold">
                                                    {driver.count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-gray-300">
                                                ${driver.revenue.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-500 text-sm">
                                                {(driver.count > 0) ? '100%' : '-'}
                                                {/* Placeholder for future "Cancelled vs Delivered" logic */}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!adminStats?.topDrivers || adminStats.topDrivers.length === 0) && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                                No hay actividad de repartidores registrada en este periodo.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    // --- END ADMIN VIEW ---

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
            setScanResult(null);
            setFinalResult(null);
        }
    };

    const handleScan = async (e) => {
        e.preventDefault();
        if (!file) {
            setError("Por favor selecciona una imagen");
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('http://localhost:3000/api/scan-receipt', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setScanResult(data);
                setManualAmount(data.detectedAmount ? data.detectedAmount.toString() : '');
            } else {
                setError(data.error || "No se pudo procesar el comprobante");
            }
        } catch (err) {
            setError("Error al conectar con el servidor" + err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!manualAmount || isNaN(parseFloat(manualAmount))) {
            setError("Por favor ingresa un monto válido");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/confirm-receipt', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    amount: parseFloat(manualAmount),
                    imageUrl: scanResult.imageUrl,
                    text: scanResult.textSnippet
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setFinalResult(data);
                setScanResult(null); 
                setFile(null);
                setPreview(null);
            } else {
                setError(data.error || "Error al guardar el comprobante");
            }

        } catch (err) {
            setError("Error al confirmar: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = (orderId, newStatus) => {
        fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(res => {
            if (res.ok) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            }
        })
        .catch(err => console.error("Error updating status:", err));
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white p-6 font-sans pb-20">
            <div className="max-w-md mx-auto">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-yellow-500 mb-1">Portal de Repartidores</h1>
                        <p className="text-neutral-400 text-sm">Sube tus comprobantes de entrega</p>
                    </div>
                    <button
                        onClick={logout}
                        className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white p-3 rounded-xl transition-all"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={24} />
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-neutral-800 p-1 rounded-xl">
                    <button 
                        onClick={() => setView('orders')}
                        className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${view === 'orders' ? 'bg-yellow-500 text-black' : 'text-neutral-400 hover:text-white'}`}
                    >
                        <ClipboardList size={20}/> Mis Pedidos
                    </button>
                    <button 
                        onClick={() => setView('scan')}
                        className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${view === 'scan' ? 'bg-yellow-500 text-black' : 'text-neutral-400 hover:text-white'}`}
                    >
                        <Camera size={20}/> Escanear
                    </button>
                </div>

                {view === 'orders' && (
                    <div className="space-y-4">
                        {orders.length === 0 && (
                            <div className="text-center py-10 text-neutral-500">
                                <p>No tienes pedidos asignados actualmente.</p>
                            </div>
                        )}
                        {orders.map(order => (
                            <div key={order.id} className="bg-neutral-800 rounded-xl p-4 border border-white/10 shadow-lg">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs font-bold uppercase border border-yellow-500/20">
                                        {order.status}
                                    </span>
                                    <span className="text-white font-bold">${order.total.toFixed(2)}</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">{order.customer.name}</h3>
                                <p className="text-neutral-400 text-sm mb-4 flex items-start gap-2">
                                    <MapPin size={16} className="flex-shrink-0 mt-0.5"/>
                                    {order.customer.address}
                                </p>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer.address)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-colors"
                                    >
                                        <Navigation size={18}/> Ver Ruta
                                    </a>
                                    {order.status !== 'delivered' ? (
                                        <button 
                                            className="bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                            onClick={() => updateStatus(order.id, 'delivered')}
                                        >
                                            <CheckCircle size={18}/> Entregado
                                        </button>
                                    ) : (
                                        <div className="bg-green-600/20 text-green-500 border border-green-600/30 rounded-lg flex items-center justify-center font-bold text-sm">
                                            ¡Entregado!
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {view === 'scan' && (
                <div className="bg-neutral-800 rounded-2xl p-6 shadow-xl border border-white/10">
                    
                    {/* STEP 1: UPLOAD & SCAN */}
                    {!scanResult && !finalResult && (
                        <form onSubmit={handleScan} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-neutral-300">
                                    Foto del Comprobante
                                </label>
                                
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="receipt-upload"
                                    />
                                    <label
                                        htmlFor="receipt-upload"
                                        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                                            preview 
                                                ? 'border-yellow-500 bg-neutral-900' 
                                                : 'border-neutral-600 hover:border-yellow-500/50 hover:bg-neutral-700/50'
                                        }`}
                                    >
                                        {preview ? (
                                            <div className="relative w-full h-full p-2">
                                                <img 
                                                    src={preview} 
                                                    alt="Vista previa" 
                                                    className="w-full h-full object-contain rounded-lg"
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                                    <Camera className="w-8 h-8 text-white" />
                                                    <span className="ml-2">Cambiar foto</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Camera className="w-12 h-12 text-neutral-400 mb-3" />
                                                <p className="mb-2 text-sm text-neutral-400">
                                                    <span className="font-semibold text-yellow-500">Toca para tomar foto</span>
                                                </p>
                                                <p className="text-xs text-neutral-500">o selecciona de la galería</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !file}
                                className={`w-full py-4 px-6 rounded-xl font-bold text-black text-lg flex items-center justify-center gap-2 transition-all ${
                                    loading || !file
                                        ? 'bg-neutral-600 cursor-not-allowed text-neutral-400'
                                        : 'bg-yellow-500 hover:bg-yellow-400 hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        <span>Analizando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={24} />
                                        <span>Subir y Analizar</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    { scanResult && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="text-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                                <h3 className="text-xl font-bold text-white mb-1">Verifica el Monto</h3>
                                <p className="text-sm text-neutral-400">Corrige si el valor detectado no coincide con la imagen.</p>
                            </div>

                            {/* Image Preview for Verification */}
                            <div className="bg-black/50 p-4 rounded-xl border border-white/10 flex justify-center">
                                <img 
                                    src={preview || (scanResult?.imageUrl ? `${scanResult.imageUrl}?token=${user.token}` : '')} 
                                    alt="Comprobante a verificar" 
                                    className="max-h-60 object-contain rounded-lg"
                                />
                            </div>

                            {/* DETECTED NAME */}
                            {scanResult.detectedName && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-neutral-300">
                                        Nombre / Remitente
                                    </label>
                                    <div className="w-full bg-neutral-900 border border-neutral-700 rounded-xl py-3 px-4 text-white font-medium flex items-center gap-3">
                                         <div className="bg-purple-500/20 p-2 rounded-full">
                                            <User size={16} className="text-purple-400" />
                                         </div>
                                         <span className="truncate">{scanResult.detectedName}</span>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-neutral-300">
                                    Monto del Comprobante ($)
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-4 text-green-500" />
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={manualAmount}
                                        onChange={e => setManualAmount(e.target.value)}
                                        className="w-full bg-black border border-neutral-700 rounded-xl py-4 pl-12 text-2xl font-bold text-white focus:border-green-500 focus:outline-none"
                                    />
                                    <div className="absolute right-4 top-4">
                                        <Edit2 className="text-neutral-500 w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900 p-3 rounded-lg border border-white/5">
                                <p className="text-xs text-neutral-500 uppercase mb-1">Texto OCR detectado</p>
                                <p className="text-xs text-neutral-400 italic font-mono line-clamp-3">
                                    {scanResult.textSnippet || "No text detected"}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setScanResult(null)}
                                    className="py-3 rounded-xl font-bold text-white border border-neutral-600 hover:bg-neutral-800"
                                >
                                    Reintentar
                                </button>
                                <button 
                                    onClick={handleConfirm}
                                    disabled={loading}
                                    className="py-3 rounded-xl font-bold text-black bg-green-500 hover:bg-green-400"
                                >
                                    {loading ? 'Guardando...' : 'Confirmar ✅'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {error && (
                        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* STEP 3: SUCCESS */}
                    {finalResult && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8"
                        >
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                <CheckCircle className="w-10 h-10 text-black" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">¡Guardado Exitoso!</h2>
                            <p className="text-neutral-400 mb-6">El comprobante ha sido registrado.</p>
                            
                            <div className="p-4 bg-neutral-900 rounded-xl mb-6 inline-block">
                                <span className="text-neutral-500 text-sm">Monto Registrado</span>
                                <p className="text-3xl font-bold text-green-500">${finalResult.receipt.amount.toFixed(2)}</p>
                            </div>

                            <button 
                                onClick={() => {
                                    setFinalResult(null);
                                    setFile(null);
                                    setPreview(null);
                                }}
                                className="w-full py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl font-medium transition-colors"
                            >
                                Subir Otro Comprobante
                            </button>
                        </motion.div>
                    )}
                </div>
                )}
            </div>
        </div>
    );
};

export default Repartidor;


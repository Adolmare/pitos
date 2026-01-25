import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Coffee, DollarSign, Plus, Trash2, ArrowLeft, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';

const socket = io(API_URL);

const Tables = () => {
    const { user, logout } = useAuth();
    const [tables, setTables] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        fetchTables();
        fetchProducts();

        socket.on('tables-updated', (updatedTables) => {
            setTables(updatedTables);
            // If the selected table was updated remotely, update local view too
            if (selectedTable) {
                const updatedCurrent = updatedTables.find(t => t.id === selectedTable.id);
                if (updatedCurrent) setSelectedTable(updatedCurrent);
            }
        });

        return () => {
            socket.off('tables-updated');
        };
    }, [selectedTable]);

    const fetchTables = async () => {
        try {
             const res = await fetch(`${API_URL}/api/tables`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
             });
             if (res.ok) setTables(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_URL}/api/products`);
            if (res.ok) setProducts(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    const handleOccupy = async (tableId) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/tables/${tableId}/occupy`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const updatedTable = await res.json();
                setSelectedTable(updatedTable);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (productId) => {
        if (!selectedTable) return;
        try {
            const res = await fetch(`${API_URL}/api/tables/${selectedTable.id}/add-item`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}` 
                },
                body: JSON.stringify({ productId, quantity: 1 })
            });

            if (res.ok) {
                 // Updated via socket or we can update locally, but socket does it
                 // Optional: Show notification
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseTable = async () => {
        if (!selectedTable) return;
        
        // Show bill summary before closing? For now, we confirm.
        if (!window.confirm(`¿Confirmar cierre de mesa y generar factura por $${selectedTable.total.toFixed(2)}?`)) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/tables/${selectedTable.id}/close`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            
            if (res.ok) {
                setSelectedTable(null);
                alert("Factura creada correctamente. Mesa liberada.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white p-6 pb-20 font-sans relative">
             {/* MENU SELECTOR MODAL */}
             {isMenuOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-neutral-800 w-full max-w-4xl max-h-[80vh] rounded-2xl border border-white/10 flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-neutral-800 rounded-t-2xl z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Seleccionar Productos</h2>
                                <p className="text-neutral-400 text-sm">Agregando a {selectedTable?.name}</p>
                            </div>
                            <button 
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 hover:bg-neutral-700 rounded-full transition-colors"
                            >
                                <XCircle size={32} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {products.map(prod => (
                                    <button
                                        key={prod.id}
                                        onClick={() => handleAddItem(prod.id)}
                                        className="bg-neutral-900 border border-white/5 hover:border-yellow-500 hover:bg-neutral-700 p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform font-bold text-xl">
                                            {prod.name.charAt(0)}
                                        </div>
                                        <div className="text-center">
                                            <span className="block font-bold mb-1 truncate w-full">{prod.name}</span>
                                            <span className="text-sm text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                                                ${prod.price}
                                            </span>
                                        </div>
                                        <span className="text-xs text-neutral-500 mt-2 flex items-center gap-1 group-hover:text-yellow-500">
                                            <Plus size={14} /> Agregar
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/10 bg-neutral-900/50 rounded-b-2xl text-right">
                             <button 
                                onClick={() => setIsMenuOpen(false)}
                                className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded-lg font-bold transition-colors"
                             >
                                 Listo / Volver
                             </button>
                        </div>
                    </div>
                </div>
             )}

             <header className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-neutral-400 hover:text-white flex items-center gap-2 transition-colors">
                        <ArrowLeft size={20} />
                        Volver
                    </Link>
                    <h1 className="text-3xl font-bold text-yellow-500 ml-6">Gestión de Mesas</h1>
                </div>
                <button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors flex items-center gap-2 px-4"
                    title="Cerrar Sesión"
                >
                    <LogOut size={18} />
                    <span className="text-sm font-bold">Salir</span>
                </button>
             </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LIST OF TABLES */}
                <div className="lg:col-span-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {tables.map(table => (
                        <button
                            key={table.id}
                            onClick={() => setSelectedTable(table)}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 h-32 relative ${
                                table.status === 'occupied' 
                                    ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20' 
                                    : 'bg-green-500/10 border-green-500 text-green-500 hover:bg-green-500/20'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                table.status === 'occupied' ? 'bg-red-500 text-black' : 'bg-green-500 text-black'
                            }`}>
                                <Coffee size={32} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold">{table.name}</h3>
                                <p className="text-sm opacity-80 uppercase font-bold tracking-wider">
                                    {table.status === 'occupied' ? 'Ocupada' : 'Libre'}
                                </p>
                            </div>
                            {table.status === 'occupied' && (
                                <div className="absolute top-4 right-4 bg-black/50 px-2 py-1 rounded text-white text-sm">
                                    ${table.total.toFixed(2)}
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* SELECTED TABLE ACTIONS */}
                <div className="bg-neutral-800 rounded-2xl border border-white/10 p-6 h-fit sticky top-6">
                    {selectedTable ? (
                        <>
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{selectedTable.name}</h2>
                                    <p className={`text-sm ${selectedTable.status === 'occupied' ? 'text-red-400' : 'text-green-400'}`}>
                                        {selectedTable.status === 'occupied' ? 'En Servicio' : 'Disponible'}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedTable(null)} className="text-neutral-400 hover:text-white">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            {selectedTable.status === 'free' ? (
                                <div className="text-center py-8">
                                    <button 
                                        onClick={() => handleOccupy(selectedTable.id)}
                                        disabled={loading}
                                        className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl text-lg transition-colors"
                                    >
                                        Abrir Mesa
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* ORDER LIST */}
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                        {selectedTable.items.length > 0 ? (
                                            selectedTable.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-black/30 p-3 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-white">{item.name}</p>
                                                        <p className="text-xs text-neutral-500">${item.price.toFixed(2)} x {item.quantity}</p>
                                                    </div>
                                                    <span className="font-bold text-white ml-2">
                                                        ${(item.price * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-neutral-500 py-4 italic">Sin productos agregados</p>
                                        )}
                                    </div>

                                    {/* ADD PRODUCTS */}
                                    <div className="border-t border-white/10 pt-4">
                                        <p className="text-sm font-bold text-yellow-500 mb-2 uppercase">Agregar Producto</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {products.map(prod => (
                                                <button
                                                    key={prod.id}
                                                    onClick={() => handleAddItem(prod.id)}
                                                    className="p-2 text-sm bg-neutral-700 hover:bg-neutral-600 rounded-lg text-left truncate transition-colors"
                                                >
                                                    <span className="block truncate">{prod.name}</span>
                                                    <span className="text-xs text-neutral-400">${prod.price}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* TOTAL & ACTIONS */}
                                    <div className="border-t border-white/10 pt-6 mt-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-lg text-neutral-400">Total a Cobrar</span>
                                            <span className="text-3xl font-bold text-white">${selectedTable.total.toFixed(2)}</span>
                                        </div>
                                        <button 
                                            onClick={handleCloseTable}
                                            disabled={loading}
                                            className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-lg flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <DollarSign size={24} />
                                            Cerrar Cuenta & Pagar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20 text-neutral-500">
                            <Coffee className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>Selecciona una mesa para ver detalles</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Tables;

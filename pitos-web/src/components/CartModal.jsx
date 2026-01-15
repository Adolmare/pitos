import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, MapPin, Navigation, ShoppingBag, ArrowLeft, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartModal = () => {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateQuantity, 
    cartTotal,
    clearCart 
  } = useCart();

  const [isCheckoutMode, setIsCheckoutMode] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    paymentMethod: 'nequi',
    address: '',
    notes: ''
  });

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
      setIsCartOpen(false);
      setTimeout(() => setIsCheckoutMode(false), 300); // Reset after close animation
  };

  const getLocation = () => {

    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsCoords({ latitude, longitude }); // Save coords strictly

        const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
        setFormData(prev => ({ 
          ...prev, 
          address: `${prev.address ? prev.address + ' | ' : ''}📍 Ubicación GPS: ${mapsLink}` 
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location", error);
        alert('No pudimos obtener tu ubicación. RECUERDA: La ubicación GPS es obligatoria para el pedido.');
        setIsGettingLocation(false);
      }
    );
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // VALIDATION: GPS IS MANDATORY
    if (!gpsCoords) {
      alert('⚠️ ATENCIÓN: La ubicación GPS es OBLIGATORIA para confirmar el pedido.\n\nPor favor presiona el botón "Usar mi ubicación" en el formulario.');
      return;
    }

    if (!formData.name || !formData.address) {
      alert('Por favor completa todos los campos del formulario.');
      return;
    }

    const orderPayload = {
        customer: {
            name: formData.name,
            phone: "N/A", // We might want to add phone field later
            address: formData.address,
            location: gpsCoords, // { latitude, longitude }
            paymentMethod: formData.paymentMethod,
            notes: formData.notes
        },
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
        })),
        total: cartTotal,
        timestamp: new Date().toISOString()
    };

    try {
        // Enviar al Backend
        // NOTE: This URL needs to be updated when the real backend is deployed.
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        if (response.ok) {
            alert('✅ ¡Pedido enviado correctamente al restaurante!');
            clearCart();
            setIsCartOpen(false);
            setFormData({ name: '', paymentMethod: 'nequi', address: '', notes: '' });
            setGpsCoords(null);
            setIsCheckoutMode(false);
        } else {
            // Mock success for Demo purposes if backend is missing
            console.warn("Backend not reachable, simulating success for demo.");
            alert('❌ Error de conexión con el servidor del restaurante. (Simulación: El pedido se habría enviado)');
        }
    } catch (error) {
        console.error("Order submission error:", error);
        alert('❌ Error al conectar con el servidor. Asegúrate de que el backend esté corriendo en http://localhost:3000');
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-zinc-900 border-l border-white/10 shadow-2xl z-[70] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {isCheckoutMode ? (
                    <button onClick={() => setIsCheckoutMode(false)} className="mr-2 hover:text-yellow-500 transition">
                        <ArrowLeft />
                    </button>
                ) : (
                    <ShoppingBag className="text-yellow-500" />
                )}
                {isCheckoutMode ? 'Finalizar Pedido' : 'Tu Pedido'}
              </h2>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Cerrar"
              >
                <X size={24} />
              </button>
            </div>
          </div>

            {/* Cart Items (Scrollable) - Show only if NOT in checkout mode */}
            {!isCheckoutMode && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                    <div className="text-center text-gray-500 py-20 flex flex-col items-center">
                    <ShoppingBag size={48} className="mb-4 opacity-20" />
                    <p>Tu carrito está vacío</p>
                    <button 
                        onClick={handleClose}
                        className="mt-4 text-yellow-500 hover:text-yellow-400 font-bold"
                    >
                        Ver Menú
                    </button>
                    </div>
                ) : (
                    cart.map((item) => (
                    <motion.div 
                        layout
                        key={item.id} 
                        className="flex gap-4 bg-white/5 p-4 rounded-xl border border-white/5"
                    >
                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                        <div className="flex-1">
                        <h3 className="font-bold text-lg leading-tight mb-1">{item.name}</h3>
                        <p className="text-yellow-500 font-bold">${item.price.toLocaleString()}</p>
                        
                        <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3 bg-black/30 rounded-full px-2 py-1">
                            <button 
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20"
                            >
                                <Minus size={12} />
                            </button>
                            <span className="font-bold w-4 text-center">{item.quantity}</span>
                            <button 
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20"
                            >
                                <Plus size={12} />
                            </button>
                            </div>
                            <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-500 hover:text-red-500 transition-colors"
                            >
                            <Trash2 size={18} />
                            </button>
                        </div>
                        </div>
                    </motion.div>
                    ))
                )}
                </div>
            )}
            
            {/* Show Checkout Form if in checkout mode */}
            {isCheckoutMode && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6"> 
                    <div className="space-y-4">
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mb-6">
                            <h4 className="font-bold text-yellow-500 mb-2">Resumen</h4>
                            <div className="space-y-1 text-sm text-gray-300">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span>${(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="border-t border-white/10 mt-2 pt-2 flex justify-between font-bold text-white">
                                    <span>Total:</span>
                                    <span>${cartTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <h3 className="font-bold text-lg text-white">Datos de Envío</h3>
                        
                        <div>
                        <label className="text-sm text-gray-400 block mb-1">Nombre Completo</label>
                        <input 
                            type="text" 
                            name="name"
                            required
                            placeholder="Ej: Juan Pérez"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-yellow-500 transition-colors"
                        />
                        </div>

                        <div>
                        <label className="text-sm text-gray-400 block mb-1">Método de Pago</label>
                        <select 
                            name="paymentMethod"
                            value={formData.paymentMethod}
                            onChange={handleInputChange}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-yellow-500 transition-colors [&>option]:bg-neutral-800"
                        >
                            <option value="nequi">Nequi / Daviplata</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Bancolombia</option>
                        </select>
                        </div>

                        <div className="relative">
                        <label className="text-sm text-gray-400 block mb-1">Dirección de Entrega</label>
                        <textarea 
                            name="address" 
                            required
                            placeholder="Barrio, Calle, Carrera, #Casa..."
                            value={formData.address}
                            onChange={handleInputChange}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-yellow-500 transition-colors min-h-[80px]"
                        />
                        <button 
                            type="button"
                            onClick={getLocation}
                            disabled={isGettingLocation}
                            className="absolute bottom-3 right-3 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                            {isGettingLocation ? '...' : <><Navigation size={12} /> Usar mi ubicación</>}
                        </button>
                        </div>

                        <div>
                        <label className="text-sm text-gray-400 block mb-1">Notas Adicionales</label>
                        <input 
                            type="text" 
                            name="notes"
                            placeholder="Ej: Sin cebolla, salsas aparte"
                            value={formData.notes}
                            onChange={handleInputChange}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-yellow-500 transition-colors text-sm"
                        />
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Actions */}
            {cart.length > 0 && (
              <div className="border-t border-white/10 bg-neutral-900 p-6 space-y-4">
                <div className="flex items-center justify-between text-xl font-bold">
                  <span>Total a Pagar</span>
                  <span className="text-yellow-500">${cartTotal.toLocaleString()}</span>
                </div>

                {!isCheckoutMode ? (
                    <button 
                        onClick={() => setIsCheckoutMode(true)}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        Continuar Compra <CheckCircle size={20} />
                    </button>
                ) : (
                    <button 
                        onClick={submitOrder}
                        disabled={!formData.name || !formData.address || !gpsCoords}
                        className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg hover:from-red-500 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={24} />
                        Confirmar y Enviar Pedido
                    </button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartModal;

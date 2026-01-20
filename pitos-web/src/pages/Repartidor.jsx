import React, { useState } from 'react';
import { Upload, DollarSign, CheckCircle, AlertCircle, Camera, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Repartidor = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanResult, setScanResult] = useState(null); // Intermediate state for confirmation
    const [finalResult, setFinalResult] = useState(null);
    const [error, setError] = useState(null);
    const [manualAmount, setManualAmount] = useState('');
    const { user } = useAuth();

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
                // Pre-fill manual amount if detected, else empty
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
                setScanResult(null); // Clear confirmation screen
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

    return (
        <div className="min-h-screen bg-neutral-900 text-white p-6 font-sans pb-20">
            <div className="max-w-md mx-auto">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-yellow-500 mb-2">Portal de Repartidores</h1>
                    <p className="text-neutral-400">Sube tus comprobantes de entrega</p>
                </header>

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

                    {/* STEP 2: VERIFY & CONFIRM */}
                    {scanResult && (
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
            </div>
        </div>
    );
};

export default Repartidor;


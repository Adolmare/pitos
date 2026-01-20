import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash, X, Save, ArrowLeft, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isAdding, setIsAdding] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Pizzas', description: '', image: '' });
    const { user } = useAuth();

    const fetchProducts = async () => {
        const res = await fetch('http://localhost:3000/api/products');
        const data = await res.json();
        setProducts(data);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleEditClick = (product) => {
        setEditingId(product.id);
        setEditForm(product);
    };

    const handleUpdate = async () => {
        await fetch(`http://localhost:3000/api/products/${editingId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(editForm)
        });
        setEditingId(null);
        fetchProducts();
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Seguro que quieres eliminar este producto?')) {
            await fetch(`http://localhost:3000/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            fetchProducts();
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        await fetch('http://localhost:3000/api/products', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
                ...newProduct,
                price: parseFloat(newProduct.price)
            })
        });
        setIsAdding(false);
        setNewProduct({ name: '', price: '', category: 'Pizzas', description: '', image: '' });
        fetchProducts();
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white p-6 font-sans pb-20">
            <div className="max-w-6xl mx-auto">
                <header className="flex items-center justify-between mb-8">
                     <div>
                        <Link to="/ventas" className="text-neutral-400 hover:text-white flex items-center gap-2 mb-2 transition-colors">
                            <ArrowLeft size={20} />
                            Volver al Panel
                        </Link>
                        <h1 className="text-3xl font-bold text-yellow-500 flex items-center gap-3">
                            <Utensils className="text-yellow-500" />
                            Gestión de Productos
                        </h1>
                    </div>
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-yellow-400"
                    >
                        {isAdding ? <X size={20} /> : <Plus size={20} />}
                        {isAdding ? 'Cancelar' : 'Nuevo Producto'}
                    </button>
                </header>

                {isAdding && (
                     <div className="bg-neutral-800 p-6 rounded-xl mb-6 border border-yellow-500/30">
                        <h3 className="text-xl font-bold mb-4">Agregar Nuevo Producto</h3>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                placeholder="Nombre" 
                                value={newProduct.name}
                                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                className="bg-neutral-900 border border-neutral-700 p-2 rounded text-white"
                                required
                            />
                            <input 
                                placeholder="Precio" 
                                type="number" 
                                step="0.01"
                                value={newProduct.price}
                                onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                                className="bg-neutral-900 border border-neutral-700 p-2 rounded text-white"
                                required
                            />
                            <select
                                value={newProduct.category}
                                onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                                className="bg-neutral-900 border border-neutral-700 p-2 rounded text-white"
                            >
                                <option>Pizzas</option>
                                <option>Bebidas</option>
                                <option>Postres</option>
                            </select>
                            <input 
                                placeholder="URL Imagen" 
                                value={newProduct.image}
                                onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                                className="bg-neutral-900 border border-neutral-700 p-2 rounded text-white"
                            />
                            <textarea
                                placeholder="Descripción"
                                value={newProduct.description}
                                onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                                className="bg-neutral-900 border border-neutral-700 p-2 rounded text-white md:col-span-2"
                                rows="3"
                            />
                            <button type="submit" className="bg-green-600 text-white py-2 rounded font-bold md:col-span-2">
                                Guardar Producto
                            </button>
                        </form>
                     </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => (
                        <div key={product.id} className="bg-neutral-800 rounded-xl overflow-hidden border border-white/10 group">
                            {editingId === product.id ? (
                                <div className="p-4 space-y-3">
                                    <input 
                                        value={editForm.name} 
                                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                                        className="w-full bg-neutral-900 p-2 rounded text-white"
                                    />
                                    <input 
                                        type="number"
                                        value={editForm.price} 
                                        onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value)})}
                                        className="w-full bg-neutral-900 p-2 rounded text-white"
                                    />
                                    <textarea 
                                        value={editForm.description} 
                                        onChange={e => setEditForm({...editForm, description: e.target.value})}
                                        className="w-full bg-neutral-900 p-2 rounded text-white"
                                        rows="3"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditingId(null)} className="p-2 text-neutral-400 hover:text-white"><X size={20}/></button>
                                        <button onClick={handleUpdate} className="p-2 text-green-500 hover:text-green-400"><Save size={20}/></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="h-48 overflow-hidden relative">
                                        <img src={product.image || 'https://via.placeholder.com/300'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            <button onClick={() => handleEditClick(product)} className="p-2 bg-black/50 text-white rounded-full hover:bg-yellow-500 hover:text-black transition-colors">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(product.id)} className="p-2 bg-black/50 text-white rounded-full hover:bg-red-500 hover:text-white transition-colors">
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg">{product.name}</h3>
                                            <span className="bg-yellow-500 text-black font-bold px-2 py-1 rounded text-sm">${product.price}</span>
                                        </div>
                                        <p className="text-neutral-400 text-sm mb-4 line-clamp-2">{product.description}</p>
                                        <span className="text-xs text-neutral-500 uppercase tracking-wider bg-neutral-900 px-2 py-1 rounded">{product.category}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Products;

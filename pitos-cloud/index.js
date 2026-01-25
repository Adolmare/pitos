const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const SYNC_SECRET = process.env.SYNC_SECRET || 'clave-secreta-del-puente';
const JWT_SECRET = process.env.JWT_SECRET || 'cloud-secret-key';
const MONGODB_URI = "mongodb+srv://adolmare123_db_user:ztMAZY93X4laphE1@cluster0.ivdtgnq.mongodb.net/?appName=Cluster0";

app.use(cors());
app.use(bodyParser.json());

// --- DATABASE CONNECTION ---
mongoose.connect(MONGODB_URI)
  .then(() => console.log('☁️  Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB Atlas connection error:', err));

// --- MODELS ---
const CloudProduct = require('./models/CloudProduct');
const CloudUser = require('./models/CloudUser');
const CloudStatus = require('./models/CloudStatus');
const CloudOrder = require('./models/CloudOrder');

// --- REMOVED IN-MEMORY ARRAYS ---
/* 
 let cloudMenu = [];
 let orderQueue = []; 
 let deliveryQueue = []; 
 let deliveredOrders = []; 
 let drivers = []; 
*/

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const authenticateBridge = (req, res, next) => {
    const token = req.headers['x-sync-secret'];
    if (token !== SYNC_SECRET) return res.sendStatus(403);
    next();
};

// --- RUTAS PÚBLICAS Y DE REPARTIDOR ---

// 1. Clientes ven el menú
app.get('/api/products', async (req, res) => {
    try {
        const products = await CloudProduct.find().sort({ id: 1 });
        res.json(products);
    } catch (e) { res.status(500).json({error: e.message}); }
});

// 2. Clientes envían pedido (WEB)
app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = await CloudOrder.create({
            id: `WEB-${Date.now()}`,
            source: 'WEB',
            ...req.body,
            status: 'pending-download',
            syncedBack: false
        });
        console.log(`[CLOUD] Nuevo pedido WEB recibido: ${newOrder.id}`);
        res.json({ success: true, message: "Pedido recibido en la nube", orderId: newOrder.id });
    } catch (e) { res.status(500).json({error: e.message}); }
});

// 3. Login de Repartidores (usan la misma password que en local)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await CloudUser.findOne({ username });
        
        // Validar hash
        if (user && bcrypt.compareSync(password, user.passwordHash)) {
            const token = jwt.sign({ id: user.id, username: user.username, role: 'repartidor' }, JWT_SECRET, { expiresIn: '12h' });
            res.json({ token, role: 'repartidor', id: user.id, username: user.username });
        } else {
            res.status(401).json({ error: 'Credenciales inválidas' });
        }
    } catch (e) { res.status(500).json({error: e.message}); }
});

// 4. Repartidor ve sus pedidos asignados
app.get('/api/repartidor/orders', authenticateToken, async (req, res) => {
    try {
        // Find assigned orders for this driver that are NOT completed
        const myOrders = await CloudOrder.find({ 
            assignedTo: req.user.id, 
            status: { $ne: 'completed' } 
        });
        res.json(myOrders);
    } catch (e) { res.status(500).json({error: e.message}); }
});
// Compatibilidad con frontend existente que llama a /api/orders
app.get('/api/orders', authenticateToken, async (req, res) => {
     if (req.user.role === 'repartidor') {
         // Same logic as above
         const myOrders = await CloudOrder.find({ 
            assignedTo: req.user.id, 
            status: { $ne: 'completed' } 
        });
        return res.json(myOrders);
    }
    res.json([]);
});

// 5. Repartidor marca pedido como entregado
app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        let order;
        // Search by numeric string ID or WEB ID.
        // Usually local sends numeric IDs in strings, or WEB- prefix
        order = await CloudOrder.findOne({ id: id }); 
        
        if (order && status === 'completed') {
            order.status = 'completed';
            order.deliveredAt = new Date();
            order.syncedBack = false; // Flag to sync back to local as 'delivered'
            await order.save();
            
            console.log(`[CLOUD] Pedido ${id} entregado por ${req.user.username}`);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Orden no encontrada o estado inválido" });
        }
    } catch (e) { res.status(500).json({error: e.message}); }
});


// --- RUTAS BRIDGE (Sincronización con Local) ---

// A. Local sube menú
app.post('/sync/menu', authenticateBridge, async (req, res) => {
    try {
        // Full replace strategy for simplicity
        await CloudProduct.deleteMany({});
        if (req.body.length > 0) {
            await CloudProduct.insertMany(req.body);
        }
        console.log(`[CLOUD] Menú actualizado: ${req.body.length} productos.`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e.message}); }
});

// B. Local sube estado
app.post('/sync/status', authenticateBridge, async (req, res) => {
    try {
        await CloudStatus.deleteMany({});
        await CloudStatus.create(req.body); // { isOpen: true/false }
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e.message}); }
});

// C. Local descarga pedidos WEB
app.get('/sync/orders', authenticateBridge, async (req, res) => {
    try {
        const ordersToSync = await CloudOrder.find({ 
            source: 'WEB', 
            status: 'pending-download' 
        });
        
        if (ordersToSync.length > 0) {
            // Update status so we don't sync again
            const ids = ordersToSync.map(o => o._id);
            await CloudOrder.updateMany(
                { _id: { $in: ids } }, 
                { $set: { status: 'downloaded' } }
            );
            res.json(ordersToSync);
        } else {
            res.json([]);
        }
    } catch (e) { res.status(500).json({error: e.message}); }
});

// D. Local sincroniza Repartidores (Cuentas)
app.post('/sync/drivers', authenticateBridge, async (req, res) => {
    try {
        const incomingDrivers = req.body;
        // Upsert logic
        for (const driver of incomingDrivers) {
            await CloudUser.findOneAndUpdate(
                { username: driver.username },
                driver,
                { upsert: true, new: true }
            );
        }
        console.log(`[CLOUD] Drivers sincronizados: ${incomingDrivers.length}`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e.message}); }
});

// E. Local ASIGNA un pedido a un repartidor (Push)
app.post('/sync/assignments', authenticateBridge, async (req, res) => {
    const assignment = req.body; 
    // assignment: { id, assignedTo, customer, items, total, ... }
    
    try {
        const existing = await CloudOrder.findOne({ id: assignment.id });
        if (existing) {
            // Update existing (e.g. was a web order, now got details/assignment)
            Object.assign(existing, assignment);
            existing.source = 'LOCAL'; // marked as managed by local now?
            await existing.save();
        } else {
            // New order from local (phone call, etc)
            await CloudOrder.create({
                ...assignment,
                source: 'LOCAL',
                syncedBack: true // Already known by local
            });
        }
        console.log(`[CLOUD] Asignación recibida. Pedido ${assignment.id} -> Driver ${assignment.assignedTo}`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e.message}); }
});

// F. Local pregunta por entregas completadas
app.get('/sync/delivered', authenticateBridge, async (req, res) => {
    try {
        // Find orders completed in cloud but not agreed by local yet (syncedBack=false)
        const delivered = await CloudOrder.find({ 
            status: 'completed',
            syncedBack: false
        });

        if (delivered.length > 0) {
            // Return them, and assume local will process them. 
            // Better: update syncedBack=true AFTER successful response? 
            // For simple polling, we'll mark them now OR local should Ack.
            // Let's mark them now to avoid loops.
            const ids = delivered.map(d => d._id);
            await CloudOrder.updateMany(
                { _id: { $in: ids } },
                { $set: { syncedBack: true } }
            );
            res.json(delivered);
        } else {
            res.json([]);
        }
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.get('/api/status', async (req, res) => {
    const status = await CloudStatus.findOne();
    res.json(status || { isOpen: true });
});

app.listen(PORT, () => {
    console.log(`☁️  SOFTWARE B (NUBE) corriendo en puerto ${PORT}`);
});

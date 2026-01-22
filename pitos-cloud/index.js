const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const SYNC_SECRET = process.env.SYNC_SECRET || 'clave-secreta-del-puente';

app.use(cors());
app.use(bodyParser.json());

// --- BASE DE DATOS EN MEMORIA (Volátil, ideal para demo) ---
// En producción real, usarías MongoDB o PostgreSQL aquí.
let cloudMenu = [];
let orderQueue = []; // Pedidos esperando ser bajados al local

// --- RUTAS PÚBLICAS (Para los clientes en internet) ---

// 1. Clientes ven el menú
app.get('/api/products', (req, res) => {
    res.json(cloudMenu);
});

// 2. Clientes envían pedido
app.post('/api/orders', (req, res) => {
    const newOrder = {
        id: `WEB-${Date.now()}`, // ID temporal
        source: 'WEB',
        ...req.body,
        status: 'pending-download',
        createdAt: new Date()
    };
    
    orderQueue.push(newOrder);
    console.log(`[CLOUD] Nuevo pedido recibido: ${newOrder.id}`);
    res.json({ success: true, message: "Pedido recibido en la nube", orderId: newOrder.id });
});

// 3. Estado del restaurante (si está abierto o cerrado en el local)
let restaurantStatus = { isOpen: true };
app.get('/api/status', (req, res) => res.json(restaurantStatus));


// --- RUTAS PRIVADAS (Para el Software A - Local) ---

const authenticateBridge = (req, res, next) => {
    const token = req.headers['x-sync-secret'];
    if (token !== SYNC_SECRET) return res.sendStatus(403);
    next();
};

// A. El Local sube el menú actualizado
app.post('/sync/menu', authenticateBridge, (req, res) => {
    cloudMenu = req.body;
    console.log(`[CLOUD] Menú actualizado por el local. ${cloudMenu.length} productos.`);
    res.json({ success: true });
});

// B. El Local sube su estado (Abierto/Cerrado)
app.post('/sync/status', authenticateBridge, (req, res) => {
    restaurantStatus = req.body;
    console.log(`[CLOUD] Estado actualizado: ${restaurantStatus.isOpen ? 'Abierto' : 'Cerrado'}`);
    res.json({ success: true });
});

// C. El Local descarga los pedidos pendientes
app.get('/sync/orders', authenticateBridge, (req, res) => {
    if (orderQueue.length > 0) {
        console.log(`[CLOUD] Entregando ${orderQueue.length} pedidos al local.`);
        const ordersToSync = [...orderQueue];
        orderQueue = []; // Vaciar cola tras entregar (Commit simple)
        res.json(ordersToSync);
    } else {
        res.json([]);
    }
});

app.listen(PORT, () => {
    console.log(`☁️  SOFTWARE B (NUBE) corriendo en puerto ${PORT}`);
});

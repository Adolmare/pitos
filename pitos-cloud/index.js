const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const SYNC_SECRET = process.env.SYNC_SECRET || 'clave-secreta-del-puente';
const JWT_SECRET = process.env.JWT_SECRET || 'cloud-secret-key';

app.use(cors());
app.use(bodyParser.json());

// --- BASE DE DATOS EN MEMORIA ---
let cloudMenu = [];
let orderQueue = []; // Pedidos WEB -> LOCAL
let deliveryQueue = []; // Pedidos LOCAL -> REPARTIDOR (para que los vea en su móvil)
let deliveredOrders = []; // Pedidos entregados REPARTIDOR -> LOCAL
let drivers = []; // Lista de repartidores sincronizada

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
app.get('/api/products', (req, res) => {
    res.json(cloudMenu);
});

// 2. Clientes envían pedido (WEB)
app.post('/api/orders', (req, res) => {
    const newOrder = {
        id: `WEB-${Date.now()}`,
        source: 'WEB',
        ...req.body,
        status: 'pending-download',
        createdAt: new Date()
    };
    orderQueue.push(newOrder);
    console.log(`[CLOUD] Nuevo pedido WEB recibido: ${newOrder.id}`);
    res.json({ success: true, message: "Pedido recibido en la nube", orderId: newOrder.id });
});

// 3. Login de Repartidores (usan la misma password que en local)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = drivers.find(u => u.username === username);
    
    // Validar hash
    if (user && bcrypt.compareSync(password, user.passwordHash)) {
        const token = jwt.sign({ id: user.id, username: user.username, role: 'repartidor' }, JWT_SECRET, { expiresIn: '12h' });
        res.json({ token, role: 'repartidor', id: user.id, username: user.username });
    } else {
        res.status(401).json({ error: 'Credenciales inválidas' });
    }
});

// 4. Repartidor ve sus pedidos asignados
app.get('/api/repartidor/orders', authenticateToken, (req, res) => {
    // Filtrar pedidos asignados a ESTE usuario
    const myOrders = deliveryQueue.filter(o => o.assignedTo === req.user.id && !o.deliveredAt);
    res.json(myOrders);
});
// Compatibilidad con frontend existente que llama a /api/orders
app.get('/api/orders', authenticateToken, (req, res) => {
     if (req.user.role === 'repartidor') {
        const myOrders = deliveryQueue.filter(o => o.assignedTo === req.user.id && !o.deliveredAt);
        return res.json(myOrders);
    }
    res.json([]);
});

// 5. Repartidor marca pedido como entregado
app.put('/api/orders/:id/status', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Buscar en deliveryQueue
    const orderIndex = deliveryQueue.findIndex(o => o.id == id); // == para string/number match
    
    if (orderIndex !== -1 && status === 'completed') {
        const order = deliveryQueue[orderIndex];
        order.status = 'completed';
        order.deliveredAt = new Date().toISOString();
        
        // Mover a cola de entregados para sincronizar con local
        deliveredOrders.push({ id: order.id, deliveredAt: order.deliveredAt });
        
        // Quitar de cola activa (opcional, o dejarlo como historial)
        // deliveryQueue.splice(orderIndex, 1); 
        
        console.log(`[CLOUD] Pedido ${id} entregado por ${req.user.username}`);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Orden no encontrada o estado inválido" });
    }
});


// --- RUTAS BRIDGE (Sincronización con Local) ---

// A. Local sube menú
app.post('/sync/menu', authenticateBridge, (req, res) => {
    cloudMenu = req.body;
    console.log(`[CLOUD] Menú actualizado: ${cloudMenu.length} productos.`);
    res.json({ success: true });
});

// B. Local sube estado
app.post('/sync/status', authenticateBridge, (req, res) => {
    restaurantStatus = req.body;
    // console.log(`[CLOUD] Estado actualizado.`);
    res.json({ success: true });
});

// C. Local descarga pedidos WEB
app.get('/sync/orders', authenticateBridge, (req, res) => {
    if (orderQueue.length > 0) {
        const ordersToSync = [...orderQueue];
        orderQueue = []; 
        res.json(ordersToSync);
    } else {
        res.json([]);
    }
});

// D. Local sincroniza Repartidores (Cuentas)
app.post('/sync/drivers', authenticateBridge, (req, res) => {
    // Recibe array de usuarios role=repartidor
    drivers = req.body;
    console.log(`[CLOUD] Drivers sincronizados: ${drivers.length}`);
    res.json({ success: true });
});

// E. Local ASIGNA un pedido a un repartidor (Push)
app.post('/sync/assignments', authenticateBridge, (req, res) => {
    const assignment = req.body; // { orderId, driverId, fullOrderData... }
    
    // Verificar si ya existe pa no duplicar
    const exists = deliveryQueue.find(o => o.id == assignment.id);
    if (exists) {
        Object.assign(exists, assignment); // Actualizar
    } else {
        deliveryQueue.push(assignment);
    }
    console.log(`[CLOUD] Asignación recibida. Pedido ${assignment.id} -> Driver ${assignment.assignedTo}`);
    res.json({ success: true });
});

// F. Local pregunta por entregas completadas
app.get('/sync/delivered', authenticateBridge, (req, res) => {
    if (deliveredOrders.length > 0) {
        const delivered = [...deliveredOrders];
        deliveredOrders = [];
        res.json(delivered);
    } else {
        res.json([]);
    }
});
app.get('/api/status', (req, res) => res.json(restaurantStatus)); // Public status

app.listen(PORT, () => {
    console.log(`☁️  SOFTWARE B (NUBE) corriendo en puerto ${PORT}`);
});

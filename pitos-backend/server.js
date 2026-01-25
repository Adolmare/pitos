const express = require('express');
const http = require('http');
require('dotenv').config(); // Load environment variables
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const morgan = require('morgan');
const winston = require('winston');
const mongoose = require('mongoose');
let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    console.error('Sharp failed to load. Image processing will be skipped. (Module not found or platform mismatch)');
}
const initialMenu = require('./initialData');

// --- 1. CONFIGURATION & LOGGING ---
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() }) 
  ],
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname)
});
const User = require('./models/User');
const Product = require('./models/Product');
const Table = require('./models/Table');
const Order = require('./models/Order');
const Sale = require('./models/Sale');
const Receipt = require('./models/Receipt');
const initializeDB = require('./dbInit');

const upload = multer({ storage: storage });

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurante')
  .then(async () => {
      logger.info('Connected to MongoDB');
      await initializeDB();
  })
  .catch(err => logger.error('MongoDB connection error:', err));

// --- 2. DATA STORE REPLACEMENT (Global State for sync only) ---
let restaurantStatus = { isOpen: true }; // Keep in memory or move to DB Config? Keep for simple state.

// NOTE: users, products, orders, receipts, tables are now Mongoose Models.
// any direct array access must be replaced by DB calls.


// --- 3. MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    
    // Allow token in query param for images/downloads
    if (!token && req.query.token) {
        token = req.query.token;
    }

    if (!token) return res.sendStatus(401);
if (!token && req.query.token) {
        token = req.query.token;
    }

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const authorizeRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.sendStatus(403);
    next();
};

app.use('/uploads', authenticateToken, express.static(uploadDir));

// --- VALIDATION SCHEMAS ---
const orderSchema = z.object({
    customer: z.object({
        name: z.string().min(1),
        address: z.string().min(1),
        phone: z.string().optional(),
        location: z.any().optional(),
        paymentMethod: z.string(),
        notes: z.string().optional()
    }),
    items: z.array(z.object({
        id: z.number(), 
        quantity: z.number().min(1)
    }))
});

// --- BRIDGE: SINCRONIZACIÓN CON LA NUBE (Software B) ---
const CLOUD_URL = process.env.CLOUD_URL || 'http://localhost:4000';
const SYNC_SECRET = process.env.SYNC_SECRET || 'clave-secreta-del-puente';

// 1. Función para subir el menú a la nube (Llamar cuando se edita el menú)
const syncMenuToCloud = async () => {
    try {
        const products = await Product.find();
        await fetch(`${CLOUD_URL}/sync/menu`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'x-sync-secret': SYNC_SECRET 
            },
            body: JSON.stringify(products)
        });
        console.log('✅ BRIDGE: Menú sincronizado con la Nube');
    } catch (error) {
        console.error('❌ BRIDGE ERROR (Menú):', error.message);
    }
};

// 2. Función para subir estado (Abierto/Cerrado)
const syncStatusToCloud = async () => {
    try {
        await fetch(`${CLOUD_URL}/sync/status`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'x-sync-secret': SYNC_SECRET 
            },
            body: JSON.stringify(restaurantStatus)
        });
    } catch (error) {
        console.error('❌ BRIDGE ERROR (Status):', error.message);
    }
};

// 4. Función para subir cuentas de repartidores a la nube
const syncDriversToCloud = async () => {
    try {
        const drivers = await User.find({ role: 'repartidor' });
        await fetch(`${CLOUD_URL}/sync/drivers`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'x-sync-secret': SYNC_SECRET 
            },
            body: JSON.stringify(drivers)
        });
        console.log('✅ BRIDGE: Repartidores sincronizados');
    } catch (error) {
        console.error('❌ BRIDGE ERROR (Drivers):', error.message);
    }
};
// Sincronizar al inicio
setTimeout(syncDriversToCloud, 5000); 

// 5. Función para subir asignacion
const syncAssignment = async (order) => {
    try {
        await fetch(`${CLOUD_URL}/sync/assignments`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'x-sync-secret': SYNC_SECRET 
            },
            body: JSON.stringify(order)
        });
    } catch (error) {
        console.error('❌ BRIDGE ERROR (Assignment):', error.message);
    }
};

// 3. Polling: Preguntar a la nube si hay pedidos nuevos O completados
setInterval(async () => {
    try {
        // A. Pedidos Nuevos WEB
        const resOrders = await fetch(`${CLOUD_URL}/sync/orders`, {
            headers: { 'x-sync-secret': SYNC_SECRET }
        });
        if (resOrders.ok) {
            const cloudOrders = await resOrders.json();
            if (cloudOrders.length > 0) {
                console.log(`✅ BRIDGE: Descargados ${cloudOrders.length} pedidos de la nube`);
                for (const co of cloudOrders) {
                    const customId = `NUBE-${co.id.split('-')[1] || Date.now()}`;
                    
                    // Check duplicate
                    const exists = await Order.findOne({ customId });
                    if (!exists) {
                         const localOrder = new Order({
                            customId: customId,
                            customer: co.customer,
                            items: co.items, // Ensure structure matches
                            total: co.total,
                            status: 'pending',
                            isWebOrder: true,
                            type: 'delivery' // Web orders are usually delivery
                        });
                        await localOrder.save();
                        io.emit('new-order', localOrder);
                    }
                }
                io.emit('sales-updated');
            }
        }

        // B. Pedidos Entregados por Repartidor en Nube
        const resDelivered = await fetch(`${CLOUD_URL}/sync/delivered`, { 
             headers: { 'x-sync-secret': SYNC_SECRET }
        });
        if (resDelivered.ok) {
            const deliveredList = await resDelivered.json();
            if (deliveredList.length > 0) {
                for (const d of deliveredList) {
                    // Try to match by customId or _id (if we synced _id)
                    // The cloud likely sends back the ID we sent it (customId or _id)
                    // Logic was: o.id == d.id OR NUBE-part == d.id
                    
                    const target = await Order.findOne({
                        $or: [
                            { customId: d.id },
                            { _id: mongoose.isValidObjectId(d.id) ? d.id : null }
                        ]
                    });

                    if (target && target.status !== 'completed') {
                        target.status = 'completed';
                        await target.save();
                        io.emit('order-updated', target);
                        console.log(`✅ BRIDGE: Pedido ${d.id} completado remotamente.`);
                    }
                }
            }
        }

    } catch (error) {
        // console.error(error); // Evitar spam
    }
}, 5000); // Polling cada 5s para mayor velocidad en repartos


// --- ROUTES ---

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        
        if (user && bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
            res.json({ token, role: user.role, id: user._id, username: user.username });
        } else {
            res.status(401).json({ error: 'Credenciales inválidas' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/products', async (req, res) => {
    const products = await Product.find().sort({ id: 1 });
    res.json(products);
});

app.get('/api/status', (req, res) => res.json(restaurantStatus));

app.post('/api/status', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const { isOpen } = req.body;
    if (typeof isOpen !== 'boolean') return res.status(400).json({ error: 'Status invalid' });
    restaurantStatus.isOpen = isOpen;
    io.emit('status-updated', restaurantStatus);
    syncStatusToCloud(); 
    res.json(restaurantStatus);
});

app.post('/api/products', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const lastProduct = await Product.findOne().sort({ id: -1 });
        const nextId = (lastProduct && lastProduct.id) ? lastProduct.id + 1 : 1;
        
        const newProduct = await Product.create({ ...req.body, id: nextId });
        syncMenuToCloud();
        res.json(newProduct);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/products/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { id } = req.params; // numeric ID
    try {
        const updated = await Product.findOneAndUpdate({ id: Number(id) }, req.body, { new: true });
        if (updated) {
            syncMenuToCloud();
            res.json(updated);
        } else {
            res.status(404).json({ error: "Producto no encontrado" });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/products/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        await Product.findOneAndDelete({ id: Number(req.params.id) });
        syncMenuToCloud();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Order Routes
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        let query = {};
        // If repartidor, show only assigned orders (exclude dine-in tables usually, or check status)
        if (req.user.role === 'repartidor') {
            query = { assignedTo: req.user.id };
        }
        
        // Maybe sort by date?
        const orderList = await Order.find(query).sort({ receivedAt: -1 }).limit(100);
        res.json(orderList);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/repartidores', authenticateToken, async (req, res) => {
    try {
        const repartidores = await User.find({ role: 'repartidor' }).select('id username');
        res.json(repartidores);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/orders/:id/assign', authenticateToken, authorizeRole(['admin', 'cocina']), async (req, res) => {
    const { id } = req.params; // string ID or customId
    const { assignedTo } = req.body; 
    
    try {
        // Try to match _id or customId
        const order = await Order.findOne({ 
             $or: [
                 { customId: id },
                 { _id: mongoose.isValidObjectId(id) ? id : null }
             ]
        });

        if (order) {
            order.assignedTo = assignedTo; // Expecting ObjectId string
            await order.save();
            io.emit('order-updated', order);
            syncAssignment(order);
            res.json(order);
        } else {
            res.status(404).json({ error: "Order not found" });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const validatedData = orderSchema.parse(req.body);
        let calculatedTotal = 0;
        const enrichedItems = [];

        // Validate products async
        for (const item of validatedData.items) {
             const product = await Product.findOne({ id: item.id }); // Using numeric ID from menu
             if (!product) throw new Error(`Producto ID ${item.id} no existe`);
             
             calculatedTotal += product.price * item.quantity;
             enrichedItems.push({
                 product: product._id, // Link to DB object
                 id: product.id,       // Keep numeric ID
                 quantity: item.quantity,
                 name: product.name,
                 price: product.price
             });
        }

        const newOrder = await Order.create({
            customId: Date.now().toString(),
            customer: validatedData.customer,
            items: enrichedItems,
            total: calculatedTotal,
            status: 'pending',
            receivedAt: new Date(),
            type: 'delivery' // Default for API orders
        });
        
        io.emit('new-order', newOrder);
        io.emit('sales-updated');
        logger.info(`New order created: ${newOrder.customId || newOrder._id} - Total: ${calculatedTotal}`);
        
        res.status(201).json(newOrder);

    } catch (err) {
        logger.error(`Order creation failed: ${err.message}`);
        res.status(400).json({ error: err.message || "Datos inválidos" });
    }
});

app.put('/api/orders/:id/status', authenticateToken, authorizeRole(['admin', 'cocina', 'repartidor']), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
        const order = await Order.findOne({ 
             $or: [
                 { customId: id },
                 { _id: mongoose.isValidObjectId(id) ? id : null }
             ]
        });

        if (order) {
            if (req.user.role === 'repartidor' && String(order.assignedTo) !== req.user.id) {
                return res.status(403).json({ error: "No autorizado" });
            }
            
            order.status = status;
            await order.save();
            io.emit('order-updated', order);
            res.json(order);
        } else {
            res.status(404).json({ error: "Order not found" });
        }
    } catch (e) {
         res.status(500).json({ error: e.message });
    }
});

// --- TABLES ROUTES ---

app.get('/api/tables', authenticateToken, async (req, res) => {
    try {
        const tables = await Table.find().sort({ id: 1 });
        res.json(tables);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/tables/:id/occupy', authenticateToken, async (req, res) => {
    const tableId = parseInt(req.params.id);
    try {
        const table = await Table.findOne({ id: tableId });
        
        if (table) {
            if (table.status !== 'free') return res.status(400).json({ error: "Mesa ocupada" });
            
            table.status = 'occupied';
            table.items = [];
            table.total = 0;
            table.startTime = new Date();
            await table.save();
            
            const allTables = await Table.find().sort({ id: 1 });
            io.emit('tables-updated', allTables);
            res.json(table);
        } else {
            res.status(404).json({ error: "Mesa no encontrada" });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/tables/:id/add-item', authenticateToken, async (req, res) => {
    const tableId = parseInt(req.params.id);
    const { productId, quantity } = req.body;
    
    try {
        const table = await Table.findOne({ id: tableId });
        if (!table || table.status !== 'occupied') return res.status(400).json({ error: "Mesa no disponible" });

        const product = await Product.findOne({ id: productId });
        if (!product) return res.status(404).json({ error: "Producto no encontrado" });

        table.items.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity || 1
        });

        table.total += product.price * (quantity || 1);
        await table.save();
        
        const allTables = await Table.find().sort({ id: 1 });
        io.emit('tables-updated', allTables);
        res.json(table);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/tables/:id/close', authenticateToken, async (req, res) => {
    const tableId = parseInt(req.params.id);
    try {
        const table = await Table.findOne({ id: tableId });
        
        if (!table || table.status !== 'occupied') return res.status(400).json({ error: "Mesa no disponible para cerrar" });

        // Create Order from Table
        const newOrder = new Order({
            customId: `TBL-${Date.now()}`,
            customer: {
                name: `Cliente Presencial - ${table.name}`,
                address: 'En Restaurante',
                paymentMethod: 'Efectivo/Tarjeta',
                notes: `Mesa cerrada a las ${new Date().toLocaleTimeString()}`
            },
            // Map table items to order items schema if needed, but structure is similar
            items: table.items.map(i => ({
                id: i.id,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                // We miss product ObjectId reference here if we only stored numeric ID in table
                // Ideally look it up again, but for now we rely on numeric ID or allow missing ref
            })), 
            total: table.total,
            status: 'completed', 
            receivedAt: new Date(),
            table: table._id,
            type: 'dine-in'
        });

        await newOrder.save();
        
        table.status = 'free';
        table.items = [];
        table.total = 0;
        table.startTime = null;
        await table.save();

        const allTables = await Table.find().sort({ id: 1 });
        io.emit('tables-updated', allTables);
        io.emit('sales-updated'); 
        io.emit('new-order', newOrder); 
        
        res.json({ success: true, order: newOrder });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/sales', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        // Fetch all completed orders
        const orders = await Order.find({ status: { $in: ['completed', 'delivered'] } });
        const receipts = await Receipt.find();
        const users = await User.find(); // for driver names

        const productStats = {};
        const driverStats = {}; 
        let ordersTotal = 0;

        orders.forEach(order => {
            ordersTotal += (order.total || 0);

             // Product Stats
            if (order.items) {
                order.items.forEach(item => {
                    const key = item.name;
                    if (!productStats[key]) productStats[key] = { name: key, quantity: 0, revenue: 0 };
                    productStats[key].quantity += item.quantity;
                    productStats[key].revenue += (item.price * item.quantity);
                });
            }
            
            // Driver Stats
            if (order.assignedTo) {
                const driverUser = users.find(u => String(u._id) === String(order.assignedTo));
                const driverName = driverUser ? driverUser.username : 'Unknown';
                
                if (!driverStats[driverName]) driverStats[driverName] = { name: driverName, count: 0, revenue: 0 };
                
                if (order.status === 'delivered' || order.status === 'completed') {
                    driverStats[driverName].count += 1;
                    driverStats[driverName].revenue += order.total;
                }
            }
        });

        const receiptsTotal = receipts.reduce((sum, r) => sum + r.amount, 0);
        const globalTotal = ordersTotal + receiptsTotal;
        const topProducts = Object.values(productStats).sort((a, b) => b.quantity - a.quantity);
        const topDrivers = Object.values(driverStats).sort((a, b) => b.count - a.count);

        res.json({ ordersTotal, receiptsTotal, globalTotal, topProducts, topDrivers, orders, receipts });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/scan-receipt', authenticateToken, authorizeRole(['repartidor', 'admin']), upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    try {
        logger.info(`Scanning receipt: ${req.file.path}`);

        const processedPath = `${req.file.path}-processed.png`;
        try {
            if (sharp) {
                await sharp(req.file.path)
                    .grayscale()
                    .normalize()
                    .sharpen()
                    .toFile(processedPath);
            } else {
                 throw new Error("Sharp not available");
            }
        } catch (sharpError) {
             // logger.error(`Sharp processing failed (using original): ${sharpError.message}`);
             fs.copyFileSync(req.file.path, processedPath);
        }

        const worker = await createWorker('eng');
        const { data: { text } } = await worker.recognize(processedPath);
        await worker.terminate();
        
        if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
        
        const foundAmount = extraerMonto(text) || 0;
        const foundName = extraerNombre(text) || "Desconocido";

        const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
        
        res.json({
            success: true,
            detectedAmount: foundAmount,
            detectedName: foundName,
            textSnippet: text.substring(0, 100),
            imageUrl: imageUrl,
            tempFilePath: req.file.path 
        });

    } catch (err) {
        logger.error(`OCR Failed: ${err.message}`);
        res.status(500).json({ error: 'Failed to scan receipt' });
    }
});

// Confirm Receipt
app.post('/api/confirm-receipt', authenticateToken, authorizeRole(['repartidor', 'admin']), async (req, res) => {
    const { amount, imageUrl, text } = req.body;
    
    if (!amount || isNaN(amount)) return res.status(400).json({ error: "Monto inválido" });

    try {
        const receipt = await Receipt.create({
            amount: Number(amount),
            text: text || "Manual Entry",
            imageUrl: imageUrl,
            uploadedBy: req.user.username
        });
        
        io.emit('sales-updated');
        logger.info(`Receipt confirmed by ${req.user.username}: $${amount}`);
        
        res.json({ success: true, receipt });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Variable para simular el acumulado (en producción iría a la DB)
// let totalTransacciones = 0; // Removed unused variable

// Función auxiliar para extraer Nombre
function extraerNombre(text) {
     const normalized = text.replace(/\r\n/g, '\n');
     
     // Estrategia 1: Buscar "De" seguido de un salto de linea (Formato Nequi común)
     // De
     // Nombre Completo
     const multiLineMatch = normalized.match(/De\s*\n\s*([^\n\r]+)/i);
     if (multiLineMatch && multiLineMatch[1]) {
        const candidate = multiLineMatch[1].trim();
        // Evitar que capture "Para" o "¿Cuánto?" si están pegados
        if (candidate && !candidate.match(/para|cu[aá]nto|fecha|ref/i)) {
            return candidate;
        }
     }

     // Estrategia 2: Buscar "De" en la misma linea
     const singleLineMatch = normalized.match(/De\s*[:\.]?\s*([A-Za-zñÑ\s]+)(?:\n|$|¿|\?|Para)/i);
     if (singleLineMatch && singleLineMatch[1]) {
         const candidate = singleLineMatch[1].trim();
         if (candidate.length > 2) return candidate;
     }

     return null;
}

// Función auxiliar para limpiar el texto y sacar el número
function extraerMonto(text) {
  // Estrategia 1: Prioridad absoluta al signo peso ($)
  // Nequi formato: "$ 7.000,00"
  const moneyRegex = /\$\s?([0-9]{1,3}(?:\.[0-9]{3})*)\b/;
  const exactMatch = text.match(moneyRegex);
  
  if (exactMatch) {
      const cleanValue = exactMatch[1].replace(/\./g, '');
      return parseInt(cleanValue, 10);
  }

  // Estrategia 2: Fallback general, pero ignorando referencias grandes
  // Eliminamos puntos de miles y buscamos el valor numérico
  const matches = text.replace(/\./g, '').match(/\d+/g);
  if (matches) {
    // Filtramos números:
    // 1. > 100 (para evitar "1" item)
    // 2. < 10000000 (10 millones) para evitar referencias como M20014305 (20 millones interpretados)
    const montosPosibles = matches.map(Number).filter(n => n > 500 && n < 5000000);
    if (montosPosibles.length > 0) {
         return Math.max(...montosPosibles); 
    }
  }
  return null;
}

server.listen(PORT, () => {
  logger.info(`Backend Server running on port ${PORT}`);
});

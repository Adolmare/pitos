const express = require('express');
const http = require('http');
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

const JWT_SECRET = 'super-secret-key-change-in-production';
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- 2. DATA STORE ---
const users = [
    { id: 1, username: 'admin', passwordHash: bcrypt.hashSync('adminMaster', 8), role: 'admin' },
    { id: 2, username: 'cocina', passwordHash: bcrypt.hashSync('cocinaChef', 8), role: 'cocina' },
    { id: 3, username: 'reparto', passwordHash: bcrypt.hashSync('repartoExpress', 8), role: 'repartidor' },
    { id: 4, username: 'juan', passwordHash: bcrypt.hashSync('juan123', 8), role: 'repartidor' },
    { id: 5, username: 'pedro', passwordHash: bcrypt.hashSync('pedro123', 8), role: 'repartidor' },
    { id: 6, username: 'maria', passwordHash: bcrypt.hashSync('maria123', 8), role: 'repartidor' }
];

let products = [...initialMenu];
let restaurantStatus = { isOpen: true };

let orders = [];
let receipts = [];

let tables = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    name: `Mesa ${i + 1}`,
    status: 'free',
    items: [],
    total: 0,
    startTime: null
}));

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

// --- ROUTES ---

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    
    if (user && bcrypt.compareSync(password, user.passwordHash)) {
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
        res.json({ token, role: user.role, id: user.id, username: user.username });
    } else {
        res.status(401).json({ error: 'Credenciales inválidas' });
    }
});

app.get('/api/products', (req, res) => res.json(products));

app.get('/api/status', (req, res) => res.json(restaurantStatus));

app.post('/api/status', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const { isOpen } = req.body;
    if (typeof isOpen !== 'boolean') return res.status(400).json({ error: 'Status invalid' });
    restaurantStatus.isOpen = isOpen;
    io.emit('status-updated', restaurantStatus);
    res.json(restaurantStatus);
});

app.post('/api/products', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const newProduct = { id: Date.now(), ...req.body }; 
    const index = products.findIndex(p => p.id == id);
    if (index !== -1) {
        products[index] = { ...products[index], ...req.body, id: Number(id) };
        res.json(products[index]);
    } else {
        res.status(404).json({ error: "Producto no encontrado" });
    }
});

app.delete('/api/products/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
    products = products.filter(p => p.id != req.params.id);
    res.json({ success: true });
});

// Order Routes
app.get('/api/orders', authenticateToken, (req, res) => {
    // Cocina sees all, Admin sees all, Repartidor only sees assigned ones
    if (req.user.role === 'repartidor') {
        // Filter assigned orders AND exclude Table orders (dine-in)
        const myOrders = orders.filter(o => o.assignedTo === req.user.id && !o.tableId);
        return res.json(myOrders);
    }
    res.json(orders);
});

app.get('/api/repartidores', authenticateToken, (req, res) => {
    const repartidores = users
    if (req.user.role === 'repartidor') {
        const myOrders = orders.filter(o => o.assignedTo === req.user.id);
        return res.json(myOrders);
    }
    res.json(orders);
});

app.get('/api/repartidores', authenticateToken, (req, res) => {
    const repartidores = users
        .filter(u => u.role === 'repartidor')
        .map(u => ({ id: u.id, username: u.username }));
    res.json(repartidores);
});

app.put('/api/orders/:id/assign', authenticateToken, authorizeRole(['admin', 'cocina']), (req, res) => {
    const { id } = req.params;
    const { assignedTo } = req.body; 
    
    const order = orders.find(o => o.id === id);
    if (order) {
        order.assignedTo = parseInt(assignedTo);
        io.emit('order-updated', order);
        res.json(order);
    } else {
        res.status(404).json({ error: "Order not found" });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const validatedData = orderSchema.parse(req.body);

        let calculatedTotal = 0;
        const enrichedItems = validatedData.items.map(item => {
            const product = products.find(p => p.id === item.id);
            if (!product) throw new Error(`Producto ID ${item.id} no existe`);
            
            calculatedTotal += product.price * item.quantity;
            return {
                ...item,
                name: product.name, 
                price: product.price 
            };
        });

        const newOrder = {
            id: Date.now().toString(),
            customer: validatedData.customer,
            items: enrichedItems,
            total: calculatedTotal,
            status: 'pending',
            receivedAt: new Date().toISOString()
        };
        
        orders.unshift(newOrder);
        io.emit('new-order', newOrder);
        io.emit('sales-updated');
        logger.info(`New order created: ${newOrder.id} - Total: ${calculatedTotal}`);
        
        res.status(201).json(newOrder);

    } catch (err) {
        logger.error(`Order creation failed: ${err.message}`);
        res.status(400).json({ error: err.message || "Datos inválidos" });
    }
});

app.put('/api/orders/:id/status', authenticateToken, authorizeRole(['admin', 'cocina', 'repartidor']), (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = orders.find(o => o.id === id);
    if (order) {
        if (req.user.role === 'repartidor' && order.assignedTo !== req.user.id) {
            return res.status(403).json({ error: "No autorizado" });
        }
        
        order.status = status;
        io.emit('order-updated', order);
        res.json(order);
    } else {
        res.status(404).json({ error: "Order not found" });
    }
});

// --- TABLES ROUTES ---

app.get('/api/tables', authenticateToken, (req, res) => {
    res.json(tables);
});

app.post('/api/tables/:id/occupy', authenticateToken, (req, res) => {
    const tableId = parseInt(req.params.id);
    const table = tables.find(t => t.id === tableId);
    
    if (table) {
        if (table.status !== 'free') return res.status(400).json({ error: "Mesa ocupada" });
        
        table.status = 'occupied';
        table.items = [];
        table.total = 0;
        table.startTime = new Date().toISOString();
        
        io.emit('tables-updated', tables);
        res.json(table);
    } else {
        res.status(404).json({ error: "Mesa no encontrada" });
    }
});

app.post('/api/tables/:id/add-item', authenticateToken, (req, res) => {
    const tableId = parseInt(req.params.id);
    const { productId, quantity } = req.body;
    const table = tables.find(t => t.id === tableId);
    
    if (!table || table.status !== 'occupied') return res.status(400).json({ error: "Mesa no disponible" });

    const product = products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });

    table.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity || 1
    });

    table.total += product.price * (quantity || 1);
    io.emit('tables-updated', tables);
    res.json(table);
});

app.post('/api/tables/:id/close', authenticateToken, (req, res) => {
    const tableId = parseInt(req.params.id);
    const table = tables.find(t => t.id === tableId);
    
    if (!table || table.status !== 'occupied') return res.status(400).json({ error: "Mesa no disponible para cerrar" });

    // Create Order from Table
    const newOrder = {
        id: `TBL-${Date.now()}`,
        customer: {
            name: `Cliente Presencial - ${table.name}`,
            address: 'En Restaurante',
            paymentMethod: 'Efectivo/Tarjeta',
            notes: `Mesa cerrada a las ${new Date().toLocaleTimeString()}`
        },
        items: table.items,
        total: table.total,
        status: 'completed', 
        receivedAt: new Date().toISOString(),
        tableId: table.id
    };

    orders.push(newOrder); 
    
    table.status = 'free';
    table.items = [];
    table.total = 0;
    table.startTime = null;

    io.emit('tables-updated', tables);
    io.emit('sales-updated'); 
    io.emit('new-order', newOrder); 
    
    res.json({ success: true, order: newOrder });
});

app.get('/api/sales', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const productStats = {};
    const driverStats = {}; // { driverName: { count: 0, revenue: 0 } }
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
            const driverUser = users.find(u => u.id === order.assignedTo);
            const driverName = driverUser ? driverUser.username : 'Unknown';
            
            if (!driverStats[driverName]) driverStats[driverName] = { name: driverName, count: 0, revenue: 0 };
            
            // Count delivered orders? Or all assigned? 
            // Usually performance is based on delivered.
            if (order.status === 'delivered') {
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
});

app.post('/api/scan-receipt', authenticateToken, authorizeRole(['repartidor', 'admin']), upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    try {
        logger.info(`Scanning receipt: ${req.file.path}`);

        // Pre-process image with Sharp for better OCR
        const processedPath = `${req.file.path}-processed.png`;
        try {
            await sharp(req.file.path)
                .grayscale()
                .normalize()
                .sharpen()
                .toFile(processedPath);
        } catch (sharpError) {
             logger.error(`Sharp processing failed (using original): ${sharpError.message}`);
             fs.copyFileSync(req.file.path, processedPath);
        }

        const worker = await createWorker('eng');
        const { data: { text } } = await worker.recognize(processedPath);
        await worker.terminate();
        
        // Clean up processed file
        if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
        
        // OCR Logic
        const foundAmount = extraerMonto(text) || 0;
        const foundName = extraerNombre(text) || "Desconocido";

        const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
        
        // Return data for confirmation (Do not save to sales yet)
        res.json({
            success: true,
            detectedAmount: foundAmount,
            detectedName: foundName,
            textSnippet: text.substring(0, 100),
            imageUrl: imageUrl,
            tempFilePath: req.file.path // Ideally use a temp ID/token, but path checks out for now
        });

    } catch (err) {
        logger.error(`OCR Failed: ${err.message}`);
        res.status(500).json({ error: 'Failed to scan receipt' });
    }
});

// Confirm Receipt (Problem F - Step 2: Save)
app.post('/api/confirm-receipt', authenticateToken, authorizeRole(['repartidor', 'admin']), (req, res) => {
    const { amount, imageUrl, text } = req.body;
    
    if (!amount || isNaN(amount)) return res.status(400).json({ error: "Monto inválido" });

    const receipt = {
        id: Date.now().toString(),
        amount: Number(amount),
        text: text || "Manual Entry",
        imageUrl: imageUrl,
        timestamp: new Date().toISOString(),
        uploadedBy: req.user.username
    };
    
    receipts.push(receipt);
    io.emit('sales-updated');
    logger.info(`Receipt confirmed by ${req.user.username}: $${amount}`);
    
    res.json({ success: true, receipt });
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

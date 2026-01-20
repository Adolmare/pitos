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

// --- 1. CONFIGURATION & LOGGING (Problem D) ---
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

// Protect uploads folder - Only authenticated users can access
// app.use('/uploads', authenticateToken, express.static(uploadDir)); moved below middleware definitions

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- 2. DATA STORE (In-Memory for now, replacing DB) ---
// Users (Problem B)
const users = [
    { id: 1, username: 'admin', passwordHash: bcrypt.hashSync('admin123', 8), role: 'admin' },
    { id: 2, username: 'cocina', passwordHash: bcrypt.hashSync('cocina123', 8), role: 'cocina' },
    { id: 3, username: 'reparto', passwordHash: bcrypt.hashSync('reparto123', 8), role: 'repartidor' }
];

// Product Catalog (Problem E)
let products = [...initialMenu];

let orders = [];
let receipts = []; // Receipt logs

// --- 3. MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    
    // Allow token in query param for images/downloads
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

// Protect uploads folder - Only authenticated users can access
app.use('/uploads', authenticateToken, express.static(uploadDir));

// --- VALIDATION SCHEMAS (Problem C) ---
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
        id: z.number(), // Product ID
        quantity: z.number().min(1)
    }))
});

// --- ROUTES ---

// Auth Routes (Problem B)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    
    if (user && bcrypt.compareSync(password, user.passwordHash)) {
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
        res.json({ token, role: user.role });
    } else {
        res.status(401).json({ error: 'Credenciales inválidas' });
    }
});

// Product Routes (Problem E)
app.get('/api/products', (req, res) => res.json(products));

app.post('/api/products', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const newProduct = { id: Date.now(), ...req.body }; // Simple ID generation
    products.push(newProduct);
    res.json(newProduct);
});

app.put('/api/products/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
    const { id } = req.params;
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
    // Cocina sees all, Admin sees all, Repartidor might only see ready ones? Let's keep it open for auth users.
    res.json(orders);
});

app.post('/api/orders', async (req, res) => {
    try {
        // Validate input (Problem C)
        const validatedData = orderSchema.parse(req.body);

        // Recalculate Total (Problem C - TRUST NO ONE)
        let calculatedTotal = 0;
        const enrichedItems = validatedData.items.map(item => {
            const product = products.find(p => p.id === item.id);
            if (!product) throw new Error(`Producto ID ${item.id} no existe`);
            
            calculatedTotal += product.price * item.quantity;
            return {
                ...item,
                name: product.name, // Ensure accurate name from DB
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

app.put('/api/orders/:id/status', authenticateToken, authorizeRole(['admin', 'cocina']), (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = orders.find(o => o.id === id);
    if (order) {
        order.status = status;
        io.emit('order-updated', order);
        res.json(order);
    } else {
        res.status(404).json({ error: "Order not found" });
    }
});

// Sales & Receipt Routes
app.get('/api/sales', authenticateToken, authorizeRole(['admin']), (req, res) => {
    // Logic remains similar but behind auth
    const productStats = {};
    let ordersTotal = 0;

    orders.forEach(order => {
        ordersTotal += (order.total || 0);
        if (order.items) {
            order.items.forEach(item => {
                const key = item.name;
                if (!productStats[key]) productStats[key] = { name: key, quantity: 0, revenue: 0 };
                productStats[key].quantity += item.quantity;
                productStats[key].revenue += (item.price * item.quantity);
            });
        }
    });

    const receiptsTotal = receipts.reduce((sum, r) => sum + r.amount, 0);
    const globalTotal = ordersTotal + receiptsTotal;
    const topProducts = Object.values(productStats).sort((a, b) => b.quantity - a.quantity);

    res.json({ ordersTotal, receiptsTotal, globalTotal, topProducts, orders, receipts });
});

// Upload Receipt for Analysis (Problem F - Step 1: Scan)
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

        const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
        
        // Return data for confirmation (Do not save to sales yet)
        res.json({
            success: true,
            detectedAmount: foundAmount,
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
let totalTransacciones = 0;

// Función auxiliar para limpiar el texto y sacar el número
function extraerMonto(text) {
  // Eliminamos puntos de miles y buscamos el valor numérico
  // Ej: de "$ 45.000" queremos 45000
  const matches = text.replace(/\./g, '').match(/\d+/g);
  if (matches) {
    // Filtramos números que parezcan montos (ej: más de 3 dígitos)
    const montosPosibles = matches.map(Number).filter(n => n > 100);
    return Math.max(...montosPosibles); // Retornamos el mayor encontrado
  }
  return null;
}

app.post('/api/repartidor/validar-pago', upload.single('screenshot'), async (req, res) => {
  try {
    // 1. Pre-procesar imagen con Sharp (Grayscale, High Contrast)
    const processedPath = `${req.file.path}-processed.png`;
    
    if (sharp) {
        try {
            await sharp(req.file.path)
                .resize(1000) // Redimensionar si es muy grande/pequeña para estandarizar
                .grayscale()
                .normalize()
                .sharpen()
                .toFile(processedPath);
        } catch (sharpErr) {
            logger.error(`Sharp processing error: ${sharpErr.message}`);
            // Fallback to original if sharp fails
            if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
            fs.copyFileSync(req.file.path, processedPath);
        }
    } else {
        // Fallback if sharp module is missing
        fs.copyFileSync(req.file.path, processedPath);
    }

    const worker = await createWorker('spa'); // Usamos español
    
    // 2. Extraer texto de la imagen procesada
    const { data: { text } } = await worker.recognize(processedPath);
    await worker.terminate();

    // Limpiar archivo procesado
    if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);

    // 3. Lógica para extraer el monto
    // Buscamos patrones comunes como "$ 50.000" o "Monto: 50000"
    // Esta regex busca números después de un símbolo de peso o palabras clave
    const montoEncontrado = extraerMonto(text);

    if (montoEncontrado) {
      totalTransacciones += montoEncontrado;
      
      // Aquí actualizarías el estado del pedido a "Pagado" en tu BD
      res.json({ 
        success: true, 
        monto: montoEncontrado, 
        totalAcumulado: totalTransacciones,
        textoExtraido: text // Útil para depurar
      });
    } else {
      res.status(400).json({ success: false, message: "No se pudo detectar el monto en la imagen" });
    }
  } catch (error) {
    logger.error(`Error validando pago: ${error.message}`); // Added logging
    res.status(500).json({ error: error.message });
  }
});

server.listen(PORT, () => {
  logger.info(`Backend Server running on port ${PORT}`);
});

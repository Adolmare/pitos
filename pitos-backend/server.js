const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT"]
  }
});

app.use(cors());
app.use(bodyParser.json());

// In-memory persistence (replace with DB in production)
let orders = [];

// Get all orders
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// Create new order
app.post('/api/orders', (req, res) => {
  const newOrder = {
    id: Date.now().toString(),
    ...req.body,
    status: 'pending', // pending, preparing, ready, delivered
    receivedAt: new Date().toISOString()
  };
  
  orders.unshift(newOrder);
  
  // Real-time notification
  io.emit('new-order', newOrder);
  console.log(`Order received from ${newOrder.customer.name}`);
  
  res.status(201).json(newOrder);
});

// Update status
app.put('/api/orders/:id/status', (req, res) => {
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

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Table = require('./models/Table');
const Product = require('./models/Product');
const initialMenu = require('./initialData');

const initializeDB = async () => {
  // 1. Initialize Users
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const defaultUsers = [
      { username: 'admin', password: process.env.PASSWORD_ADMIN || 'adminMaster', role: 'admin' },
      { username: 'cocina', password: process.env.PASSWORD_COCINA || 'cocinaChef', role: 'cocina' },
      { username: 'reparto', password: process.env.PASSWORD_REPARTO || 'repartoExpress', role: 'repartidor' },
      { username: 'juan', password: process.env.PASSWORD_JUAN || 'juan123', role: 'repartidor' },
      { username: 'pedro', password: process.env.PASSWORD_PEDRO || 'pedro123', role: 'repartidor' },
      { username: 'maria', password: process.env.PASSWORD_MARIA || 'maria123', role: 'repartidor' }
    ];

    for (const u of defaultUsers) {
      const hashedPassword = bcrypt.hashSync(u.password, 8);
      await User.create({ ...u, password: hashedPassword });
    }
    console.log('✅ Base de datos inicializada: Usuarios creados');
  }

  // 2. Initialize Tables
  const tableCount = await Table.countDocuments();
  if (tableCount === 0) {
    const tables = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      name: `Mesa ${i + 1}`,
      status: 'free',
      items: [],
      total: 0
    }));
    await Table.insertMany(tables);
    console.log('✅ Base de datos inicializada: Mesas creadas');
  }

  // 3. Initialize Products (Menu)
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    await Product.insertMany(initialMenu);
    console.log('✅ Base de datos inicializada: Menú cargado');
  }
};

module.exports = initializeDB;

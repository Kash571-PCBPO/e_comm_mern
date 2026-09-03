const express = require('express');
const cors = require('cors');
const errorMiddleware = require('./middleware/error.middleware');
const testRoutes = require('./modules/test/test.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Simple liveness check (does NOT touch the DB)
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is up' });
});

// DB connection / CRUD test module
app.use('/api/test', testRoutes);

// Feature modules (auth, products, cart, orders) mount here once implemented:
// app.use('/api/auth', authRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/cart', cartRoutes);
// app.use('/api/orders', orderRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Central error handler (must stay last)
app.use(errorMiddleware);

module.exports = app;

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./authRoutes');
const presentationRoutes = require('./Presentation');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/presentations', presentationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
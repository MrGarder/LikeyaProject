const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Увеличиваем лимит для загрузки сайтов/фоток
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Раздача статических файлов (HTML, CSS, JS вашего фронтенда) из корневой папки
app.use(express.static(__dirname));

// Подключение к MongoDB
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
    .then(() => console.log('🟢 Успешное подключение к MongoDB'))
    .catch(err => console.error('🔴 Ошибка подключения к MongoDB:', err));

// Главный корневой маршрут — отдает ваш index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Схема пользователя
const UserSchema = new mongoose.Schema({
    fullName: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'Пользователь' },
    stats: {
        total: { type: Number, default: 0 },
        correct: { type: Number, default: 0 },
        wrong: { type: Number, default: 0 }
    }
});
const User = mongoose.model('User', UserSchema);

// Схема материалов / презентаций (с поддержкой автора)
const PresentationSchema = new mongoose.Schema({
    title: String,
    category: String,
    catName: String,
    type: String, // FOLDER, IMAGES, PDF, LINK
    slides: Number,
    img: String, // Обложка
    description: String,
    processedFolderHtml: String, // Здесь хранится обработанный HTML сайта-папки
    slidesArray: [String],        // Массив картинок для слайдов
    pdfData: String,               // Base64 для PDF
    externalUrl: String,
    author: String,               // Имя создателя материала
    authorEmail: String,          // Email создателя материала
    downloads: { type: Number, default: 0 },
    date: { type: String, default: () => new Date().toLocaleDateString('ru-RU') }
});
const Presentation = mongoose.model('Presentation', PresentationSchema);

// --- РОУТЫ АВТОРИЗАЦИИ ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Пользователь уже существует' });

        const user = new User({ fullName, email, password, role });
        await user.save();
        res.json({ token: 'mock-jwt-token-' + user._id, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) return res.status(400).json({ message: 'Неверный e-mail или пароль' });
        res.json({ token: 'mock-jwt-token-' + user._id, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- РОУТЫ ДЛЯ МАТЕРИАЛОВ ---
app.get('/api/presentations', async (req, res) => {
    try {
        const items = await Presentation.find().sort({ _id: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/presentations', async (req, res) => {
    try {
        const newPres = new Presentation(req.body);
        await newPres.save();
        res.json(newPres);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


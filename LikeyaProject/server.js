const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Настройка Multer для временного хранения файла в памяти перед отправкой в облако
const upload = multer({ storage: multer.memoryStorage() });

// Настройка Cloudinary (ключи автоматически берутся из переменных окружения на Render)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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

// Схема материалов / презентаций
const PresentationSchema = new mongoose.Schema({
    title: String,
    category: String,
    catName: String,
    type: String, // FOLDER, IMAGES, PDF, LINK
    slides: Number,
    img: String, // Обложка (теперь это постоянная ссылка из Cloudinary)
    description: String,
    processedFolderHtml: String, // Обработанный HTML сайта-папки
    slidesArray: [String],        // Массив картинок для слайдов
    pdfData: String,               // Base64 для PDF
    externalUrl: String,
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

// Сохранение материала с поддержкой загрузки файлов через Cloudinary
app.post('/api/presentations', upload.single('file'), async (req, res) => {
    try {
        let imageUrl = req.body.img;

        // Если передан файл изображения обложки, загружаем его в Cloudinary
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            
            const uploadResponse = await cloudinary.uploader.upload(dataURI, {
                folder: 'likeyaproject'
            });
            imageUrl = uploadResponse.secure_url; // Получаем публичную ссылку на картинку в облаке
        }

        const newPres = new Presentation({
            ...req.body,
            img: imageUrl
        });

        await newPres.save();
        res.json(newPres);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));

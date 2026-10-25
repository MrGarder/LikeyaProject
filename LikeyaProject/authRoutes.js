const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'users.json');

// Вспомогательная функция чтения пользователей
const getUsers = () => {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return data ? JSON.parse(data) : [];
};

// Вспомогательная функция записи пользователей
const saveUsers = (users) => {
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
};

// 1. РЕГИСТРАЦИЯ
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;
        const users = getUsers();

        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            id: Date.now().toString(),
            fullName,
            email,
            password: hashedPassword,
            role: role || 'user',
            favorites: []
        };

        users.push(newUser);
        saveUsers(users);

        const token = jwt.sign({ userId: newUser.id, role: newUser.role }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email, role: newUser.role, favorites: newUser.favorites }
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера при регистрации', error: error.message });
    }
});

// 2. ВХОД В АККАУНТ
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = getUsers();

        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(400).json({ message: 'Неверный email или пароль' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Неверный email или пароль' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '7d' });

        res.json({
            token,
            user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, favorites: user.favorites }
        });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка сервера при входе', error: error.message });
    }
});

module.exports = router;
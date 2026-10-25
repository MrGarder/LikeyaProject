import { register, login, fetchPresentations, createPresentation, toggleFavoriteApi } from './api.js';

const CATEGORIES = [
    { id: 'const', name: 'Конституционное право', icon: 'fa-landmark', img: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=400' },
    { id: 'civil', name: 'Гражданское право', icon: 'fa-scale-balanced', img: 'https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?q=80&w=400' },
    { id: 'criminal', name: 'Уголовное право', icon: 'fa-gavel', img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400' },
    { id: 'arbitration', name: 'Арбитражный процесс', icon: 'fa-scroll', img: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=400' },
    { id: 'international', name: 'Международное право', icon: 'fa-globe', img: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?q=80&w=400' },
    { id: 'labor', name: 'Трудовое право', icon: 'fa-briefcase', img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=400' }
];

let presentations = [];
let userFavorites = [];
let currentUser = null;
let authMode = 'login';

window.onload = async function() {
    initUser();
    renderCategories();
    await loadPresentations();
    setupAudio();
};

function initUser() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        userFavorites = currentUser.favorites || [];
        document.getElementById('fav-count').innerText = userFavorites.length;
    }
    renderUserUI();
}

async function loadPresentations() {
    try {
        presentations = await fetchPresentations();
        renderPresentations(presentations);
        renderPopularWidget();
    } catch (err) {
        console.error("Ошибка загрузки данных из MongoDB:", err);
    }
}

function renderUserUI() {
    const sidebar = document.getElementById('sidebarUserProfile');
    const header = document.getElementById('headerAuthWidget');

    if (currentUser) {
        sidebar.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-9 h-9 rounded-full bg-gold/20 border border-gold flex items-center justify-center text-gold font-bold text-xs">
                    ${(currentUser.fullName || 'Ю').charAt(0).toUpperCase()}
                </div>
                <div class="min-w-0 flex-1">
                    <div class="text-xs font-semibold text-white truncate">${currentUser.fullName}</div>
                    <div class="text-[10px] text-gold truncate">${currentUser.role || 'user'}</div>
                </div>
                <button onclick="handleLogout()" class="text-gray-500 hover:text-red-400 text-xs" title="Выйти">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>
        `;
        header.innerHTML = `
            <div class="flex items-center space-x-2 text-xs">
                <span class="text-gray-300 hidden sm:inline">${currentUser.fullName}</span>
                <button onclick="handleLogout()" class="bg-vintage-card border border-vintage-border text-gray-400 hover:text-gold px-3 py-1.5 rounded-full text-xs">Выйти</button>
            </div>
        `;
    } else {
        sidebar.innerHTML = `
            <button onclick="openAuthModal('login')" class="w-full bg-gold/10 border border-gold/40 text-gold py-2 rounded-lg text-xs font-semibold hover:bg-gold/20 transition">
                Вход / Регистрация
            </button>
        `;
        header.innerHTML = `
            <button onclick="openAuthModal('login')" class="bg-gold text-vintage-bg font-semibold px-4 py-1.5 rounded-full text-xs hover:bg-gold-light transition">
                Войти
            </button>
        `;
    }
}

function renderCategories() {
    const container = document.getElementById('categoriesGrid');
    container.innerHTML = CATEGORIES.map(cat => `
        <div onclick="filterByCategory('${cat.id}')" class="group relative h-28 rounded-lg overflow-hidden border border-vintage-border/80 cursor-pointer shadow-md hover:border-gold/60 transition duration-300">
            <img src="${cat.img}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-40">
            <div class="absolute inset-0 bg-gradient-to-t from-vintage-paperDark via-vintage-paper/90 to-transparent p-3 flex flex-col justify-between">
                <i class="fa-solid ${cat.icon} text-lg text-vintage-paperText"></i>
                <span class="font-serif font-bold text-xs text-vintage-paperText leading-tight">${cat.name}</span>
            </div>
        </div>
    `).join('');
}

function renderPresentations(items = presentations) {
    const container = document.getElementById('presentationsGrid');
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500">
                <i class="fa-solid fa-box-open text-3xl mb-2 text-gold/40"></i>
                <p class="text-sm">Презентации не найдены</p>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(item => {
        const itemId = item._id || item.id;
        const isFav = userFavorites.includes(itemId);
        return `
        <div class="bg-vintage-card border border-vintage-border rounded-xl overflow-hidden hover:border-gold/50 transition duration-300 flex flex-col justify-between group shadow-lg">
            <div>
                <div class="relative h-40 overflow-hidden cursor-pointer" onclick="openModal('${itemId}')">
                    <img src="${item.img || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600'}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-vintage-card via-transparent to-black/30"></div>
                    <div class="absolute top-3 left-3 flex items-center space-x-2">
                        <span class="bg-black/70 text-gold border border-gold/30 text-[10px] font-semibold px-2 py-0.5 rounded font-mono">${item.fileType || item.type || 'PDF'}</span>
                        <span class="bg-black/70 text-gray-300 text-[10px] px-2 py-0.5 rounded">${item.slidesCount || item.slides || 30} слайдов</span>
                    </div>
                    <button onclick="event.stopPropagation(); toggleFavorite('${itemId}')" class="absolute top-3 right-3 text-sm ${isFav ? 'text-gold' : 'text-gray-400 hover:text-gold'} transition">
                        <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-star"></i>
                    </button>
                </div>
                <div class="p-4 space-y-2">
                    <span class="text-[10px] uppercase font-semibold tracking-wider text-gold/80">${item.category}</span>
                    <h3 onclick="openModal('${itemId}')" class="font-serif text-sm font-bold text-gray-100 hover:text-gold transition cursor-pointer line-clamp-2">${item.title}</h3>
                </div>
            </div>
            <div class="px-4 py-3 border-t border-vintage-border/50 flex items-center justify-between text-[11px] text-gray-400">
                <span>${new Date(item.createdAt || Date.now()).toLocaleDateString('ru-RU')}</span>
                <div class="flex items-center space-x-3">
                    <button onclick="openModal('${itemId}')" class="hover:text-gold transition"><i class="fa-regular fa-eye"></i></button>
                    <button onclick="downloadPresentation('${itemId}')" class="hover:text-gold transition"><i class="fa-solid fa-download"></i></button>
                </div>
            </div>
        </div>
    `}).join('');
}

function renderPopularWidget() {
    const container = document.getElementById('popularWidget');
    if (!container) return;
    const sorted = [...presentations].slice(0, 5);
    container.innerHTML = sorted.map((item, index) => `
        <div onclick="openModal('${item._id || item.id}')" class="flex items-center space-x-3 p-2 rounded-lg hover:bg-vintage-border/50 cursor-pointer transition group">
            <span class="font-serif text-lg font-bold text-gold/60 group-hover:text-gold w-4 text-center">${index + 1}</span>
            <img src="${item.img || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=200'}" class="w-12 h-10 object-cover rounded border border-vintage-border shrink-0">
            <div class="min-w-0 flex-1">
                <h4 class="text-xs font-medium text-gray-200 group-hover:text-gold truncate transition">${item.title}</h4>
                <div class="text-[10px] text-gray-400 mt-0.5 flex items-center space-x-2">
                    <span class="bg-gold/10 text-gold px-1 rounded">${item.fileType || 'PDF'}</span>
                    <span>•</span>
                    <span>${item.slidesCount || 30} слайдов</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ГЛОБАЛЬНЫЕ ФУНКЦИИ КЛИКОВ В HTML
window.switchTab = function(tab) {
    if (tab === 'favorites') {
        const favItems = presentations.filter(p => userFavorites.includes(p._id || p.id));
        renderPresentations(favItems);
    } else {
        renderPresentations(presentations);
    }
};

window.filterByCategory = function(catId) {
    const filtered = presentations.filter(p => p.category === catId);
    renderPresentations(filtered);
};

window.handleSearch = function() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = presentations.filter(p => p.title.toLowerCase().includes(query));
    renderPresentations(filtered);
};

window.toggleFavorite = async function(id) {
    if (!currentUser) {
        openAuthModal('login');
        return;
    }
    if (userFavorites.includes(id)) {
        userFavorites = userFavorites.filter(f => f !== id);
    } else {
        userFavorites.push(id);
    }
    currentUser.favorites = userFavorites;
    localStorage.setItem('user', JSON.stringify(currentUser));
    document.getElementById('fav-count').innerText = userFavorites.length;
    renderPresentations();
    await toggleFavoriteApi(id);
};

window.openModal = function(id) {
    const item = presentations.find(p => (p._id || p.id) === id);
    if (!item) return;

    const isFav = userFavorites.includes(id);
    document.getElementById('modalContent').innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center space-x-2 text-xs text-gold uppercase font-semibold">
                <span>${item.category}</span> • <span>${item.fileType || 'PDF'}</span>
            </div>
            <h2 class="font-serif text-2xl font-bold text-white">${item.title}</h2>
            <div class="flex items-center space-x-4 text-xs text-gray-400 pb-2 border-b border-vintage-border">
                <span>Объем: <strong class="text-gray-200">${item.slidesCount || 30} слайдов</strong></span>
                <span>Скачиваний: <strong class="text-gray-200">${item.downloadsCount || 0}</strong></span>
            </div>
            <img src="${item.img || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600'}" class="w-full h-48 object-cover rounded-lg border border-vintage-border">
            <p class="text-sm text-gray-300 font-serif leading-relaxed">${item.description || 'Описание юридического материала...'}</p>
            <div class="pt-4 flex items-center justify-between border-t border-vintage-border">
                <button onclick="toggleFavorite('${id}'); openModal('${id}')" class="flex items-center space-x-2 text-xs px-4 py-2.5 rounded-lg border border-vintage-border hover:border-gold/50 transition">
                    <i class="${isFav ? 'fa-solid text-gold' : 'fa-regular'} fa-star"></i>
                    <span>${isFav ? 'В избранном' : 'В избранное'}</span>
                </button>
                <button onclick="downloadPresentation('${id}')" class="bg-gold text-vintage-bg font-semibold px-6 py-2.5 rounded-lg text-xs hover:bg-gold-light transition flex items-center space-x-2">
                    <i class="fa-solid fa-download"></i>
                    <span>Скачать ${item.fileType || 'PDF'}</span>
                </button>
            </div>
        </div>
    `;
    document.getElementById('presentationModal').classList.remove('hidden');
};

window.closeModal = function() {
    document.getElementById('presentationModal').classList.add('hidden');
};

window.openAuthModal = function(mode = 'login') {
    authMode = mode;
    switchAuthTab(mode);
    document.getElementById('authModal').classList.remove('hidden');
};

window.closeAuthModal = function() {
    document.getElementById('authModal').classList.add('hidden');
};

window.switchAuthTab = function(mode) {
    authMode = mode;
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const nameGroup = document.getElementById('nameFieldGroup');
    const roleGroup = document.getElementById('roleFieldGroup');
    const title = document.getElementById('authTitle');
    const btn = document.getElementById('authSubmitBtn');

    if (mode === 'login') {
        tabLogin.className = 'flex-1 py-1.5 text-center rounded text-gold bg-vintage-card border border-gold/30';
        tabRegister.className = 'flex-1 py-1.5 text-center rounded text-gray-400';
        nameGroup.classList.add('hidden');
        roleGroup.classList.add('hidden');
        title.innerText = 'Вход в LikeyaProject';
        btn.innerText = 'Войти в систему';
    } else {
        tabRegister.className = 'flex-1 py-1.5 text-center rounded text-gold bg-vintage-card border border-gold/30';
        tabLogin.className = 'flex-1 py-1.5 text-center rounded text-gray-400';
        nameGroup.classList.remove('hidden');
        roleGroup.classList.remove('hidden');
        title.innerText = 'Регистрация аккаунта';
        btn.innerText = 'Зарегистрироваться';
    }
};

window.handleAuthSubmit = async function(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;

    if (authMode === 'register') {
        const fullName = document.getElementById('authName').value || 'Новый Юрист';
        const role = document.getElementById('authRole').value || 'user';
        const res = await register(fullName, email, password, role);
        if (res.token) {
            currentUser = res.user;
            closeAuthModal();
            renderUserUI();
        } else {
            showInfoModal('Ошибка', res.message || 'Ошибка регистрации');
        }
    } else {
        const res = await login(email, password);
        if (res.token) {
            currentUser = res.user;
            userFavorites = currentUser.favorites || [];
            document.getElementById('fav-count').innerText = userFavorites.length;
            closeAuthModal();
            renderUserUI();
            renderPresentations();
        } else {
            showInfoModal('Ошибка', res.message || 'Ошибка входа');
        }
    }
};

window.handleLogout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    userFavorites = [];
    document.getElementById('fav-count').innerText = '0';
    renderUserUI();
    renderPresentations();
};

window.openUploadModal = function() {
    if (!currentUser) {
        openAuthModal('login');
        return;
    }
    document.getElementById('uploadModal').classList.remove('hidden');
};

window.closeUploadModal = function() {
    document.getElementById('uploadModal').classList.add('hidden');
};

window.handleCreatePresentation = async function(e) {
    e.preventDefault();
    const newPresData = {
        title: document.getElementById('presTitle').value,
        category: document.getElementById('presCategory').value,
        fileType: document.getElementById('presType').value,
        slidesCount: parseInt(document.getElementById('presSlides').value),
        fileUrl: document.getElementById('presImg').value || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600',
        description: document.getElementById('presDesc').value
    };

    const created = await createPresentation(newPresData);
    if (created._id || created.id) {
        closeUploadModal();
        showInfoModal('Успешно', 'Презентация опубликована в MongoDB!');
        await loadPresentations();
    }
};

window.downloadPresentation = function(id) {
    showInfoModal('Скачивание начато', 'Файл готовится и скоро начнется его скачивание.');
};

window.toggleCodeViewerModal = function() {
    document.getElementById('codeViewerModal').classList.toggle('hidden');
};

window.showInfoModal = function(title, body) {
    document.getElementById('infoModalTitle').innerText = title;
    document.getElementById('infoModalBody').innerText = body;
    document.getElementById('infoModal').classList.remove('hidden');
};

window.closeInfoModal = function() {
    document.getElementById('infoModal').classList.add('hidden');
};

// Аудиоплеер
const audio = document.getElementById('bgAudio');
let isPlaying = false;

function setupAudio() {
    if (!audio) return;
    audio.volume = 0.7;
    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            const pct = (audio.currentTime / audio.duration) * 100;
            document.getElementById('audioProgress').style.width = pct + '%';
            const curMins = Math.floor(audio.currentTime / 60);
            const curSecs = Math.floor(audio.currentTime % 60);
            document.getElementById('currentTime').innerText = `${curMins}:${curSecs < 10 ? '0' : ''}${curSecs}`;
        }
    });
}

window.toggleAudio = function() {
    if (isPlaying) {
        audio.pause();
        document.getElementById('playIcon').className = 'fa-solid fa-play ml-0.5';
    } else {
        audio.play().catch(e => console.log('Audio error:', e));
        document.getElementById('playIcon').className = 'fa-solid fa-pause';
    }
    isPlaying = !isPlaying;
};

window.seekAudio = function(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPos = (e.clientX - rect.left) / rect.width;
    if (audio.duration) {
        audio.currentTime = clickPos * audio.duration;
    }
};

window.setVolume = function(val) {
    if (audio) audio.volume = val;
};
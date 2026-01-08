// Функции для управления авторизацией

// Проверка авторизации пользователя
function checkAuth() {
    const isLoggedIn = localStorage.getItem('foodconstruct_user_logged_in') === 'true';
    const username = localStorage.getItem('foodconstruct_username');
    
    return {
        isLoggedIn: isLoggedIn,
        username: username
    };
}

// Выход из системы
function logout() {
    localStorage.removeItem('foodconstruct_user_logged_in');
    localStorage.removeItem('foodconstruct_username');
    localStorage.removeItem('foodconstruct_remember');
    
    // Перенаправляем на страницу входа
    window.location.href = 'login.html';
}

// Обновление отображения статуса авторизации в навигации
function updateAuthStatusInNav() {
    const authStatus = checkAuth();
    const navContainer = document.querySelector('.navbar-nav');
    
    if (!navContainer) return;
    
    // Ищем существующий пункт "Вход"
    const loginItem = navContainer.querySelector('a[href="login.html"]');
    
    if (authStatus.isLoggedIn && authStatus.username) {
        // Если пользователь авторизован, меняем текст
        if (loginItem) {
            loginItem.innerHTML = `<i class="bi bi-person-circle me-1"></i> ${authStatus.username}`;
            loginItem.classList.add('text-success');
            
            // Добавляем выпадающее меню для выхода
            const parentLi = loginItem.parentElement;
            parentLi.classList.add('dropdown');
            
            loginItem.setAttribute('data-bs-toggle', 'dropdown');
            loginItem.classList.add('dropdown-toggle');
            
            // Создаем выпадающее меню
            const dropdownMenu = document.createElement('ul');
            dropdownMenu.className = 'dropdown-menu dropdown-menu-end';
            dropdownMenu.innerHTML = `
                <li><a class="dropdown-item" href="#" id="logout-btn"><i class="bi bi-box-arrow-right me-2"></i> Выйти</a></li>
            `;
            
            parentLi.appendChild(dropdownMenu);
            
            // Добавляем обработчик для выхода
            setTimeout(() => {
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        logout();
                    });
                }
            }, 100);
        }
    } else {
        // Если не авторизован, показываем стандартную ссылку
        if (loginItem) {
            loginItem.innerHTML = 'Вход';
            loginItem.classList.remove('text-success', 'dropdown-toggle');
            loginItem.removeAttribute('data-bs-toggle');
            
            const parentLi = loginItem.parentElement;
            parentLi.classList.remove('dropdown');
            
            // Удаляем выпадающее меню, если есть
            const dropdownMenu = parentLi.querySelector('.dropdown-menu');
            if (dropdownMenu) {
                dropdownMenu.remove();
            }
        }
    }
}

// Проверка доступа к защищенным страницам
function requireAuth() {
    const authStatus = checkAuth();
    const protectedPages = ['orders.html', 'make-order.html']; // Страницы, требующие авторизации
    
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !authStatus.isLoggedIn) {
        // Если пользователь не авторизован и пытается получить доступ к защищенной странице
        if (typeof showNotification === 'function') {
            showNotification('Для доступа к этой странице необходимо войти в систему', 'warning');
        }
        
        // Перенаправляем на страницу входа
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        
        return false;
    }
    
    return true;
}

// Инициализация авторизации при загрузке страницы
function initAuth() {
    // Обновляем статус в навигации
    updateAuthStatusInNav();
    
    // Проверяем доступ к защищенным страницам
    requireAuth();
    
    // Добавляем глобальную функцию выхода
    window.logout = logout;
    window.checkAuth = checkAuth;
}

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkAuth,
        logout,
        updateAuthStatusInNav,
        requireAuth,
        initAuth
    };
}
// Конфигурация API (ЛР7, ЛР8, ЛР9)
const API_CONFIG = {
  // API для загрузки блюд (ЛР7)
  DISHES_API: {
    POLYTECH: "http://lab7-api.std-900.ist.mospolytech.ru/api/dishes",
    EXTERNAL: "https://edu.std-900.ist.mospolytech.ru/labs/api/dishes",
  },

  // API для заказов (ЛР8, ЛР9)
  ORDERS_API: {
    POLYTECH: "http://lab8-api.std-900.ist.mospolytech.ru",
    EXTERNAL: "https://edu.std-900.ist.mospolytech.ru",
  },

  // Используем внешний API по умолчанию (для GitHub Pages)
  USE_EXTERNAL_API: true,

  // API ключ (получить из СДО)
  API_KEY: "c9883157-ec32-4024-ae5c-28a43b232362",

  // Текущий студент (для отладки)
  STUDENT_ID: 1,

  // Категории блюд (используем те, что приходят с API)
  CATEGORIES: {
    SOUP: "soup",
    MAIN_COURSE: "main-course", // Исправлено на "main-course"
    SALAD: "salad",
    DRINK: "drink",
    DESSERT: "dessert",
  },

  // Типы фильтров для каждой категории (ЛР5)
  FILTER_TYPES: {
    soup: ["fish", "meat", "veg"],
    "main-course": ["fish", "meat", "veg"], // Исправлено на "main-course"
    salad: ["fish", "meat", "veg", "small"],
    drink: ["cold", "hot"],
    dessert: ["small", "medium", "large"],
  },

  // Доступные комбо (ЛР6) - используем API категории
  AVAILABLE_COMBOS: [
    ["soup", "main-course", "salad", "drink"],
    ["soup", "main-course", "drink"],
    ["soup", "salad", "drink"],
    ["main-course", "salad", "drink"],
    ["main-course", "drink"],
  ],
};

// Функция для нормализации ключа категории (для использования в объектах)
function normalizeCategoryKey(category) {
  if (category === "main-course") {
    return "mainCourse"; // Для использования в качестве ключа объекта
  }
  return category;
}

// Получаем API ключ из localStorage или запрашиваем
function getApiKey() {
  const savedKey = localStorage.getItem("foodconstruct_api_key");
  if (savedKey) {
    API_CONFIG.API_KEY = savedKey;
  } else {
    return API_CONFIG.API_KEY;
  }
  return API_CONFIG.API_KEY;
}

// Получаем URL для API блюд
function getDishesApiUrl() {
  return API_CONFIG.USE_EXTERNAL_API
    ? API_CONFIG.DISHES_API.EXTERNAL
    : API_CONFIG.DISHES_API.POLYTECH;
}

// Получаем URL для API заказов
function getOrdersApiUrl() {
  const baseUrl = API_CONFIG.USE_EXTERNAL_API
    ? API_CONFIG.ORDERS_API.EXTERNAL
    : API_CONFIG.ORDERS_API.POLYTECH;
  return `${baseUrl}/labs/api`;
}

// Добавляем API ключ к URL
function addApiKey(url) {
  const key = getApiKey();
  if (key) {
    return `${url}?api_key=${key}`;
  }
  return url;
}

// Экспортируем конфигурацию
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    API_CONFIG,
    getApiKey,
    getDishesApiUrl,
    getOrdersApiUrl,
    addApiKey,
    normalizeCategoryKey,
  };
}

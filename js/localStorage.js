// Работа с localStorage для сохранения состояния заказа

// Ключи для localStorage
const STORAGE_KEYS = {
  CURRENT_ORDER: "foodconstruct_current_order",
  DISHES_CACHE: "foodconstruct_dishes",
  DISHES_TIMESTAMP: "foodconstruct_dishes_timestamp",
  API_KEY: "foodconstruct_api_key",
  USER_ORDERS: "foodconstruct_user_orders",
  USER_DATA: "foodconstruct_user_data",
};

// Время жизни кэша (24 часа)
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Сохранение данных в localStorage
function saveToStorage(key, data) {
  try {
    console.log(`Сохраняем в localStorage ключ "${key}":`, data);
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Ошибка при сохранении в localStorage:", error);

    // Если localStorage переполнен, очищаем старые данные
    if (error.name === "QuotaExceededError") {
      clearOldStorageData();
      try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (e) {
        console.error("Не удалось сохранить данные после очистки:", e);
        return false;
      }
    }

    return false;
  }
}

// Загрузка данных из localStorage
function loadFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    console.log(
      `Загружаем из localStorage ключ "${key}":`,
      data ? "данные найдены" : "данных нет"
    );
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Ошибка при загрузке из localStorage:", error);
    return null;
  }
}

// Очистка старых данных из localStorage
function clearOldStorageData() {
  const keysToKeep = [
    STORAGE_KEYS.API_KEY,
    STORAGE_KEYS.USER_DATA,
    STORAGE_KEYS.CURRENT_ORDER,
  ];

  // Удаляем все, кроме важных ключей
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  }
}

// Сохранение заказа в историю
function saveOrderToHistory(order) {
  try {
    const orders = loadFromStorage(STORAGE_KEYS.USER_ORDERS) || [];

    // Добавляем дату создания
    order.created_at = new Date().toISOString();
    order.id = orders.length + 1;

    // Сохраняем заказ
    orders.unshift(order); // Добавляем в начало
    saveToStorage(STORAGE_KEYS.USER_ORDERS, orders);

    return order.id;
  } catch (error) {
    console.error("Ошибка при сохранении заказа в историю:", error);
    return null;
  }
}

// Получение истории заказов
function getOrderHistory() {
  return loadFromStorage(STORAGE_KEYS.USER_ORDERS) || [];
}

// Очистка истории заказов
function clearOrderHistory() {
  localStorage.removeItem(STORAGE_KEYS.USER_ORDERS);
  return true;
}

// Сохранение данных пользователя
function saveUserData(userData) {
  return saveToStorage(STORAGE_KEYS.USER_DATA, userData);
}

// Получение данных пользователя
function getUserData() {
  return loadFromStorage(STORAGE_KEYS.USER_DATA) || {};
}

// Очистка всех данных (кроме API ключа)
function clearAllData() {
  const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);

  localStorage.clear();

  // Восстанавливаем API ключ
  if (apiKey) {
    localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
  }

  return true;
}

// Проверка поддержки localStorage
function isLocalStorageSupported() {
  try {
    const testKey = "__test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

// Альтернативное хранилище для браузеров без localStorage
function getFallbackStorage() {
  const fallback = {};

  return {
    setItem: function (key, value) {
      fallback[key] = value;
      // Также сохраняем в sessionStorage, если доступно
      try {
        sessionStorage.setItem(key, value);
      } catch (e) {
        // Игнорируем ошибки
      }
    },

    getItem: function (key) {
      if (key in fallback) {
        return fallback[key];
      }

      // Пробуем получить из sessionStorage
      try {
        return sessionStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },

    removeItem: function (key) {
      delete fallback[key];

      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        // Игнорируем ошибки
      }
    },

    clear: function () {
      for (const key in fallback) {
        delete fallback[key];
      }

      try {
        sessionStorage.clear();
      } catch (e) {
        // Игнорируем ошибки
      }
    },
  };
}

// Получение заказа по ID из истории
function getOrderFromHistory(orderId) {
  const orders = getOrderHistory();
  return orders.find((order) => order.id == orderId) || null;
}

// Обновление заказа в истории
function updateOrderInLocalHistory(orderId, updateData) {
  const orders = getOrderHistory();
  const index = orders.findIndex((order) => order.id == orderId);

  if (index !== -1) {
    // Обновляем данные заказа
    orders[index] = {
      ...orders[index],
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    // Сохраняем обновленную историю
    saveToStorage(STORAGE_KEYS.USER_ORDERS, orders);
    return true;
  }

  return false;
}

// Удаление заказа из истории
function deleteOrderFromLocalHistory(orderId) {
  const orders = getOrderHistory();
  const filteredOrders = orders.filter((order) => order.id != orderId);
  saveToStorage(STORAGE_KEYS.USER_ORDERS, filteredOrders);
  return true;
}

// Получение последнего заказа
function getLastOrder() {
  const orders = getOrderHistory();
  return orders.length > 0 ? orders[0] : null;
}

// Проверка существования заказа
function orderExists(orderId) {
  const orders = getOrderHistory();
  return orders.some((order) => order.id == orderId);
}

// Очистка заказа после успешного оформления
function clearOrderAfterSuccess() {
  // Очищаем текущий заказ
  clearOrder();

  // Очищаем кэш блюд, если он старый
  const cacheTimestamp = localStorage.getItem(STORAGE_KEYS.DISHES_TIMESTAMP);
  if (cacheTimestamp && Date.now() - parseInt(cacheTimestamp) > CACHE_TTL) {
    localStorage.removeItem(STORAGE_KEYS.DISHES_CACHE);
    localStorage.removeItem(STORAGE_KEYS.DISHES_TIMESTAMP);
  }

  return true;
}

// Обновление заказа в локальной истории
function updateOrderInLocalHistory(orderId, updateData) {
  const orders = getOrderHistory();
  const index = orders.findIndex((order) => order.id == orderId);

  if (index !== -1) {
    // Обновляем данные заказа
    orders[index] = {
      ...orders[index],
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    // Сохраняем обновленную историю
    saveToStorage(STORAGE_KEYS.USER_ORDERS, orders);
    return true;
  }

  return false;
}

// Удаление заказа из локальной истории
function deleteOrderFromLocalHistory(orderId) {
  const orders = getOrderHistory();
  const filteredOrders = orders.filter((order) => order.id != orderId);
  saveToStorage(STORAGE_KEYS.USER_ORDERS, filteredOrders);
  return true;
}

// Экспорт функций
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    saveToStorage,
    loadFromStorage,
    saveOrderToHistory,
    getOrderHistory,
    clearAllData,
    isLocalStorageSupported,
    getOrderFromHistory,
    updateOrderInLocalHistory,
    deleteOrderFromLocalHistory,
    getLastOrder,
    orderExists,
    clearOrderAfterSuccess,
  };
}

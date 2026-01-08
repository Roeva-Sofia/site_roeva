// Основная функция очистки заказа
function clearOrderData(options = {}) {
  const defaults = {
    keepHistory: true, // Сохранить историю заказов
    keepDishesCache: true, // Сохранить кэш блюд
    keepUserData: true, // Сохранить данные пользователя
    keepApiKey: true, // Сохранить API ключ
    showNotification: true, // Показать уведомление
  };

  const settings = { ...defaults, ...options };

  console.log("Очистка данных заказа с настройками:", settings);

  // Ключи, которые нужно сохранить
  const keysToKeep = [];

  if (settings.keepHistory) {
    keysToKeep.push("foodconstruct_user_orders");
  }

  if (settings.keepDishesCache) {
    keysToKeep.push("foodconstruct_dishes");
    keysToKeep.push("foodconstruct_dishes_timestamp");
  }

  if (settings.keepUserData) {
    keysToKeep.push("foodconstruct_user_data");
  }

  if (settings.keepApiKey) {
    keysToKeep.push("foodconstruct_api_key");
  }

  // Получаем все ключи localStorage
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    allKeys.push(localStorage.key(i));
  }

  // Удаляем ключи, которые не в списке для сохранения
  const keysToRemove = allKeys.filter(
    (key) => key.startsWith("foodconstruct_") && !keysToKeep.includes(key)
  );

  console.log("Ключи для удаления:", keysToRemove);

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
    console.log(`Удален ключ: ${key}`);
  });

  // Сбрасываем глобальный объект заказа
  if (window.currentOrder) {
    window.currentOrder = {
      soup: null,
      mainCourse: null,
      salad: null,
      drink: null,
      dessert: null,
      total: 0,
    };
  }

  // Обновляем UI
  if (document.getElementById("order-summary")) {
    updateOrderSummary();
    updateAddButtons();
    updateOrderButton();
  }

  if (settings.showNotification) {
    showNotification("Заказ очищен. Готово к сборке нового заказа!", "success");
  }

  return true;
}

// Функция для очистки после успешного оформления
function clearAfterSuccessfulOrder() {
  // Сохраняем время последнего заказа
  localStorage.setItem("last_order_time", Date.now());

  // Очищаем данные заказа
  clearOrderData({
    keepHistory: true,
    keepDishesCache: true,
    keepUserData: true,
    keepApiKey: true,
    showNotification: false, // Не показываем уведомление, т.к. будет показано другое
  });

  // Сбрасываем форму на странице оформления заказа
  if (window.location.pathname.includes("make-order")) {
    const form = document.getElementById("order-form");
    if (form) {
      form.reset();

      // Сбрасываем Flatpickr, если используется
      const timePicker = document.getElementById("delivery-time");
      if (timePicker && window.flatpickr) {
        const fp = timePicker._flatpickr;
        if (fp) {
          fp.clear();
        }
      }
    }
  }

  console.log("Данные заказа очищены после успешного оформления");
}

// Добавляем глобальные функции
window.clearOrderData = clearOrderData;
window.clearAfterSuccessfulOrder = clearAfterSuccessfulOrder;

// Экспорт для модулей
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    clearOrderData,
    clearAfterSuccessfulOrder,
  };
}

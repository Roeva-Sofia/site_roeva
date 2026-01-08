// Функции для работы с API (ЛР7 - загрузка данных с сервера)

// Загрузка всех блюд с сервера
async function loadDishes() {
  try {
    const url = addApiKey(getDishesApiUrl());
    console.log("Загрузка блюд с URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const dishes = await response.json();
    console.log("Получены блюда:", dishes);

    // Сохраняем блюда в localStorage для кэширования
    localStorage.setItem("foodconstruct_dishes", JSON.stringify(dishes));
    localStorage.setItem("foodconstruct_dishes_timestamp", Date.now());

    // Отображаем блюда на странице
    displayDishes(dishes);

    return dishes;
  } catch (error) {
    console.error("Ошибка при загрузке блюд:", error);

    // Пробуем загрузить из кэша
    const cachedDishes = localStorage.getItem("foodconstruct_dishes");
    if (cachedDishes) {
      console.log("Используем кэшированные данные");
      displayDishes(JSON.parse(cachedDishes));
    } else {
      // Показываем сообщение об ошибке
      showNotification(
        "Не удалось загрузить меню. Пожалуйста, проверьте подключение к интернету.",
        "error"
      );

      // Показываем примерные данные для демонстрации
      displayDishes(getMockDishes());
    }
  }
}

// Получение одного блюда по ID
async function getDishById(dishId) {
  try {
    const url = addApiKey(`${getDishesApiUrl()}/${dishId}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка при получении блюда:", error);

    // Ищем блюдо в кэше
    const cachedDishes = localStorage.getItem("foodconstruct_dishes");
    if (cachedDishes) {
      const dishes = JSON.parse(cachedDishes);
      return dishes.find((dish) => dish.id == dishId);
    }

    return null;
  }
}

// Отображение блюд на странице
function displayDishes(dishes) {
  // Группируем блюда по категориям
  const dishesByCategory = groupDishesByCategory(dishes);

  // Отображаем каждую категорию
  for (const [category, categoryDishes] of Object.entries(dishesByCategory)) {
    displayCategoryDishes(category, categoryDishes);
  }

  // Инициализируем фильтры
  initFilters();

  // Обновляем состояние кнопок "Добавить" для уже выбранных блюд
  updateAddButtons();
}

// Группировка блюд по категориям
function groupDishesByCategory(dishes) {
  const grouped = {
    soup: [],
    "main-course": [], // Исправлено на "main-course"
    salad: [],
    drink: [],
    dessert: [],
  };

  console.log("Группировка блюд:", dishes);

  dishes.forEach((dish) => {
    switch (dish.category) {
      case "soup":
        grouped.soup.push(dish);
        break;
      case "main-course": // Исправлено на "main-course"
        grouped["main-course"].push(dish);
        break;
      case "salad":
        grouped.salad.push(dish);
        break;
      case "drink":
        grouped.drink.push(dish);
        break;
      case "dessert":
        grouped.dessert.push(dish);
        break;
      default:
        console.warn(
          `Неизвестная категория: ${dish.category} для блюда ${dish.name}`
        );
    }
  });

  // Сортируем блюда в алфавитном порядке (ЛР4)
  Object.keys(grouped).forEach((category) => {
    grouped[category].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  });

  console.log("Сгруппированные блюда:", grouped);
  return grouped;
}

// Отображение блюд конкретной категории
function displayCategoryDishes(category, dishes) {
  const container = document.querySelector(
    `.dishes-container[data-category="${category}"]`
  );
  if (!container) {
    console.error(`Контейнер для категории ${category} не найден`);
    return;
  }

  // Очищаем контейнер
  container.innerHTML = "";

  // Отображаем каждое блюдо
  dishes.forEach((dish) => {
    const dishElement = createDishCard(dish);
    container.appendChild(dishElement);
  });

  // Если блюд нет, показываем сообщение
  if (dishes.length === 0) {
    container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-emoji-frown display-4 text-muted"></i>
                <p class="mt-2">Блюда этой категории временно недоступны</p>
            </div>
        `;
  }
}

// Создание карточки блюда
function createDishCard(dish) {
  const col = document.createElement("div");
  col.className = "col-md-6 col-lg-4";

  // Определяем русское название категории
  let categoryName = "";
  switch (dish.category) {
    case "soup":
      categoryName = "Суп";
      break;
    case "main-course": // Исправлено на "main-course"
      categoryName = "Главное блюдо";
      break;
    case "salad":
      categoryName = "Салат";
      break;
    case "drink":
      categoryName = "Напиток";
      break;
    case "dessert":
      categoryName = "Десерт";
      break;
    default:
      categoryName = dish.category;
  }

  col.innerHTML = `
        <div class="dish-card card h-100" data-dish="${
          dish.keyword
        }" data-kind="${dish.kind || "all"}">
            <img src="${dish.image}" class="card-img-top" alt="${
    dish.name
  }" onerror="this.src='images/placeholder.jpg'">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${dish.name}</h5>
                <p class="card-text text-muted small">${categoryName} • ${
    dish.count || "250 г"
  }</p>
                <div class="price mt-auto">${formatPrice(dish.price)}</div>
                <button class="btn btn-add" data-dish-id="${
                  dish.id
                }" data-dish-keyword="${dish.keyword}" data-category="${
    dish.category
  }">
                    Добавить
                </button>
            </div>
        </div>
    `;

  return col;
}

// Мок-данные для демонстрации (если API не работает)
function getMockDishes() {
  return [];
}

// Инициализация фильтров
function initFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");

  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const category = this.dataset.category;
      const kind = this.dataset.kind;

      // Обновляем активный фильтр
      document
        .querySelectorAll(`.filter-btn[data-category="${category}"]`)
        .forEach((btn) => {
          btn.classList.remove("active");
        });
      this.classList.add("active");

      // Применяем фильтр
      applyFilter(category, kind);
    });
  });
}

// Применение фильтра
function applyFilter(category, kind) {
  const dishCards = document.querySelectorAll(
    `.dishes-container[data-category="${category}"] .dish-card`
  );

  dishCards.forEach((card) => {
    if (kind === "all" || card.dataset.kind === kind) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

// Отправка заказа на сервер
async function submitOrderToServer(orderData) {
  try {
    const url = addApiKey(`${getOrdersApiUrl()}/orders`);

    // Подготавливаем данные для отправки
    const requestData = prepareOrderData(orderData);

    // Отправляем POST запрос
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
    }

    const orderResult = await response.json();

    // Сохраняем заказ в историю localStorage
    const orderToSave = {
      ...orderData,
      ...orderResult,
      total: getCurrentOrder().total,
      dishes: getSelectedDishes(),
    };

    saveOrderToHistory(orderToSave);

    resetCurrentOrder();

    clearOrderSessionData();

    return {
      success: true,
      order: orderToSave,
      message: "Заказ успешно оформлен",
    };
  } catch (error) {
    console.error("Ошибка при отправке заказа:", error);

    // В случае ошибки пробуем сохранить заказ локально
    try {
      const orderToSave = {
        ...orderData,
        id: Date.now(),
        created_at: new Date().toISOString(),
        total: getCurrentOrder().total,
        dishes: getSelectedDishes(),
        status: "local", // Помечаем как локальный заказ
      };

      saveOrderToHistory(orderToSave);

      resetCurrentOrder();
      clearOrderSessionData();

      return {
        success: true,
        order: orderToSave,
        message: "Заказ сохранен локально (ошибка подключения к серверу)",
      };
    } catch (localError) {
      return {
        success: false,
        error: error.message,
        message: "Не удалось сохранить заказ",
      };
    }
  }
}

function clearOrderSessionData() {
  console.log("Очистка сессионных данных заказа...");

  // Удаляем временные данные
  const keysToRemove = [
    "foodconstruct_current_order",
    "selected_dishes_cache",
    "order_form_data",
    "delivery_time_selected",
  ];

  keysToRemove.forEach((key) => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`Удален ключ: ${key}`);
    }
  });

  // Если мы на странице оформления заказа, сбрасываем форму
  if (window.location.pathname.includes("make-order")) {
    const form = document.getElementById("order-form");
    if (form) {
      form.reset();
      console.log("Форма заказа сброшена");
    }
  }
}

// Подготовка данных заказа для отправки
function prepareOrderData(orderData) {
  // Берем текущий заказ
  const currentOrder = getCurrentOrder();

  // Создаем объект для отправки
  const data = {
    full_name: orderData.full_name.trim(),
    email: orderData.email.trim(),
    phone: orderData.phone.trim(),
    delivery_address: orderData.delivery_address.trim(),
    delivery_type: orderData.delivery_type || "now",
    subscribe: orderData.subscribe || 0,
    comment: orderData.comment?.trim() || "",
    student_id: API_CONFIG.STUDENT_ID,
  };

  // Добавляем время доставки, если указано
  if (orderData.delivery_type === "by_time" && orderData.delivery_time) {
    data.delivery_time = orderData.delivery_time;
  }

  // Добавляем ID блюд (используем нормализованные ключи)
  if (currentOrder.soup) data.soup_id = currentOrder.soup.id;
  if (currentOrder.mainCourse) data.main_course_id = currentOrder.mainCourse.id;
  if (currentOrder.salad) data.salad_id = currentOrder.salad.id;
  if (currentOrder.drink) data.drink_id = currentOrder.drink.id;
  if (currentOrder.dessert) data.dessert_id = currentOrder.dessert.id;

  return data;
}

// Получение истории заказов с сервера
async function getOrdersFromServer() {
  try {
    const url = addApiKey(`${getOrdersApiUrl()}/orders`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const orders = await response.json();

    // Сохраняем в localStorage для кэширования
    saveToStorage("server_orders", orders);
    saveToStorage("server_orders_timestamp", Date.now());

    return {
      success: true,
      orders: orders,
    };
  } catch (error) {
    console.error("Ошибка при получении заказов:", error);

    // Пробуем загрузить из кэша
    const cachedOrders = loadFromStorage("server_orders");
    if (cachedOrders) {
      return {
        success: true,
        orders: cachedOrders,
        cached: true,
      };
    }

    // Если нет кэша, возвращаем пустой массив
    return {
      success: false,
      error: error.message,
      orders: [],
    };
  }
}

// Получение конкретного заказа с сервера
async function getOrderById(orderId) {
  try {
    const url = addApiKey(`${getOrdersApiUrl()}/orders/${orderId}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка при получении заказа:", error);

    // Ищем заказ в локальной истории
    const localOrders = getOrderHistory();
    const localOrder = localOrders.find((order) => order.id == orderId);

    return localOrder || null;
  }
}

// Обновление заказа на сервера
async function updateOrderOnServer(orderId, updateData) {
  try {
    const url = addApiKey(`${getOrdersApiUrl()}/orders/${orderId}`);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
    }

    const updatedOrder = await response.json();

    // Обновляем заказ в локальной истории
    updateOrderInHistory(orderId, updatedOrder);

    return {
      success: true,
      order: updatedOrder,
      message: "Заказ успешно обновлен",
    };
  } catch (error) {
    console.error("Ошибка при обновлении заказа:", error);
    return {
      success: false,
      error: error.message,
      message: "Не удалось обновить заказ",
    };
  }
}

// Удаление заказа с сервера
async function deleteOrderFromServer(orderId) {
  try {
    const url = addApiKey(`${getOrdersApiUrl()}/orders/${orderId}`);

    const response = await fetch(url, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
    }

    // Удаляем заказ из локальной истории
    deleteOrderFromHistory(orderId);

    return {
      success: true,
      message: "Заказ успешно удален",
    };
  } catch (error) {
    console.error("Ошибка при удалении заказа:", error);
    return {
      success: false,
      error: error.message,
      message: "Не удалось удалить заказ",
    };
  }
}

// Обновление заказа в локальной истории
function updateOrderInHistory(orderId, updatedData) {
  const orders = getOrderHistory();
  const index = orders.findIndex((order) => order.id == orderId);

  if (index !== -1) {
    orders[index] = { ...orders[index], ...updatedData };
    saveToStorage("foodconstruct_user_orders", orders);
    return true;
  }

  return false;
}

// Удаление заказа из локальной истории
function deleteOrderFromHistory(orderId) {
  const orders = getOrderHistory();
  const filteredOrders = orders.filter((order) => order.id != orderId);
  saveToStorage("foodconstruct_user_orders", filteredOrders);
  return true;
}

// Дополнение к api.js для работы с заказами (ЛР9)

// Получение заказов с сервера
async function getOrdersFromServer() {
  try {
    const url = addApiKey(`${getOrdersApiUrl()}/orders`);
    console.log("Запрос заказов по URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      // Если ошибка авторизации
      if (response.status === 401) {
        throw new Error("Требуется авторизация. Проверьте API ключ.");
      }
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const orders = await response.json();
    console.log("Полученные заказы с сервера:", orders);

    // Сохраняем в localStorage для кэширования
    saveToStorage("server_orders", orders);
    saveToStorage("server_orders_timestamp", Date.now());

    return {
      success: true,
      orders: orders,
      cached: false,
    };
  } catch (error) {
    console.error("Ошибка при получении заказов:", error);

    // Пробуем загрузить из кэша
    const cachedOrders = loadFromStorage("server_orders");
    if (cachedOrders && cachedOrders.length > 0) {
      console.log("Используем кэшированные заказы");
      return {
        success: true,
        orders: cachedOrders,
        cached: true,
      };
    }

    // Если нет заказов в кэше, возвращаем пустой массив
    return {
      success: false,
      error: error.message,
      orders: [],
      cached: false,
    };
  }
}

// Получение конкретного заказа по ID
async function getOrderById(orderId) {
  try {
    const url = addApiKey(`${getOrdersApiUrl()}/orders/${orderId}`);
    console.log("Запрос заказа по ID:", url);

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Заказ не найден");
      }
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const order = await response.json();
    console.log("Полученный заказ:", order);

    return {
      success: true,
      order: order,
    };
  } catch (error) {
    console.error("Ошибка при получении заказа:", error);
    return {
      success: false,
      error: error.message,
      order: null,
    };
  }
}

// Обновление заказа
async function updateOrder(orderId, updateData) {
  try {
    const url = addApiKey(`${getOrdersApiUrl()}/orders/${orderId}`);
    console.log("Обновление заказа:", url, updateData);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
    }

    const updatedOrder = await response.json();
    console.log("Обновленный заказ:", updatedOrder);

    // Обновляем заказ в локальной истории
    updateOrderInLocalHistory(orderId, updatedOrder);

    return {
      success: true,
      order: updatedOrder,
      message: "Заказ успешно обновлен",
    };
  } catch (error) {
    console.error("Ошибка при обновлении заказа:", error);
    return {
      success: false,
      error: error.message,
      message: "Не удалось обновить заказ",
    };
  }
}

// Удаление заказа
async function deleteOrder(orderId) {
  try {
    const url = addApiKey(`${getOrdersApiUrl()}/orders/${orderId}`);
    console.log("Удаление заказа:", url);

    const response = await fetch(url, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
    }

    // Удаляем заказ из локальной истории
    deleteOrderFromLocalHistory(orderId);

    return {
      success: true,
      message: "Заказ успешно удален",
    };
  } catch (error) {
    console.error("Ошибка при удалении заказа:", error);
    return {
      success: false,
      error: error.message,
      message: "Не удалось удалить заказ",
    };
  }
}

// Обновление заказа на сервере
async function updateOrderOnServer(orderId, updateData) {
  try {
    const url = addApiKey(`${getOrdersApiUrl()}/orders/${orderId}`);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
    }

    const updatedOrder = await response.json();

    // Обновляем заказ в локальной истории
    updateOrderInLocalHistory(orderId, updatedOrder);

    return {
      success: true,
      order: updatedOrder,
      message: "Заказ успешно обновлен",
    };
  } catch (error) {
    console.error("Ошибка при обновлении заказа:", error);
    return {
      success: false,
      error: error.message,
      message: "Не удалось обновить заказ",
    };
  }
}

// Удаление заказа с сервера
async function deleteOrderFromServer(orderId) {
  try {
    const url = addApiKey(`${getOrdersApiUrl()}/orders/${orderId}`);

    const response = await fetch(url, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
    }

    // Удаляем заказ из локальной истории
    deleteOrderFromLocalHistory(orderId);

    return {
      success: true,
      message: "Заказ успешно удален",
    };
  } catch (error) {
    console.error("Ошибка при удалении заказа:", error);
    return {
      success: false,
      error: error.message,
      message: "Не удалось удалить заказ",
    };
  }
}

async function fetchAllDishes() {
  try {
    const url = addApiKey(getDishesApiUrl());
    console.log("Загрузка всех блюд по URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const dishes = await response.json();
    console.log(`Загружено ${dishes.length} блюд`);

    // Кэшируем
    localStorage.setItem("foodconstruct_dishes", JSON.stringify(dishes));
    localStorage.setItem("foodconstruct_dishes_timestamp", Date.now());

    return dishes;
  } catch (error) {
    console.error("Ошибка при загрузке блюд:", error);

    // Пробуем из кэша
    const cachedDishes = localStorage.getItem("foodconstruct_dishes");
    if (cachedDishes) {
      return JSON.parse(cachedDishes);
    }

    return [];
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    loadOrders,
    displayOrders,
    createOrderRow,
    getOrderComposition,
    formatDeliveryTime,
    getOrderCommentPreview,
    calculateOrderTotal,
    addOrderRowEventListeners,
    showLoading,
    showEmptyState,
    updateStatistics,
    showOrderDetailsModal,
    getFullOrderInfo,
    createOrderDetailsModal,
    showEditOrderModal,
    showDeleteOrderModal,
    loadDishesMap,
    buildDishesMap,
    enrichOrderWithDishInfo,
    updateOrder,
    validateOrderForm,
    isValidEmail,
    isValidPhone,
  };
}

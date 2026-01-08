// Логика для страницы "Мои заказы" (ЛР9)

// Глобальные переменные
let allOrders = [];
let dishesMap = {};
let currentPage = 1;
const ordersPerPage = 10;

async function loadDishesMap() {
  try {
    console.log("Загрузка блюд для сопоставления с заказами...");

    // Пробуем получить из кэша
    const cachedDishes = localStorage.getItem("foodconstruct_dishes");
    const cachedTimestamp = localStorage.getItem(
      "foodconstruct_dishes_timestamp"
    );
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

    if (
      cachedDishes &&
      cachedTimestamp &&
      Date.now() - parseInt(cachedTimestamp) < CACHE_TTL
    ) {
      console.log("Используем кэшированные блюда");
      const dishes = JSON.parse(cachedDishes);
      buildDishesMap(dishes);
      return true;
    }

    // Загружаем с сервера
    const url = addApiKey(getDishesApiUrl());
    console.log("Запрос блюд по URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const dishes = await response.json();
    console.log("Получены блюда с сервера:", dishes);

    // Сохраняем в кэш
    localStorage.setItem("foodconstruct_dishes", JSON.stringify(dishes));
    localStorage.setItem("foodconstruct_dishes_timestamp", Date.now());

    buildDishesMap(dishes);
    return true;
  } catch (error) {
    console.error("Ошибка при загрузке блюд:", error);

    // Пробуем из кэша, даже если старый
    const cachedDishes = localStorage.getItem("foodconstruct_dishes");
    if (cachedDishes) {
      console.log("Используем старые кэшированные блюда");
      const dishes = JSON.parse(cachedDishes);
      buildDishesMap(dishes);
      return true;
    }

    return false;
  }
}

function buildDishesMap(dishes) {
  dishesMap = {};
  dishes.forEach((dish) => {
    dishesMap[dish.id] = {
      id: dish.id,
      name: dish.name,
      category: dish.category,
      price: dish.price,
    };
  });
  console.log("Карта блюд построена:", dishesMap);
}

// Загрузка заказов с сервера
async function loadOrders() {
  try {
    showLoading(true);

    // Загружаем карту блюд
    const dishesLoaded = await loadDishesMap();
    if (!dishesLoaded) {
      showNotification(
        "Не удалось загрузить информацию о блюдах. Состав заказа может отображаться некорректно.",
        "warning"
      );
    }

    console.log("Загрузка заказов с сервера...");
    const result = await getOrdersFromServer();

    if (result.success) {
      allOrders = result.orders;
      console.log(`Загружено ${allOrders.length} заказов:`, allOrders);

      // Обогащаем заказы информацией о блюдах
      allOrders = allOrders.map((order) => enrichOrderWithDishInfo(order));

      // Сортируем по дате (сначала новые)
      allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Отображаем заказы
      displayOrders(allOrders);

      // Обновляем статистику
      updateStatistics(allOrders);

      // Показываем уведомление, если использовался кэш
      if (result.cached) {
        showNotification(
          "Используются кэшированные данные. Обновите для получения актуальной информации.",
          "info"
        );
      }
    } else {
      throw new Error(result.error || "Не удалось загрузить заказы");
    }
  } catch (error) {
    console.error("Ошибка при загрузке заказов:", error);
    showNotification(`Ошибка: ${error.message}`, "error");

    // Показываем сообщение об ошибке
    showEmptyState(
      "Не удалось загрузить историю заказов. Пожалуйста, проверьте подключение к интернету."
    );
  } finally {
    showLoading(false);
  }
}

function enrichOrderWithDishInfo(order) {
  const enriched = { ...order };

  // Добавляем названия блюд
  if (order.soup_id && dishesMap[order.soup_id]) {
    enriched.soup_name = dishesMap[order.soup_id].name;
  }
  if (order.main_course_id && dishesMap[order.main_course_id]) {
    enriched.main_course_name = dishesMap[order.main_course_id].name;
  }
  if (order.salad_id && dishesMap[order.salad_id]) {
    enriched.salad_name = dishesMap[order.salad_id].name;
  }
  if (order.drink_id && dishesMap[order.drink_id]) {
    enriched.drink_name = dishesMap[order.drink_id].name;
  }
  if (order.dessert_id && dishesMap[order.dessert_id]) {
    enriched.dessert_name = dishesMap[order.dessert_id].name;
  }

  // Добавляем массив dishes для совместимости
  enriched.dishes = [];
  if (enriched.soup_name) {
    enriched.dishes.push({
      name: enriched.soup_name,
      price: dishesMap[order.soup_id]?.price || 0,
    });
  }
  if (enriched.main_course_name) {
    enriched.dishes.push({
      name: enriched.main_course_name,
      price: dishesMap[order.main_course_id]?.price || 0,
    });
  }
  if (enriched.salad_name) {
    enriched.dishes.push({
      name: enriched.salad_name,
      price: dishesMap[order.salad_id]?.price || 0,
    });
  }
  if (enriched.drink_name) {
    enriched.dishes.push({
      name: enriched.drink_name,
      price: dishesMap[order.drink_id]?.price || 0,
    });
  }
  if (enriched.dessert_name) {
    enriched.dishes.push({
      name: enriched.dessert_name,
      price: dishesMap[order.dessert_id]?.price || 0,
    });
  }

  // Добавляем total, если его нет
  if (!enriched.total) {
    enriched.total = calculateOrderTotal(enriched);
  }

  return enriched;
}

// Отображение заказов в таблице
function displayOrders(orders) {
  const tableBody = document.getElementById("orders-table-body");

  if (!tableBody) return;

  // Очищаем таблицу
  tableBody.innerHTML = "";

  if (orders.length === 0) {
    showEmptyState("У вас еще нет оформленных заказов");
    return;
  }

  // Создаем строки для каждого заказа
  orders.forEach((order, index) => {
    const row = createOrderRow(order, index + 1);
    tableBody.appendChild(row);
  });
}

// Создание строки таблицы для заказа
function createOrderRow(order, number) {
  // Обогащаем заказ перед отображением в строке
  const enrichedOrder = enrichOrderWithDishInfo(order);

  const row = document.createElement("tr");
  row.className = "order-row";
  row.dataset.orderId = enrichedOrder.id;

  // Форматируем дату
  const orderDate = new Date(enrichedOrder.created_at);
  const formattedDate = orderDate.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Получаем состав заказа
  const orderComposition = getOrderComposition(enrichedOrder);

  // Форматируем время доставки
  const deliveryTime = formatDeliveryTime(enrichedOrder);

  // Создаем ячейки
  row.innerHTML = `
    <td class="fw-bold">${number}</td>
    <td>${formattedDate}</td>
    <td>
      <div class="order-composition">${orderComposition}</div>
      <small class="text-muted">${getOrderCommentPreview(
        enrichedOrder.comment
      )}</small>
    </td>
    <td class="fw-bold text-primary">${formatPrice(
      enrichedOrder.total || calculateOrderTotal(enrichedOrder)
    )}</td>
    <td>
      <div class="delivery-time-info">
        <i class="bi bi-clock"></i>
        ${deliveryTime}
      </div>
    </td>
    <td>
      <div class="d-flex gap-2">
        <button class="btn btn-action btn-view view-order-btn" data-order-id="${
          enrichedOrder.id
        }" title="Подробнее">
          <i class="bi bi-eye"></i>
        </button>
        <button class="btn btn-action btn-edit edit-order-btn" data-order-id="${
          enrichedOrder.id
        }" title="Редактировать">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-action btn-delete delete-order-btn" data-order-id="${
          enrichedOrder.id
        }" title="Удалить">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </td>
  `;

  // Добавляем обработчики событий
  addOrderRowEventListeners(row, enrichedOrder);

  return row;
}

// Получение состава заказа
function getOrderComposition(order) {
  const dishNames = [];

  // Пробуем получить названия из полей _name (если есть)
  if (order.soup_name) dishNames.push(order.soup_name);
  if (order.main_course_name) dishNames.push(order.main_course_name);
  if (order.salad_name) dishNames.push(order.salad_name);
  if (order.drink_name) dishNames.push(order.drink_name);
  if (order.dessert_name) dishNames.push(order.dessert_name);

  // Если названий нет, пытаемся получить по ID из карты блюд
  if (dishNames.length === 0) {
    console.log("Ищем блюда по ID для заказа:", order.id);
    console.log(
      "soup_id:",
      order.soup_id,
      "salad_id:",
      order.salad_id,
      "drink_id:",
      order.drink_id
    );

    if (order.soup_id && dishesMap[order.soup_id]) {
      dishNames.push(dishesMap[order.soup_id].name);
    }
    if (order.main_course_id && dishesMap[order.main_course_id]) {
      dishNames.push(dishesMap[order.main_course_id].name);
    }
    if (order.salad_id && dishesMap[order.salad_id]) {
      dishNames.push(dishesMap[order.salad_id].name);
    }
    if (order.drink_id && dishesMap[order.drink_id]) {
      dishNames.push(dishesMap[order.drink_id].name);
    }
    if (order.dessert_id && dishesMap[order.dessert_id]) {
      dishNames.push(dishesMap[order.dessert_id].name);
    }
  }

  // Если у заказа есть массив dishes (локальное сохранение)
  if (dishNames.length === 0 && order.dishes && order.dishes.length > 0) {
    dishNames.push(...order.dishes.map((dish) => dish.name));
  }

  return dishNames.length > 0
    ? dishNames.join(", ")
    : "Информация о составе заказа временно недоступна";
}

// Форматирование времени доставки
function formatDeliveryTime(order) {
  if (order.delivery_type === "by_time" && order.delivery_time) {
    return order.delivery_time;
  }
  return "Как можно скорее (с 7:00 до 23:00)";
}

// Получение предпросмотра комментария
function getOrderCommentPreview(comment) {
  if (!comment) return "";

  if (comment.length > 50) {
    return comment.substring(0, 47) + "...";
  }

  return comment;
}

// Подсчет общей стоимости заказа
function calculateOrderTotal(order) {
  // Если есть поле total, используем его
  if (order.total) return order.total;

  let total = 0;

  // Считаем по ID блюд через карту dishesMap
  if (order.soup_id && dishesMap[order.soup_id]) {
    total += dishesMap[order.soup_id].price || 0;
  }
  if (order.main_course_id && dishesMap[order.main_course_id]) {
    total += dishesMap[order.main_course_id].price || 0;
  }
  if (order.salad_id && dishesMap[order.salad_id]) {
    total += dishesMap[order.salad_id].price || 0;
  }
  if (order.drink_id && dishesMap[order.drink_id]) {
    total += dishesMap[order.drink_id].price || 0;
  }
  if (order.dessert_id && dishesMap[order.dessert_id]) {
    total += dishesMap[order.dessert_id].price || 0;
  }

  // Если у заказа есть массив dishes (локальное сохранение)
  if (total === 0 && order.dishes && order.dishes.length > 0) {
    total = order.dishes.reduce((sum, dish) => sum + (dish.price || 0), 0);
  }

  return total;
}

// Добавление обработчиков событий к строке заказа
function addOrderRowEventListeners(row, order) {
  // Обработчик просмотра
  row.querySelector(".view-order-btn").addEventListener("click", function (e) {
    e.stopPropagation();
    showOrderDetailsModal(order);
  });

  // Обработчик редактирования
  row.querySelector(".edit-order-btn").addEventListener("click", function (e) {
    e.stopPropagation();
    showEditOrderModal(order);
  });

  // Обработчик удаления
  row
    .querySelector(".delete-order-btn")
    .addEventListener("click", function (e) {
      e.stopPropagation();
      showDeleteOrderModal(order);
    });

  // Клик по строке - просмотр заказа
  row.addEventListener("click", function (e) {
    if (!e.target.closest("button")) {
      showOrderDetailsModal(order);
    }
  });
}

// Показ состояния загрузки
function showLoading(isLoading) {
  const tableBody = document.getElementById("orders-table-body");
  const loadingRow = document.getElementById("loading-row");

  if (!tableBody || !loadingRow) return;

  if (isLoading) {
    tableBody.innerHTML = "";
    loadingRow.classList.remove("d-none");
    tableBody.appendChild(loadingRow);
  } else {
    loadingRow.classList.add("d-none");
  }
}

// Показ пустого состояния
function showEmptyState(message) {
  const tableBody = document.getElementById("orders-table-body");

  if (!tableBody) return;

  tableBody.innerHTML = `
        <tr id="no-orders-row">
            <td colspan="6" class="text-center py-5">
                <i class="bi bi-inbox display-4 text-muted"></i>
                <h4 class="mt-3">${message}</h4>
                <p class="text-muted mb-4">Попробуйте обновить страницу или оформите новый заказ</p>
                <div class="d-flex gap-2 justify-content-center">
                    <button id="retry-load" class="btn btn-outline-primary">
                        <i class="bi bi-arrow-clockwise me-1"></i> Повторить
                    </button>
                    <a href="assemble-lunch.html" class="btn btn-primary">
                        <i class="bi bi-cart-plus me-2"></i> Сделать заказ
                    </a>
                </div>
            </td>
        </tr>
    `;

  // Обработчик повторной попытки
  document.getElementById("retry-load")?.addEventListener("click", function () {
    loadOrders();
  });
}

// Обновление статистики
function updateStatistics(orders) {
  const totalOrders = document.getElementById("total-orders");
  const totalSpent = document.getElementById("total-spent");
  const averageOrder = document.getElementById("average-order");
  const lastOrderDate = document.getElementById("last-order-date");

  if (!totalOrders || !totalSpent || !averageOrder || !lastOrderDate) return;

  // Общее количество заказов
  totalOrders.textContent = orders.length;

  // Общая сумма
  const totalAmount = orders.reduce(
    (sum, order) => sum + calculateOrderTotal(order),
    0
  );
  totalSpent.textContent = formatPrice(totalAmount);

  // Средний чек
  const average = orders.length > 0 ? totalAmount / orders.length : 0;
  averageOrder.textContent = formatPrice(average);

  // Дата последнего заказа
  if (orders.length > 0) {
    const lastOrder = orders[0]; // Уже отсортированы по убыванию
    const lastDate = new Date(lastOrder.created_at);
    lastOrderDate.textContent = lastDate.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
    });
  } else {
    lastOrderDate.textContent = "—";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("Orders module loaded");

  loadOrders();
});

// Дополнение к orders.js - модальные окна

// Показ модального окна с деталями заказа
function showOrderDetailsModal(order) {
  // Получаем полную информацию о заказе
  getFullOrderInfo(order.id).then((result) => {
    if (result.success) {
      createOrderDetailsModal(result.order);
    } else {
      // Используем имеющуюся информацию
      createOrderDetailsModal(order);
    }
  });
}

// Получение полной информации о заказе
async function getFullOrderInfo(orderId) {
  // Пробуем получить с сервера
  const serverResult = await getOrderById(orderId);

  if (serverResult.success) {
    return serverResult;
  }

  // Ищем в локальной истории
  const localOrder = getOrderFromHistory(orderId);
  if (localOrder) {
    return {
      success: true,
      order: localOrder,
    };
  }

  return {
    success: false,
    error: "Не удалось получить информацию о заказе",
  };
}

// Создание модального окна деталей заказа
function createOrderDetailsModal(order) {
  const enrichedOrder = enrichOrderWithDishInfo(order);
  const modalId = `order-details-${enrichedOrder.id}`;

  // Форматируем дату
  const orderDate = new Date(enrichedOrder.created_at);
  const formattedDate = orderDate.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Получаем состав заказа
  const orderComposition = getOrderComposition(enrichedOrder);

  // Форматируем время доставки
  const deliveryTime = formatDeliveryTime(enrichedOrder);

  const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header border-0 bg-primary text-white">
                        <h5 class="modal-title">Заказ №${enrichedOrder.id}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="mb-3">Информация о заказе</h6>
                                <div class="info-item">
                                    <span class="info-label">Дата оформления:</span>
                                    <span>${formattedDate}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Стоимость:</span>
                                    <span class="fw-bold text-primary">${formatPrice(
                                      calculateOrderTotal(enrichedOrder)
                                    )}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Тип доставки:</span>
                                    <span>${
                                      enrichedOrder.delivery_type === "by_time"
                                        ? "Ко времени"
                                        : "Как можно скорее"
                                    }</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Время доставки:</span>
                                    <span>${deliveryTime}</span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="mb-3">Данные получателя</h6>
                                <div class="info-item">
                                    <span class="info-label">Имя:</span>
                                    <span>${
                                      enrichedOrder.full_name || "Не указано"
                                    }</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Телефон:</span>
                                    <span>${
                                      enrichedOrder.phone || "Не указан"
                                    }</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Email:</span>
                                    <span>${
                                      enrichedOrder.email || "Не указан"
                                    }</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Адрес:</span>
                                    <span>${
                                      enrichedOrder.delivery_address ||
                                      "Не указан"
                                    }</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Подписка:</span>
                                    <span>${
                                      enrichedOrder.subscribe ? "Да" : "Нет"
                                    }</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row mt-4">
                            <div class="col-12">
                                <h6 class="mb-3">Состав заказа</h6>
                                <div class="alert alert-light">
                                    ${orderComposition}
                                </div>
                            </div>
                        </div>
                        
                        ${
                          enrichedOrder.comment
                            ? `
                        <div class="row mt-4">
                            <div class="col-12">
                                <h6 class="mb-3">Комментарий</h6>
                                <div class="alert alert-info">
                                    <p class="mb-0">${enrichedOrder.comment}</p>
                                </div>
                            </div>
                        </div>
                        `
                            : ""
                        }
                    </div>
                    <div class="modal-footer border-0">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Добавляем модальное окно в DOM
  const modalContainer = document.getElementById("modal-container");
  if (modalContainer) {
    modalContainer.innerHTML = modalHTML;
  } else {
    const container = document.createElement("div");
    container.id = "modal-container";
    container.innerHTML = modalHTML;
    document.body.appendChild(container);
  }

  // Показываем модальное окно
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Удаляем модальное окно после закрытия
    modalElement.addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
  }
}

// Дополнение к orders.js - функция редактирования заказа

// Создание модального окна редактирования заказа
function showEditOrderModal(order) {
  console.log(order);
  const modalId = `order-edit-${order.id}`;

  // Форматируем дату для отображения
  const orderDate = new Date(order.created_at);
  const formattedDate = orderDate.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Подготавливаем данные для формы
  const deliveryType = order.delivery_type || "now";
  const deliveryTime = order.delivery_time || "";
  const comment = order.comment || "";
  const subscribe = order.subscribe || 0;

  const modalHTML = `
    <div class="modal fade" id="${modalId}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header border-0 bg-primary text-white">
            <h5 class="modal-title">Редактирование заказа №${order.id}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-info mb-4">
              <i class="bi bi-info-circle me-2"></i>
              Заказ создан: ${formattedDate}. Вы можете изменить данные получателя и доставки.
            </div>
            
            <form id="edit-order-form-${
              order.id
            }" class="needs-validation" novalidate>
              <div class="row">
                <div class="col-md-6">
                  <h6 class="mb-3 border-bottom pb-2">Данные получателя</h6>
                  
                  <div class="mb-3">
                    <label for="full_name_${
                      order.id
                    }" class="form-label">ФИО *</label>
                    <input type="text" class="form-control" id="full_name_${
                      order.id
                    }" 
                           name="full_name" value="${
                             order.full_name || ""
                           }" required>
                    <div class="invalid-feedback">Укажите ваше имя</div>
                  </div>
                  
                  <div class="mb-3">
                    <label for="email_${
                      order.id
                    }" class="form-label">Email *</label>
                    <input type="email" class="form-control" id="email_${
                      order.id
                    }" 
                           name="email" value="${order.email || ""}" required>
                    <div class="invalid-feedback">Укажите корректный email</div>
                  </div>
                  
                  <div class="mb-3">
                    <label for="phone_${
                      order.id
                    }" class="form-label">Телефон *</label>
                    <input type="tel" class="form-control" id="phone_${
                      order.id
                    }" 
                           name="phone" value="${order.phone || ""}" required>
                    <div class="invalid-feedback">Укажите корректный номер телефона</div>
                  </div>
                  
                  <div class="mb-3">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="subscribe_${
                        order.id
                      }" 
                             name="subscribe" ${
                               subscribe ? "checked" : ""
                             } value="1">
                      <label class="form-check-label" for="subscribe_${
                        order.id
                      }">
                        Подписаться на рассылку
                      </label>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <h6 class="mb-3 border-bottom pb-2">Доставка</h6>
                  
                  <div class="mb-3">
                    <label for="delivery_address_${
                      order.id
                    }" class="form-label">Адрес доставки *</label>
                    <textarea class="form-control" id="delivery_address_${
                      order.id
                    }" 
                              name="delivery_address" rows="2" required>${
                                order.delivery_address || ""
                              }</textarea>
                    <div class="invalid-feedback">Укажите адрес доставки</div>
                  </div>
                  
                  <div class="mb-3">
                    <label class="form-label">Тип доставки *</label>
                    <div class="delivery-type-buttons">
                      <div class="form-check mb-2">
                        <input class="form-check-input" type="radio" 
                               name="delivery_type_${
                                 order.id
                               }" id="delivery_now_${order.id}" 
                               value="now" ${
                                 deliveryType === "now" ? "checked" : ""
                               }>
                        <label class="form-check-label" for="delivery_now_${
                          order.id
                        }">
                          Как можно скорее (с 7:00 до 23:00)
                        </label>
                      </div>
                      <div class="form-check">
                        <input class="form-check-input" type="radio" 
                               name="delivery_type_${
                                 order.id
                               }" id="delivery_by_time_${order.id}" 
                               value="by_time" ${
                                 deliveryType === "by_time" ? "checked" : ""
                               }>
                        <label class="form-check-label" for="delivery_by_time_${
                          order.id
                        }">
                          Ко времени
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div class="mb-3 ${
                    deliveryType !== "by_time" ? "d-none" : ""
                  }" id="delivery_time_container_${order.id}">
                    <label for="delivery_time_${
                      order.id
                    }" class="form-label">Время доставки *</label>
                    <input type="text" class="form-control delivery-time-picker" 
                           id="delivery_time_${order.id}" name="delivery_time" 
                           value="${deliveryTime}" placeholder="Выберите время">
                    <div class="invalid-feedback">Укажите время доставки с 7:00 до 23:00</div>
                    <small class="text-muted">Доступное время: с 7:00 до 23:00 с шагом 5 минут</small>
                  </div>
                  
                  <div class="mb-3">
                    <label for="comment_${
                      order.id
                    }" class="form-label">Комментарий к заказу</label>
                    <textarea class="form-control" id="comment_${order.id}" 
                              name="comment" rows="3">${comment}</textarea>
                  </div>
                </div>
              </div>
              
              <div class="row mt-4">
                <div class="col-12">
                  <h6 class="mb-3 border-bottom pb-2">Состав заказа</h6>
                  <div class="alert alert-light">
                    ${getOrderComposition(order)}
                    <div class="mt-2 fw-bold">
                      Общая стоимость: ${formatPrice(
                        calculateOrderTotal(order)
                      )}
                    </div>
                  </div>
                  <small class="text-muted">Состав заказа нельзя изменить после оформления</small>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Отмена
            </button>
            <button type="button" class="btn btn-primary" id="save-order-${
              order.id
            }">
              Сохранить изменения
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Добавляем модальное окно в DOM
  const modalContainer = document.getElementById("modal-container");
  if (modalContainer) {
    modalContainer.innerHTML = modalHTML;
  } else {
    const container = document.createElement("div");
    container.id = "modal-container";
    container.innerHTML = modalHTML;
    document.body.appendChild(container);
  }

  // Показываем модальное окно
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Инициализация Flatpickr для выбора времени
    if (window.flatpickr) {
      flatpickr(`#delivery_time_${order.id}`, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 5,
        locale: "ru",
        minTime: "07:00",
        maxTime: "23:00",
        defaultHour: deliveryTime ? parseInt(deliveryTime.split(":")[0]) : 12,
        defaultMinute: deliveryTime ? parseInt(deliveryTime.split(":")[1]) : 0,
      });
    }

    // Обработчик переключения типа доставки
    const deliveryNowRadio = document.getElementById(
      `delivery_now_${order.id}`
    );
    const deliveryByTimeRadio = document.getElementById(
      `delivery_by_time_${order.id}`
    );
    const deliveryTimeContainer = document.getElementById(
      `delivery_time_container_${order.id}`
    );

    function updateDeliveryTimeVisibility() {
      if (deliveryByTimeRadio.checked) {
        deliveryTimeContainer.classList.remove("d-none");
        document.getElementById(`delivery_time_${order.id}`).required = true;
      } else {
        deliveryTimeContainer.classList.add("d-none");
        document.getElementById(`delivery_time_${order.id}`).required = false;
      }
    }

    deliveryNowRadio.addEventListener("change", updateDeliveryTimeVisibility);
    deliveryByTimeRadio.addEventListener(
      "change",
      updateDeliveryTimeVisibility
    );

    // Инициализируем видимость при загрузке
    updateDeliveryTimeVisibility();

    // Валидация формы
    const form = document.getElementById(`edit-order-form-${order.id}`);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
    });

    // Обработчик сохранения
    document
      .getElementById(`save-order-${order.id}`)
      .addEventListener("click", async function () {
        // Собираем данные формы
        const form = document.getElementById(`edit-order-form-${order.id}`);

        // Проверяем валидность
        if (!form.checkValidity()) {
          form.classList.add("was-validated");
          return;
        }

        // Собираем данные
        const formData = {
          full_name: document
            .getElementById(`full_name_${order.id}`)
            .value.trim(),
          email: document.getElementById(`email_${order.id}`).value.trim(),
          phone: document.getElementById(`phone_${order.id}`).value.trim(),
          delivery_address: document
            .getElementById(`delivery_address_${order.id}`)
            .value.trim(),
          delivery_type: document.querySelector(
            `input[name="delivery_type_${order.id}"]:checked`
          ).value,
          subscribe: document.getElementById(`subscribe_${order.id}`).checked
            ? 1
            : 0,
          comment: document.getElementById(`comment_${order.id}`).value.trim(),
        };

        // Добавляем время доставки, если выбрано "ко времени"
        if (formData.delivery_type === "by_time") {
          formData.delivery_time = document.getElementById(
            `delivery_time_${order.id}`
          ).value;

          // Проверка времени доставки
          if (!formData.delivery_time) {
            showNotification("Укажите время доставки", "error");
            return;
          }

          const time = formData.delivery_time.split(":");
          const hours = parseInt(time[0]);
          const minutes = parseInt(time[1]);

          if (hours < 7 || hours > 23 || (hours === 23 && minutes > 0)) {
            showNotification(
              "Время доставки должно быть с 7:00 до 23:00",
              "error"
            );
            return;
          }
        }

        // Дополнительная валидация
        const validationResult = validateOrderForm(formData);
        if (!validationResult.isValid) {
          showNotification(validationResult.errors.join("<br>"), "error");
          return;
        }

        // Блокируем кнопку и показываем индикатор загрузки
        this.disabled = true;
        const originalText = this.innerHTML;
        this.innerHTML =
          '<span class="spinner-border spinner-border-sm me-2"></span> Сохранение...';

        try {
          // Отправляем запрос на обновление заказа
          const result = await updateOrder(order.id, formData);

          if (result.success) {
            // Показываем уведомление об успехе
            showNotification("Заказ успешно обновлен", "success");

            // Закрываем модальное окно
            modal.hide();

            // Обновляем список заказов
            setTimeout(() => {
              loadOrders();
            }, 500);
          } else {
            throw new Error(result.error || "Не удалось обновить заказ");
          }
        } catch (error) {
          console.error("Ошибка при обновлении заказа:", error);
          showNotification(`Ошибка: ${error.message}`, "error");

          // Восстанавливаем кнопку
          this.disabled = false;
          this.innerHTML = originalText;
        }
      });

    // Удаляем модальное окно после закрытия
    modalElement.addEventListener("hidden.bs.modal", function () {
      this.remove();

      // Удаляем Flatpickr инстанс
      if (window.flatpickr) {
        const flatpickrInstance = flatpickr(`#delivery_time_${order.id}`, {});
        if (flatpickrInstance) {
          flatpickrInstance.destroy();
        }
      }
    });
  }
}

// Функция для обновления заказа
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

    // Пробуем обновить локально
    try {
      const localOrders = getOrderHistory();
      const orderIndex = localOrders.findIndex((o) => o.id == orderId);

      if (orderIndex !== -1) {
        localOrders[orderIndex] = {
          ...localOrders[orderIndex],
          ...updateData,
          updated_at: new Date().toISOString(),
        };

        saveToStorage("foodconstruct_user_orders", localOrders);

        return {
          success: true,
          order: localOrders[orderIndex],
          message: "Заказ обновлен локально (ошибка подключения к серверу)",
          cached: true,
        };
      }
    } catch (localError) {
      console.error("Ошибка при локальном обновлении:", localError);
    }

    return {
      success: false,
      error: error.message,
      message: "Не удалось обновить заказ",
    };
  }
}

// Функция для валидации формы редактирования
function validateOrderForm(formData) {
  const errors = [];

  if (!formData.full_name || formData.full_name.trim().length < 2) {
    errors.push("Укажите ваше имя");
  }

  if (!formData.email || !isValidEmail(formData.email)) {
    errors.push("Укажите корректный email");
  }

  if (!formData.phone || !isValidPhone(formData.phone)) {
    errors.push("Укажите корректный номер телефона");
  }

  if (
    !formData.delivery_address ||
    formData.delivery_address.trim().length < 5
  ) {
    errors.push("Укажите адрес доставки");
  }

  if (!formData.delivery_type) {
    errors.push("Выберите тип доставки");
  }

  // Проверка времени доставки
  if (formData.delivery_type === "by_time") {
    if (!formData.delivery_time) {
      errors.push("Укажите время доставки");
    } else {
      const timeParts = formData.delivery_time.split(":");
      if (timeParts.length !== 2) {
        errors.push("Неверный формат времени");
      } else {
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);

        if (hours < 7 || hours > 23 || (hours === 23 && minutes > 0)) {
          errors.push("Время доставки должно быть с 7:00 до 23:00");
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}

// Проверка email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Проверка телефона
function isValidPhone(phone) {
  const phoneRegex =
    /^(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

// Создание модального окна удаления заказа
function showDeleteOrderModal(order) {
  const modalId = `order-delete-${order.id}`;

  const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0">
                        <h5 class="modal-title">Удаление заказа</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center py-4">
                        <div class="mb-3">
                            <i class="bi bi-exclamation-triangle display-4 text-warning"></i>
                        </div>
                        <h5 class="mb-3">Вы уверены, что хотите удалить заказ №${
                          order.id
                        }?</h5>
                        <p class="text-muted">Эта операция необратима. Заказ будет удален из истории.</p>
                        <div class="alert alert-light mt-3">
                            <p class="mb-1"><strong>Дата:</strong> ${new Date(
                              order.created_at
                            ).toLocaleDateString("ru-RU")}</p>
                            <p class="mb-1"><strong>Сумма:</strong> ${formatPrice(
                              calculateOrderTotal(order)
                            )}</p>
                        </div>
                    </div>
                    <div class="modal-footer border-0 justify-content-center">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Отмена
                        </button>
                        <button type="button" class="btn btn-danger" id="confirm-delete-${
                          order.id
                        }">
                            Удалить заказ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Добавляем модальное окно в DOM
  const modalContainer = document.getElementById("modal-container");
  if (modalContainer) {
    modalContainer.innerHTML = modalHTML;
  } else {
    const container = document.createElement("div");
    container.id = "modal-container";
    container.innerHTML = modalHTML;
    document.body.appendChild(container);
  }

  // Показываем модальное окно
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Обработчик подтверждения удаления
    document
      .getElementById(`confirm-delete-${order.id}`)
      .addEventListener("click", async function () {
        this.disabled = true;
        this.innerHTML =
          '<span class="spinner-border spinner-border-sm me-2"></span> Удаление...';

        try {
          const result = await deleteOrder(order.id);

          if (result.success) {
            showNotification(result.message, "success");
            modal.hide();

            // Обновляем список заказов
            setTimeout(() => {
              loadOrders();
            }, 500);
          } else {
            throw new Error(result.error || "Не удалось удалить заказ");
          }
        } catch (error) {
          console.error("Ошибка при удалении заказа:", error);
          showNotification(`Ошибка: ${error.message}`, "error");
          this.disabled = false;
          this.innerHTML = "Удалить заказ";
        }
      });

    // Удаляем модальное окно после закрытия
    modalElement.addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
  }
}

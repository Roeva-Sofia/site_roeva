// Логика заказа (выбор блюд, подсчет стоимости)

let currentOrder;

function initializeCurrentOrder() {
  console.log("Инициализация currentOrder");

  // Проверяем, есть ли уже инициализированный объект
  if (!window._currentOrderInitialized) {
    currentOrder = {
      soup: null,
      mainCourse: null,
      salad: null,
      drink: null,
      dessert: null,
      total: 0,
    };
    window._currentOrderInitialized = true;
  }

  // Загружаем данные из localStorage
  initOrderFromStorage();

  return currentOrder;
}

if (typeof window !== "undefined") {
  // Если мы в браузере, инициализируем
  setTimeout(() => {
    initializeCurrentOrder();
  }, 0);
}

// Инициализация заказа из localStorage
function initOrderFromStorage() {
  console.log("Инициализация заказа из localStorage...");

  // Сначала инициализируем currentOrder, если он еще не инициализирован
  if (!currentOrder) {
    currentOrder = {
      soup: null,
      mainCourse: null,
      salad: null,
      drink: null,
      dessert: null,
      total: 0,
    };
  }

  const savedOrder = localStorage.getItem("foodconstruct_current_order");
  console.log("Сырые данные из localStorage:", savedOrder);

  if (savedOrder) {
    try {
      const parsedOrder = JSON.parse(savedOrder);
      console.log("Парсинг заказа:", parsedOrder);

      // Обновляем currentOrder данными из localStorage
      currentOrder.soup = parsedOrder.soup || null;
      currentOrder.mainCourse = parsedOrder.mainCourse || null;
      currentOrder.salad = parsedOrder.salad || null;
      currentOrder.drink = parsedOrder.drink || null;
      currentOrder.dessert = parsedOrder.dessert || null;
      currentOrder.total = parsedOrder.total || 0;

      console.log("Текущий заказ после восстановления:", currentOrder);

      // Обновляем отображение только если есть элементы на странице
      if (document.getElementById("order-summary")) {
        updateOrderSummary();
        updateAddButtons();
        updateOrderButton();
      }
    } catch (error) {
      console.error("Ошибка парсинга заказа:", error);
    }
  } else {
    console.log("В localStorage нет сохраненного заказа");
  }
}

// Улучшенная функция saveOrderToStorage:
function saveOrderToStorage() {
  if (!currentOrder) {
    console.warn("Попытка сохранить неинициализированный заказ");
    return false;
  }

  console.log("Сохранение заказа в localStorage:", currentOrder);

  const orderToSave = {
    soup: currentOrder.soup,
    mainCourse: currentOrder.mainCourse,
    salad: currentOrder.salad,
    drink: currentOrder.drink,
    dessert: currentOrder.dessert,
    total: currentOrder.total || 0,
  };

  console.log("Заказ для сохранения:", orderToSave);

  const success = saveToStorage("foodconstruct_current_order", orderToSave);
  if (success) {
    console.log("Заказ успешно сохранен в localStorage");
    return true;
  } else {
    console.error("Не удалось сохранить заказ в localStorage");
    return false;
  }
}

// Сохранение заказа в localStorage
function saveOrderToStorage() {
  localStorage.setItem(
    "foodconstruct_current_order",
    JSON.stringify(currentOrder)
  );
}

// Добавление блюда в заказ
function addDishToOrder(
  dishId,
  dishKeyword,
  category,
  name,
  price,
  image,
  count
) {
  console.log(
    `Добавление блюда: ${name}, категория: ${category}, цена: ${price}`
  );

  // Нормализуем ключ категории для использования в объекте
  const normalizedCategory = normalizeCategoryKey(category);
  console.log(`Нормализованная категория: ${normalizedCategory}`);

  // Получаем информацию о блюде
  const dishInfo = {
    id: dishId,
    keyword: dishKeyword,
    name: name,
    price: price,
    category: category, // Оригинальная категория из API
    image: image || "images/placeholder.jpg",
    count: count || "250 г",
  };

  // Добавляем в заказ (используем нормализованный ключ)
  currentOrder[normalizedCategory] = dishInfo;
  console.log(`Блюдо добавлено в категорию ${normalizedCategory}:`, dishInfo);

  // Пересчитываем общую стоимость
  const newTotal = calculateTotal();
  console.log(`Новая общая стоимость: ${newTotal}`);

  // Обновляем отображение
  updateOrderSummary();
  updateAddButtons();
  updateOrderButton();

  // Сохраняем в localStorage
  saveOrderToStorage();

  // Показываем уведомление
  showNotification(`Добавлено: ${name}`, "success");

  return true;
}

// Удаление блюда из заказа
function removeDishFromOrder(category) {
  // category уже нормализован (ключ объекта)
  if (currentOrder[category]) {
    const removedName = currentOrder[category].name;
    currentOrder[category] = null;

    // Пересчитываем общую стоимость
    calculateTotal();

    // Обновляем отображение
    updateOrderSummary();
    updateAddButtons();
    updateOrderButton();

    // Сохраняем в localStorage
    saveOrderToStorage();

    // Показываем уведомление
    showNotification(`Удалено: ${removedName}`, "info");

    return true;
  }
  return false;
}

// Подсчет общей стоимости
function calculateTotal() {
  let total = 0;

  Object.values(currentOrder).forEach((item) => {
    if (item && item.price) {
      total += item.price;
    }
  });

  currentOrder.total = total;
  return total;
}

// Обновление сводки заказа
function updateOrderSummary() {
  const orderSummary = document.getElementById("order-summary");
  const orderTotal = document.getElementById("order-total");
  const totalPrice = document.getElementById("total-price");

  if (!orderSummary) return;

  // Очищаем сводку
  orderSummary.innerHTML = "";

  // Категории в правильном порядке с нормализованными ключами
  const categories = [
    { key: "soup", name: "Суп", notSelectedText: "Супы не выбраны" },
    {
      key: "mainCourse",
      name: "Главное блюдо",
      notSelectedText: "Главное блюдо не выбрано",
    },
    { key: "salad", name: "Салат/Стартер", notSelectedText: "Салат не выбран" },
    { key: "drink", name: "Напиток", notSelectedText: "Напиток не выбран" },
    { key: "dessert", name: "Десерт", notSelectedText: "Десерт не выбран" },
  ];

  // Добавляем каждый пункт
  categories.forEach((category) => {
    const dish = currentOrder[category.key];

    const itemDiv = document.createElement("div");
    itemDiv.className = "order-item";

    if (dish) {
      itemDiv.innerHTML = `
                <div>
                    <div class="order-item-name">${category.name}: ${
        dish.name
      }</div>
                    <small class="text-muted">${formatPrice(dish.price)}</small>
                </div>
                <button class="order-item-remove" data-category="${
                  category.key
                }">
                    <i class="bi bi-x-circle"></i>
                </button>
            `;
    } else {
      itemDiv.innerHTML = `
                <div>
                    <div class="order-item-name text-muted">${category.name}</div>
                    <small>${category.notSelectedText}</small>
                </div>
            `;
    }

    orderSummary.appendChild(itemDiv);
  });

  // Обновляем общую стоимость
  if (currentOrder.total > 0) {
    orderTotal.classList.remove("d-none");
    totalPrice.textContent = formatPrice(currentOrder.total);
  } else {
    orderTotal.classList.add("d-none");
  }

  // Добавляем обработчики для кнопок удаления
  document.querySelectorAll(".order-item-remove").forEach((button) => {
    button.addEventListener("click", function () {
      const category = this.dataset.category;
      removeDishFromOrder(category);
    });
  });
}

// Обновление состояния кнопок "Добавить"
function updateAddButtons() {
  const addButtons = document.querySelectorAll(".btn-add");

  addButtons.forEach((button) => {
    const dishId = button.dataset.dishId;
    const dishKeyword = button.dataset.dishKeyword;
    const dishCategory = button.dataset.category; // Получаем категорию из data-атрибута

    // Нормализуем категорию для сравнения
    const normalizedCategory = normalizeCategoryKey(dishCategory);

    // Проверяем, выбрано ли это блюдо
    if (
      currentOrder[normalizedCategory] &&
      currentOrder[normalizedCategory].id == dishId
    ) {
      button.textContent = "В заказе";
      button.classList.add("btn-added");
      button.disabled = true;

      // Добавляем класс selected к карточке
      const dishCard = button.closest(".dish-card");
      if (dishCard) {
        dishCard.classList.add("selected");
      }
    } else {
      button.textContent = "Добавить";
      button.classList.remove("btn-added");
      button.disabled = false;

      // Убираем класс selected
      const dishCard = button.closest(".dish-card");
      if (dishCard) {
        dishCard.classList.remove("selected");
      }
    }

    // Добавляем обработчик клика
    button.onclick = function () {
      const dishCard = this.closest(".dish-card");
      const dishName = dishCard.querySelector(".card-title").textContent;
      const dishPrice = parseInt(
        dishCard.querySelector(".price").textContent.replace(/\D/g, "")
      );
      const dishImage = dishCard.querySelector("img").src;
      const dishCount =
        dishCard
          .querySelector(".card-text")
          .textContent.split("•")[1]
          ?.trim() || "250 г";

      addDishToOrder(
        dishId,
        dishKeyword,
        dishCategory,
        dishName,
        dishPrice,
        dishImage,
        dishCount
      );
    };
  });
}

// Обновление состояния кнопки оформления заказа
function updateOrderButton() {
  const proceedButton = document.getElementById("proceed-to-order");
  if (!proceedButton) return;

  if (validateOrderCombo()) {
    proceedButton.disabled = false;
    proceedButton.innerHTML =
      'Перейти к оформлению <i class="bi bi-arrow-right ms-2"></i>';
  } else {
    proceedButton.disabled = true;
    proceedButton.innerHTML = "Выберите комбо";
  }
}

// Очистка заказа
function clearOrder() {
  currentOrder = {
    soup: null,
    mainCourse: null,
    salad: null,
    drink: null,
    dessert: null,
    total: 0,
  };

  updateOrderSummary();
  updateAddButtons();
  updateOrderButton();
  saveOrderToStorage();

  showNotification("Заказ очищен", "info");
}

// Получение текущего заказа
function getCurrentOrder() {
  if (!currentOrder) {
    console.log("currentOrder не инициализирован, инициализируем...");
    initializeCurrentOrder();
  }
  return { ...currentOrder };
}

// Получение списка выбранных блюд
function getSelectedDishes() {
  if (!currentOrder) {
    console.log("currentOrder не инициализирован, инициализируем...");
    initializeCurrentOrder();
  }

  console.log("Получение выбранных блюд из currentOrder:", currentOrder);

  const dishes = [];

  Object.entries(currentOrder).forEach(([categoryKey, dish]) => {
    console.log(`Проверяем категорию "${categoryKey}":`, dish);

    if (dish && categoryKey !== "total") {
      dishes.push({
        category: dish.category || getOriginalCategory(categoryKey),
        id: dish.id,
        keyword: dish.keyword,
        name: dish.name,
        price: dish.price,
        image: dish.image || "images/placeholder.jpg",
        count: dish.count || "250 г",
      });
    }
  });

  console.log("Все выбранные блюда:", dishes);
  return dishes;
}

function getOriginalCategory(normalizedCategory) {
  if (normalizedCategory === "mainCourse") {
    return "main-course";
  }
  return normalizedCategory;
}

window.forceOrderInit = function () {
  console.log("Принудительная инициализация заказа");
  initializeCurrentOrder();
  return getCurrentOrder();
};

// В конец файла order.js добавьте:

// Сброс текущего заказа (очистка localStorage для нового заказа)
function resetCurrentOrder() {
  console.log("Сброс текущего заказа...");

  // Сбрасываем объект заказа
  if (currentOrder) {
    currentOrder.soup = null;
    currentOrder.mainCourse = null;
    currentOrder.salad = null;
    currentOrder.drink = null;
    currentOrder.dessert = null;
    currentOrder.total = 0;
  } else {
    currentOrder = {
      soup: null,
      mainCourse: null,
      salad: null,
      drink: null,
      dessert: null,
      total: 0,
    };
  }

  // Удаляем только текущий заказ из localStorage
  localStorage.removeItem("foodconstruct_current_order");

  console.log("Текущий заказ сброшен, можно начинать новый");

  // Обновляем UI, если мы на странице сбора ланча
  if (document.getElementById("order-summary")) {
    updateAddButtons();
    updateOrderButton();

    // Показываем уведомление, если на странице сборки ланча
    if (window.location.pathname.includes("assemble-lunch")) {
      showNotification(
        "Готово к сборке нового заказа! Выберите блюда.",
        "info"
      );
    }
  }

  return true;
}

const currentPage = window.location.pathname.split("/").pop();
if (currentPage === "assemble-lunch.html" || currentPage === "assemble-lunch") {
  const lastOrderTime = localStorage.getItem("last_order_time");
  const currentTime = Date.now();
  const ONE_HOUR = 60 * 60 * 1000; // 1 час

  // Если с последнего заказа прошло больше часа, очищаем
  if (lastOrderTime && currentTime - parseInt(lastOrderTime) > ONE_HOUR) {
    console.log("Прошло более часа с последнего заказа, очищаем...");
    resetCurrentOrder();
  }
}

// Экспорт функций
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    initializeCurrentOrder,
    getCurrentOrder,
    getSelectedDishes,
    addDishToOrder,
    removeDishFromOrder,
    clearOrder,
    saveOrderToStorage,
    initOrderFromStorage,
    resetCurrentOrder,
  };
}

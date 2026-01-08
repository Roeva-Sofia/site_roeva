// Валидация заказа и проверка комбо

// Проверка соответствия заказа одному из доступных комбо
function validateOrderCombo() {
  const selectedDishes = getSelectedDishes();

  // Получаем категории выбранных блюд (без десерта, так как он опционален)
  const selectedCategories = selectedDishes
    .filter((dish) => dish.category !== "dessert")
    .map((dish) => dish.category);

  console.log("Выбранные категории:", selectedCategories);
  console.log("Доступные комбо:", API_CONFIG.AVAILABLE_COMBOS);

  // Проверяем, соответствует ли выбранный набор одному из комбо
  const isValidCombo = API_CONFIG.AVAILABLE_COMBOS.some((combo) => {
    // Комбо должен содержать все выбранные категории
    if (combo.length !== selectedCategories.length) return false;

    // Каждая категория в комбо должна быть выбрана
    return combo.every((category) => selectedCategories.includes(category));
  });

  // Дополнительная проверка: напиток обязателен
  const hasDrink = selectedDishes.some((dish) => dish.category === "drink");

  console.log("isValidCombo:", isValidCombo, "hasDrink:", hasDrink);

  return isValidCombo && hasDrink;
}

// Проверка полной формы заказа
function validateOrderForm(formData) {
  const errors = [];

  // Проверка обязательных полей
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
  if (formData.delivery_type === "by_time" && !formData.delivery_time) {
    errors.push("Укажите время доставки");
  }

  if (formData.delivery_type === "by_time" && formData.delivery_time) {
    const deliveryTime = parseTime(formData.delivery_time);
    if (!isValidDeliveryTime(deliveryTime)) {
      errors.push("Время доставки должно быть с 7:00 до 23:00");
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

// Парсинг времени
function parseTime(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return { hours, minutes };
}

// Проверка времени доставки
function isValidDeliveryTime(time) {
  // Проверяем, что время в пределах 7:00 - 23:00
  const totalMinutes = time.hours * 60 + time.minutes;
  const minMinutes = 7 * 60; // 7:00
  const maxMinutes = 23 * 60; // 23:00

  return totalMinutes >= minMinutes && totalMinutes <= maxMinutes;
}

// Получение текста уведомления в зависимости от выбранных блюд
function getNotificationText() {
  const selectedDishes = getSelectedDishes();
  const selectedCategories = selectedDishes.map((dish) => dish.category);

  // Проверяем разные сценарии
  if (selectedDishes.length === 0) {
    return {
      text: "Ничего не выбрано. Выберите блюда для заказа",
      type: "warning",
    };
  }

  // Проверяем наличие напитка
  const hasDrink = selectedCategories.includes("drink");
  if (!hasDrink) {
    return {
      text: "Выберите напиток",
      type: "warning",
    };
  }

  // Проверяем разные комбинации
  const hasSoup = selectedCategories.includes("soup");
  const hasMain = selectedCategories.includes("main-course");
  const hasSalad = selectedCategories.includes("salad");

  if (hasSoup && !hasMain && !hasSalad) {
    return {
      text: "Выберите главное блюдо или салат/стартер",
      type: "warning",
    };
  }

  if (!hasSoup && !hasMain && hasSalad) {
    return {
      text: "Выберите суп или главное блюдо",
      type: "warning",
    };
  }

  if (!hasSoup && !hasMain && !hasSalad) {
    return {
      text: "Выберите главное блюдо",
      type: "warning",
    };
  }

  // Проверяем полное соответствие комбо
  if (!validateOrderCombo()) {
    return {
      text: "Выбранные блюда не соответствуют ни одному доступному комбо",
      type: "warning",
    };
  }

  return {
    text: "Заказ готов к оформлению",
    type: "success",
  };
}

// Создание модального окна уведомления
function createNotificationModal(title, message, type = "info") {
  // Создаем модальное окно
  const modalId = "notification-modal-" + Date.now();

  const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center py-4">
                        <div class="mb-3">
                            ${
                              type === "success"
                                ? '<i class="bi bi-check-circle display-4 text-success"></i>'
                                : ""
                            }
                            ${
                              type === "error"
                                ? '<i class="bi bi-x-circle display-4 text-danger"></i>'
                                : ""
                            }
                            ${
                              type === "warning"
                                ? '<i class="bi bi-exclamation-triangle display-4 text-warning"></i>'
                                : ""
                            }
                            ${
                              type === "info"
                                ? '<i class="bi bi-info-circle display-4 text-primary"></i>'
                                : ""
                            }
                        </div>
                        <p class="lead">${message}</p>
                    </div>
                    <div class="modal-footer border-0 justify-content-center">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Окей</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Добавляем модальное окно в DOM
  const modalContainer =
    document.getElementById("modal-container") || createModalContainer();
  modalContainer.innerHTML = modalHTML;

  // Показываем модальное окно
  const modal = new bootstrap.Modal(document.getElementById(modalId));
  modal.show();

  return modal;
}

// Создание контейнера для модальных окон
function createModalContainer() {
  const container = document.createElement("div");
  container.id = "modal-container";
  document.body.appendChild(container);
  return container;
}

function showValidationNotification(validationResult) {
  if (!validationResult.isValid) {
    const message = validationResult.errors.join("<br>");
    createNotificationModal("Ошибка при заполнении формы", message, "error");
    return false;
  }
  return true;
}

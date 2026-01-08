// Уведомления и модальные окна (ЛР6, ЛР9)

// Показ всплывающего уведомления
function showNotification(message, type = "info", duration = 5000) {
  // Проверяем, есть ли уже контейнер для уведомлений
  let container = document.getElementById("notifications-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notifications-container";
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.right = "20px";
    container.style.zIndex = "9999";
    document.body.appendChild(container);
  }

  // Создаем уведомление
  const notification = document.createElement("div");
  notification.className = `alert alert-${getAlertType(
    type
  )} alert-dismissible fade show`;
  notification.style.minWidth = "300px";
  notification.style.marginBottom = "10px";
  notification.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";

  // Иконка в зависимости от типа
  const icon = getNotificationIcon(type);

  notification.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="me-3" style="font-size: 1.5rem;">
                ${icon}
            </div>
            <div class="flex-grow-1">
                ${message}
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

  container.appendChild(notification);

  // Автоматическое удаление
  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, duration);
  }

  return notification;
}

// Получение типа alert для Bootstrap
function getAlertType(type) {
  const types = {
    success: "success",
    error: "danger",
    warning: "warning",
    info: "info",
  };
  return types[type] || "info";
}

// Получение иконки для уведомления
function getNotificationIcon(type) {
  const icons = {
    success: '<i class="bi bi-check-circle-fill text-success"></i>',
    error: '<i class="bi bi-x-circle-fill text-danger"></i>',
    warning: '<i class="bi bi-exclamation-triangle-fill text-warning"></i>',
    info: '<i class="bi bi-info-circle-fill text-primary"></i>',
  };
  return icons[type] || '<i class="bi bi-info-circle-fill text-primary"></i>';
}

// Создание модального окна подтверждения
function createConfirmationModal(
  title,
  message,
  type = "warning",
  onConfirm,
  onCancel = null
) {
  const modalId = "confirmation-modal-" + Date.now();

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
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Отмена
                        </button>
                        <button type="button" class="btn btn-${getAlertType(
                          type
                        )}" id="confirm-button">
                            Подтвердить
                        </button>
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
  const modalElement = document.getElementById(modalId);
  const modal = new bootstrap.Modal(modalElement);
  modal.show();

  // Обработчик подтверждения
  document
    .getElementById("confirm-button")
    .addEventListener("click", function () {
      if (typeof onConfirm === "function") {
        onConfirm();
      }
      modal.hide();
    });

  // Обработчик отмены
  modalElement.addEventListener("hidden.bs.modal", function () {
    if (typeof onCancel === "function") {
      onCancel();
    }
    modalElement.remove();
  });

  return modal;
}

// Создание модального окна с информацией о заказе
function showOrderInfoModal(order) {
  const modalId = "order-info-modal-" + Date.now();

  // Форматирование даты
  const orderDate = new Date(order.created_at || Date.now());
  const formattedDate = orderDate.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Получаем информацию о блюдах
  let dishesHtml = "";
  if (order.dishes && order.dishes.length > 0) {
    dishesHtml = order.dishes
      .map((dish) => `<li>${dish.name} - ${formatPrice(dish.price)}</li>`)
      .join("");
  } else {
    dishesHtml = "<li>Информация о блюдах недоступна</li>";
  }

  const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header border-0 bg-primary text-white">
                        <h5 class="modal-title">Информация о заказе №${
                          order.id || "--"
                        }</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="mb-3">Данные о заказе</h6>
                                <table class="table table-sm">
                                    <tr>
                                        <td><strong>Дата оформления:</strong></td>
                                        <td>${formattedDate}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Стоимость:</strong></td>
                                        <td>${formatPrice(
                                          order.total || 0
                                        )}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Тип доставки:</strong></td>
                                        <td>${
                                          order.delivery_type === "by_time"
                                            ? "Ко времени"
                                            : "Как можно скорее"
                                        }</td>
                                    </tr>
                                    ${
                                      order.delivery_time
                                        ? `
                                    <tr>
                                        <td><strong>Время доставки:</strong></td>
                                        <td>${order.delivery_time}</td>
                                    </tr>
                                    `
                                        : ""
                                    }
                                </table>
                            </div>
                            <div class="col-md-6">
                                <h6 class="mb-3">Данные получателя</h6>
                                <table class="table table-sm">
                                    <tr>
                                        <td><strong>Имя:</strong></td>
                                        <td>${
                                          order.full_name || "Не указано"
                                        }</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Телефон:</strong></td>
                                        <td>${order.phone || "Не указан"}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Email:</strong></td>
                                        <td>${order.email || "Не указан"}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Адрес:</strong></td>
                                        <td>${
                                          order.delivery_address || "Не указан"
                                        }</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                        
                        <div class="mt-4">
                            <h6 class="mb-3">Состав заказа</h6>
                            <ul class="list-group">
                                ${dishesHtml}
                            </ul>
                        </div>
                        
                        ${
                          order.comment
                            ? `
                        <div class="mt-4">
                            <h6 class="mb-3">Комментарий</h6>
                            <div class="alert alert-light">
                                ${order.comment}
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
  container.setAttribute("aria-live", "polite");
  container.setAttribute("aria-atomic", "true");
  document.body.appendChild(container);
  return container;
}

// Показать уведомление о несоответствии комбо
function showComboNotification() {
  const notificationInfo = getNotificationText();

  if (notificationInfo.type !== "success") {
    createNotificationModal(
      "Проверьте заказ",
      notificationInfo.text,
      notificationInfo.type
    );
    return false;
  }

  return true;
}

// Универсальная функция для показа уведомлений о валидации
function showValidationNotification(validationResult) {
  if (!validationResult.isValid) {
    const message = validationResult.errors.join("<br>");
    createNotificationModal("Ошибка при заполнении формы", message, "error");
    return false;
  }
  return true;
}

function showSuccessModal(order) {
  console.log("showSuccessModal вызвана с order:", order);

  const modalId = "success-modal-" + Date.now();

  const modalHTML = `
    <div class="modal fade" id="${modalId}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0 bg-success text-white">
            <h5 class="modal-title">Заказ успешно оформлен!</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center py-4">
            <div class="mb-3">
              <i class="bi bi-check-circle display-1 text-success"></i>
            </div>
            <h4 class="text-success mb-3">Спасибо за заказ!</h4>
            <p>Ваш заказ <strong>№${
              order.id || "--"
            }</strong> успешно оформлен.</p>
            <p class="mb-0">Ожидайте доставку в указанное время.</p>
            
            <div class="alert alert-info mt-4">
              <h6 class="alert-heading mb-2">Детали заказа:</h6>
              <p class="mb-1"><strong>Сумма:</strong> ${formatPrice(
                order.total || 0
              )}</p>
              <p class="mb-1"><strong>Адрес доставки:</strong> ${
                order.delivery_address || "Не указан"
              }</p>
              ${
                order.delivery_type === "by_time" && order.delivery_time
                  ? `<p class="mb-0"><strong>Время доставки:</strong> ${order.delivery_time}</p>`
                  : ""
              }
            </div>
          </div>
          <div class="modal-footer border-0 justify-content-center">
            <a href="assemble-lunch.html" class="btn btn-primary" id="new-order-btn">
              <i class="bi bi-plus-circle me-2"></i> Собрать новый заказ
            </a>
            <a href="orders.html" class="btn btn-outline-primary">
              <i class="bi bi-list-check me-2"></i> К моим заказам
            </a>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              На главную
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Создаем или получаем контейнер для модальных окон
  let modalContainer = document.getElementById("modal-container");
  if (!modalContainer) {
    modalContainer = document.createElement("div");
    modalContainer.id = "modal-container";
    modalContainer.setAttribute("aria-live", "polite");
    modalContainer.setAttribute("aria-atomic", "true");
    document.body.appendChild(modalContainer);
  }

  // Добавляем модальное окно в DOM
  modalContainer.innerHTML = modalHTML;

  // Показываем модальное окно
  const modalElement = document.getElementById(modalId);
  if (!modalElement) {
    console.error("Модальное окно не найдено в DOM!");
    return null;
  }

  const modal = new bootstrap.Modal(modalElement);
  modal.show();

  console.log("Модальное окно успешно показано");

  // Обработчик для кнопки "Новый заказ"
  const newOrderBtn = document.getElementById("new-order-btn");
  if (newOrderBtn) {
    newOrderBtn.addEventListener("click", function (e) {
      e.preventDefault();
      // Сбрасываем заказ перед переходом
      if (typeof resetCurrentOrder === "function") {
        resetCurrentOrder();
      } else if (typeof clearOrder === "function") {
        clearOrder();
      }
      window.location.href = "assemble-lunch.html";
    });
  }

  // При закрытии модального окна перенаправляем на главную
  modalElement.addEventListener("hidden.bs.modal", function () {
    console.log("Модальное окно закрыто, перенаправляем на главную");
    // Удаляем модальное окно из DOM
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }

    // Перенаправляем на главную только если пользователь нажал "На главную"
    if (this.dataset.redirect !== "false") {
      setTimeout(() => {
        window.location.href = "index.html";
      }, 100);
    }
  });

  return modal;
}

// Экспорт функций
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    showNotification,
    createConfirmationModal,
    showOrderInfoModal,
    showComboNotification,
    showValidationNotification,
    showSuccessModal,
  };
}

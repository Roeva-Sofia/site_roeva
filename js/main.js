// Основной файл инициализации
document.addEventListener("DOMContentLoaded", function () {
  console.log("Food Construct инициализирован");

  // Инициализация навигации
  initNavigation();

  // Инициализация форм
  initForms();

  // Проверяем API ключ
  if (!getApiKey()) {
    console.warn(
      "API ключ не установлен. Некоторые функции могут не работать."
    );
  }
});

// Инициализация навигации
function initNavigation() {
  // Подсветка активной ссылки
  const currentPage = window.location.pathname.split("/").pop();
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (
      href === currentPage ||
      (currentPage === "" && href === "index.html") ||
      (currentPage === "index.html" && href === "index.html")
    ) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }

    // Якорные ссылки для контактов
    if (href === "#contacts") {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const contactsSection = document.getElementById("contacts");
        if (contactsSection) {
          contactsSection.scrollIntoView({ behavior: "smooth" });
        }
      });
    }
  });
}

// Инициализация форм
function initForms() {
  // Форма обратной связи
  const feedbackForm = document.getElementById("feedback-form");
  if (feedbackForm) {
    feedbackForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Валидация
      const name = this.querySelector('input[type="text"]').value;
      const email = this.querySelector('input[type="email"]').value;
      const message = this.querySelector("textarea").value;

      if (!name || !email || !message) {
        showNotification("Заполните все поля формы", "error");
        return;
      }

      // Отправка на тестовый сервер
      const formData = new FormData(this);
      fetch("https://httpbin.org/post", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          showNotification("Сообщение отправлено успешно!", "success");
          this.reset();

          // Очищаем форму заказа, если это форма заказа
          if (this.id === "order-form") {
            if (typeof clearAfterSuccessfulOrder === "function") {
              clearAfterSuccessfulOrder();
            } else if (typeof resetCurrentOrder === "function") {
              resetCurrentOrder();
            }
          }
        })
        .catch((error) => {
          showNotification("Ошибка при отправке формы", "error");
          console.error("Error:", error);
        });
    });
  }
}

// Функция показа уведомлений
function showNotification(message, type = "info") {
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
  notification.className = `alert alert-${type} alert-dismissible fade show`;
  notification.style.minWidth = "300px";
  notification.style.marginBottom = "10px";
  notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

  container.appendChild(notification);

  // Автоматическое удаление через 5 секунд
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Вспомогательная функция для форматирования цены
function formatPrice(price) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
  }).format(price);
}

// Вспомогательная функция для получения параметров URL
function getUrlParams() {
  const params = {};
  window.location.search
    .substring(1)
    .split("&")
    .forEach((param) => {
      const [key, value] = param.split("=");
      if (key) {
        params[key] = decodeURIComponent(value || "");
      }
    });
  return params;
}

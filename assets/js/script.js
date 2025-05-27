// =============================================
// FUNCIONALIDAD PRINCIPAL
// =============================================

document.addEventListener("DOMContentLoaded", function () {
  // Inicializar todas las funcionalidades
  inicializarFiltros();
  inicializarTestimonios();
  inicializarLogin();
  inicializarGraficas();
  //cargarDatos();

});


// =============================================
// FILTRADO DE MASCOTAS
// =============================================

function inicializarFiltros() {
  const filtroEspecie = document.getElementById("especie");
  const filtroEdad = document.getElementById("edad");

  if (filtroEspecie && filtroEdad) {
    filtroEspecie.addEventListener("change", filtrarMascotas);
    filtroEdad.addEventListener("change", filtrarMascotas);
  }
}

function filtrarMascotas() {
  const especie = document.getElementById("especie").value;
  const edad = document.getElementById("edad").value;
  const mascotas = document.querySelectorAll(".mascota");

  mascotas.forEach((mascota) => {
    const mascotaEspecie = mascota.getAttribute("data-especie");
    const mascotaEdad = mascota.getAttribute("data-edad");

    const coincideEspecie = especie === "todas" || especie === mascotaEspecie;
    const coincideEdad = edad === "todas" || edad === mascotaEdad;

    mascota.style.display = coincideEspecie && coincideEdad ? "block" : "none";
  });
}

// =============================================
// SISTEMA DE TESTIMONIOS
// =============================================

function inicializarTestimonios() {
  // Valoración con estrellas
  document.querySelectorAll(".estrella").forEach((estrella) => {
    estrella.addEventListener("click", function () {
      const valor = this.getAttribute("data-value");
      const testimonioId = this.closest(".testimonio").getAttribute("data-id");
      guardarValoracion(testimonioId, valor);
      resaltarEstrellas(testimonioId, valor);
    });
  });

  // Sistema de respuestas
  document.querySelectorAll(".btn-respuesta").forEach((boton) => {
    boton.addEventListener("click", function () {
      const formulario = this.nextElementSibling.nextElementSibling;
      formulario.style.display = "block";
    });
  });

  document.querySelectorAll(".form-respuesta").forEach((formulario) => {
    formulario.addEventListener("submit", function (e) {
      e.preventDefault();
      const respuesta = this.querySelector("textarea").value;
      const testimonioId = this.closest(".testimonio").getAttribute("data-id");

      if (respuesta.trim()) {
        guardarRespuesta(testimonioId, respuesta);
        this.style.display = "none";
        this.querySelector("textarea").value = "";
        mostrarRespuestas(testimonioId);
      }
    });
  });

  // Eliminar comentarios
  document.querySelectorAll(".btn-eliminar").forEach((boton) => {
    boton.addEventListener("click", function () {
      const testimonioId = this.closest(".testimonio").getAttribute("data-id");
      eliminarComentario(testimonioId);
    });
  });

  // Restablecer estrellas
  document.querySelectorAll(".btn-restablecer").forEach((boton) => {
    boton.addEventListener("click", function () {
      const testimonioId = this.closest(".testimonio").getAttribute("data-id");
      restablecerEstrellas(testimonioId);
    });
  });
}

// =============================================
// GRÁFICAS ESTADÍSTICAS
// =============================================

function inicializarGraficas() {
  // Solo inicializar si estamos en la página de estadísticas
  if (!document.getElementById("graficaBarras")) return;

  // Configuración responsive para gráficas
  window.charts = [];
  const opcionesComunes = {
    responsive: true,
    maintainAspectRatio: false,
  };

  // Gráfica de barras (adopciones mensuales)
  const ctxBarras = document.getElementById("graficaBarras").getContext("2d");
  window.charts.push(
    new Chart(ctxBarras, {
      type: "bar",
      data: {
        labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
        datasets: [
          {
            label: "Adopciones",
            data: [45, 60, 75, 80, 90, 110],
            backgroundColor: "#ff6f61",
            borderColor: "#cc2e25",
            borderWidth: 1,
          },
        ],
      },
      options: opcionesComunes,
    })
  );

  // Gráfica de pastel (tipos de mascotas)
  const ctxPastel = document.getElementById("graficaPastel").getContext("2d");
  window.charts.push(
    new Chart(ctxPastel, {
      type: "pie",
      data: {
        labels: ["Perros", "Gatos", "Aves", "Otros"],
        datasets: [
          {
            data: [65, 25, 5, 5],
            backgroundColor: ["#ff6f61", "#ffcc00", "#00ccff", "#cc2e25"],
            borderWidth: 1,
          },
        ],
      },
      options: opcionesComunes,
    })
  );

  // Gráfica de líneas (evolución anual)
  const ctxLineas = document.getElementById("graficaLineas").getContext("2d");
  window.charts.push(
    new Chart(ctxLineas, {
      type: "line",
      data: {
        labels: ["2019", "2020", "2021", "2022", "2023"],
        datasets: [
          {
            label: "Adopciones anuales",
            data: [200, 350, 400, 550, 700],
            borderColor: "#ff6f61",
            borderWidth: 2,
            fill: false,
          },
        ],
      },
      options: opcionesComunes,
    })
  );

  // Manejar redimensionamiento
  window.addEventListener("resize", debounce(resizeCharts, 200));
}

function resizeCharts() {
  window.charts?.forEach((chart) => chart.resize());
}

function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this,
      args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// =============================================
// INICIO DE SESIÓN
// =============================================
// ==================== INICIALIZACIÓN DE FORMULARIOS ====================

function inicializarLogin() {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");

  // Configurar botón de cerrar sesión
  if (logoutBtn) {
    logoutBtn.addEventListener("click", cerrarSesion);
  }

  // Manejo de registro
  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const errorMessage = document.getElementById("errorMessage");
      const termsChecked = document.getElementById("terms").checked;

      // Validaciones
      if (!termsChecked) {
        errorMessage.textContent = "Debes aceptar los términos y condiciones";
        return;
      }

      if (password !== confirmPassword) {
        errorMessage.textContent = "Las contraseñas no coinciden.";
        return;
      }

      if (password.length < 6) {
        errorMessage.textContent = "La contraseña debe tener al menos 6 caracteres";
        return;
      }

      // Crear FormData para enviar al servidor
      const formData = new FormData(this);

      fetch('../api/auth/registro_usuario.php', {
        method: 'POST',
        body: formData
      })
        .then(response => response.text())
        .then(result => {
          if (result.includes("Usuario registrado correctamente")) {
            // Limpiar mensaje de error
            errorMessage.textContent = '';

            // Redirigir a login
            window.location.href = 'login.html';
          } else {
            // Mostrar mensaje de error del servidor
            errorMessage.textContent = result;
          }
        })
        .catch(error => {
          console.error('Error:', error);
          errorMessage.textContent = 'Ocurrió un error al registrar el usuario';
        });
    });
  }

  // Manejo de login
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const errorMessage = document.getElementById("errorMessage");

      // Obtener todos los usuarios registrados
      const users = JSON.parse(localStorage.getItem("users")) || [];

      // Buscar usuario
      const usuarioRegistrado = users.find(
        (user) => user.email === email && user.password === password
      );

      if (usuarioRegistrado) {
        // Limpiar todos los datos de formularios antes de iniciar sesión
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('formularioAdopcionTemp_') || key.includes('mascotaAdopcion_')) {
            sessionStorage.removeItem(key);
          }
        });

        // Guardar usuario actual
        localStorage.setItem("currentUser", JSON.stringify(usuarioRegistrado));

        // Redirigir
        const redirectTo = sessionStorage.getItem("redirectTo") || "account.html";
        window.location.href = redirectTo;
      } else {
        errorMessage.textContent = "Credenciales incorrectas o usuario no registrado.";
      }
    });
  }

  // Manejar parámetro de redirección
  if (window.location.search.includes("redirect=")) {
    const redirectTo = new URLSearchParams(window.location.search).get("redirect");
    sessionStorage.setItem("redirectTo", redirectTo);
  }
}

function cerrarSesion() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (user) {
    // Limpiar todos los datos del usuario
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes(user.id)) sessionStorage.removeItem(key);
    });
    Object.keys(localStorage).forEach(key => {
      if (key.includes(user.id)) localStorage.removeItem(key);
    });
  }
  // Limpiar datos genéricos y usuario actual
  sessionStorage.removeItem('mascotaAdopcion');
  sessionStorage.removeItem('formularioAdopcionTemp');
  localStorage.removeItem('currentUser');
  window.location.href = "login.html";
}
// Verificar si el usuario esta logueado al cargar la pagina
document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!user) {
        alert('Debes iniciar sesion para acceder a esta pagina');
        window.location.href = 'login.html';
        return;
    }

    // Cargar informacion adicional del usuario desde el servidor
    fetch('../api/users/get_user_info.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Actualizar localStorage con la informacion completa
                const updatedUser = {
                    ...user,
                    ...data.userInfo,
                    adoptanteInfo: data.adoptanteInfo
                };
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));

                // Mostrar informacion del usuario
                document.getElementById('user-name').textContent = updatedUser.name || updatedUser.nombre;
                document.getElementById('user-email').textContent = updatedUser.email;
                document.getElementById('user-phone').textContent = data.adoptanteInfo?.telefono || 'No registrado';
                document.getElementById('user-address').textContent = data.adoptanteInfo?.direccion || 'No registrada';
                document.getElementById('user-age').textContent = data.adoptanteInfo?.edad ? data.adoptanteInfo.edad + ' años' : 'No registrada';
                document.getElementById('user-experience').textContent = data.adoptanteInfo?.experiencia_mascotas || 'No registrada';
                document.getElementById('user-register-date').textContent =
                    updatedUser.fecha_registro ? new Date(updatedUser.fecha_registro).toLocaleDateString() : 'No disponible';

                // Rellenar formulario de edicion
                document.getElementById('edit-name').value = updatedUser.name || updatedUser.nombre;
                document.getElementById('edit-email').value = updatedUser.email;
                document.getElementById('edit-phone').value = data.adoptanteInfo?.telefono || '';
                document.getElementById('edit-address').value = data.adoptanteInfo?.direccion || '';
                document.getElementById('edit-age').value = data.adoptanteInfo?.edad || '';
                document.getElementById('edit-experience').value = data.adoptanteInfo?.experiencia_mascotas || '';
            }
        })
        .catch(error => {
            console.error('Error al cargar informacion del usuario:', error);
            // Mostrar informacion basica si falla la carga
            document.getElementById('user-name').textContent = user.name;
            document.getElementById('user-email').textContent = user.email;
            document.getElementById('user-register-date').textContent =
                user.registerDate ? new Date(user.registerDate).toLocaleDateString() : 'No disponible';

            // Rellenar formulario con informacion basica
            document.getElementById('edit-name').value = user.name;
            document.getElementById('edit-email').value = user.email;
        });
});

function setActive(element) {
    // Remover clase active de todos los elementos
    document.querySelectorAll('.account-menu a').forEach(link => {
        link.classList.remove('active');
    });

    // Agregar clase active al elemento clickeado
    element.classList.add('active');
}

function showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.account-section').forEach(section => {
        section.style.display = 'none';
    });

    // Mostrar la seccion seleccionada
    document.getElementById(sectionId).style.display = 'block';
}

function showEditForm() {
    document.getElementById('edit-user-form').style.display = 'block';
    document.getElementById('current-password').value = '';
}

function hideEditForm() {
    document.getElementById('edit-user-form').style.display = 'none';
}

function logout() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        // Limpiar datos especificos del usuario
        sessionStorage.removeItem(`mascotaAdopcion_${user.id}`);
        sessionStorage.removeItem(`formularioAdopcionTemp_${user.id}`);
        localStorage.removeItem(`lastPetAdoption_${user.id}`);
    }

    // Limpiar datos genericos
    sessionStorage.removeItem('mascotaAdopcion');
    sessionStorage.removeItem('formularioAdopcionTemp');
    localStorage.removeItem('lastPetAdoption');

    // Cerrar sesion en el servidor
    fetch('../api/auth/logout.php', {
        method: 'POST',
        credentials: 'include'
    }).then(() => {
        // Cerrar sesion localmente
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }).catch(() => {
        // Si falla la peticion al servidor, igual cerrar sesion localmente
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });
}

// Manejar el envi­o del formulario de actualizacion
document.getElementById('updateForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;
    const errorMessage = document.getElementById('update-error-message');
    const successMessage = document.getElementById('update-success-message');

    // Limpiar mensajes anteriores
    errorMessage.textContent = '';
    successMessage.textContent = '';

    // Validar nueva contraseña si se proporciona
    if (newPassword) {
        if (newPassword.length < 6) {
            errorMessage.textContent = 'La nueva contraseña debe tener al menos 6 caracteres';
            return;
        }
        if (newPassword !== confirmNewPassword) {
            errorMessage.textContent = 'Las contraseñas nuevas no coinciden';
            return;
        }
    }

    // Preparar datos para enviar
    const updateData = {
        user_id: currentUser.id,
        nombre: document.getElementById('edit-name').value,
        email: document.getElementById('edit-email').value,
        telefono: document.getElementById('edit-phone').value,
        direccion: document.getElementById('edit-address').value,
        edad: document.getElementById('edit-age').value,
        experiencia_mascotas: document.getElementById('edit-experience').value,
        current_password: currentPassword,
        new_password: newPassword
    };

    // Enviar actualizacion al servidor
    fetch('../api/users/update_user.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Actualizar informacion local
                const updatedUser = {
                    ...currentUser,
                    name: updateData.nombre,
                    nombre: updateData.nombre,
                    email: updateData.email,
                    adoptanteInfo: {
                        telefono: updateData.telefono,
                        direccion: updateData.direccion,
                        edad: updateData.edad,
                        experiencia_mascotas: updateData.experiencia_mascotas
                    }
                };

                localStorage.setItem('currentUser', JSON.stringify(updatedUser));

                // Actualizar la visualizacion
                document.getElementById('user-name').textContent = updatedUser.name;
                document.getElementById('user-email').textContent = updatedUser.email;
                document.getElementById('user-phone').textContent = updateData.telefono || 'No registrado';
                document.getElementById('user-address').textContent = updateData.direccion || 'No registrada';
                document.getElementById('user-age').textContent = updateData.edad ? updateData.edad + ' años' : 'No registrada';
                document.getElementById('user-experience').textContent = updateData.experiencia_mascotas || 'No registrada';

                // Limpiar campos de contraseña
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-new-password').value = '';

                successMessage.textContent = 'Informacion actualizada correctamente';

                // Ocultar formulario despues de 1 segundo
                setTimeout(() => {
                    hideEditForm();
                    successMessage.textContent = '';
                }, 1000);
            } else {
                errorMessage.textContent = data.message || 'Error al actualizar la informacion';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorMessage.textContent = 'Error de conexion al actualizar la informacion';
        });
});

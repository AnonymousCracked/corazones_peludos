// Variables globales
let allPets = [];
let selectedPet = null;
let currentPetFilter = 'todas';

// Sistema de notificaciones toast
function showToast(title, message, type = 'success', duration = 5000) {
    const container = document.getElementById('toast-container');

    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Iconos según el tipo
    const icons = {
        success: '🎉',
        error: '❌',
        info: 'ℹ️'
    };

    toast.innerHTML = `
                <div class="toast-icon">${icons[type] || '📢'}</div>
                <div class="toast-content">
                    <div class="toast-title">${title}</div>
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-close" onclick="removeToast(this.parentElement)">×</button>
                <div class="toast-progress"></div>
            `;

    // Agregar al container
    container.appendChild(toast);

    // Mostrar con animación
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Barra de progreso
    const progressBar = toast.querySelector('.toast-progress');
    progressBar.style.width = '100%';
    progressBar.style.transitionDuration = duration + 'ms';

    setTimeout(() => {
        progressBar.style.width = '0%';
    }, 200);

    // Auto remover después del tiempo especificado
    setTimeout(() => {
        removeToast(toast);
    }, duration);

    return toast;
}

function removeToast(toast) {
    if (toast && toast.parentElement) {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }
}

// Verificar si el usuario es adoptante al cargar la página
document.addEventListener('DOMContentLoaded', async function () {
    await checkAdopterStatus();
    loadAdoptionRequests();
});

// Función para verificar si el usuario es adoptante registrado
async function checkAdopterStatus() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            localStorage.setItem('isAdopter', 'false');
            return;
        }

        const response = await fetch('../api/users/check_adopter.php?id=' + currentUser.id, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (response.ok) {
            const result = await response.json();
            localStorage.setItem('isAdopter', result.isAdopter);
            return result.isAdopter;
        } else {
            localStorage.setItem('isAdopter', 'false');
            return false;
        }
    } catch (error) {
        console.error('Error al verificar estado de adoptante:', error);
        localStorage.setItem('isAdopter', 'false');
        return false;
    }
}

// Función para cargar mascotas disponibles
async function loadAvailablePets() {
    try {
        console.log('Cargando mascotas disponibles...');

        const response = await fetch('../api/pets/get_pets.php', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (response.ok) {
            const pets = await response.json();
            allPets = pets;
            displayPets(pets);
        } else {
            console.error('Error al cargar mascotas:', response.status);
            document.getElementById('pets-container').innerHTML = '<p>Error al cargar mascotas disponibles.</p>';
        }
    } catch (error) {
        console.error('Error al cargar mascotas:', error);
        document.getElementById('pets-container').innerHTML = '<p>Error de conexión.</p>';
    }
}

// Función para mostrar las mascotas
function displayPets(pets) {
    const container = document.getElementById('pets-container');

    if (!pets || pets.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No hay mascotas disponibles en este momento.</p>';
        return;
    }

    // Especies comunes (comparar en minusculas)
    const especiesComunes = ['perro', 'gato', 'ave'];

    // Filtrar mascotas segun el filtro actual
    let filteredPets;

    if (currentPetFilter === 'todas') {
        filteredPets = pets;
    } else if (currentPetFilter === 'otro') {
        filteredPets = pets.filter(pet => {
            const especie = pet.especie.toLowerCase();
            return !especiesComunes.includes(especie);
        });
    } else {
        filteredPets = pets.filter(pet => pet.especie.toLowerCase() === currentPetFilter);
    }

    // Filtrar mascotas que estén disponibles
    // Solo mostrar mascotas que:
    // 1. Tengan estado 'disponible'
    // 2. NO tengan solicitudes pendientes (has_pending_request = false)
    filteredPets = filteredPets.filter(pet => {
        return pet.estado === 'disponible' && !pet.has_pending_request;
    });

    if (filteredPets.length === 0) {
        let mensaje = currentPetFilter === 'todas'
            ? 'No hay mascotas disponibles para adopción en este momento.'
            : currentPetFilter === 'otro'
                ? 'No hay mascotas de otros tipos disponibles para adopción en este momento.'
                : `No hay mascotas de tipo "${currentPetFilter}" disponibles para adopción en este momento.`;

        container.innerHTML = `<p style="text-align: center; color: #666; padding: 40px;">${mensaje}</p>`;
        return;
    }

    const petsGrid = document.createElement('div');
    petsGrid.className = 'pets-grid';

    filteredPets.forEach(pet => {
        const petCard = document.createElement('div');
        petCard.className = 'pet-card';
        petCard.onclick = () => selectPet(pet);

        petCard.innerHTML = `
                    <img src="${pet.imagen_ruta}" alt="${pet.nombre}" class="pet-image" onerror="this.src='../img/default-pet.png'">
                    <div class="pet-info">
                        <h4>🐕 ${pet.nombre}</h4>
                        <p><strong>Edad:</strong> ${pet.edad} ${pet.edad === 1 ? 'año' : 'años'}</p>
                        <p><strong>Raza:</strong> ${pet.raza}</p>
                        <p><strong>Sexo:</strong> ${pet.sexo}</p>
                        <p><strong>Salud:</strong> ${pet.estado_salud}</p>
                        <p><strong>Especie:</strong> ${pet.especie}</p>
                                    <p><strong>Estado:</strong> 
                                        <span style="color: ${pet.estado === 'adoptado' ? '#4caf50' : '#2196f3'}; 
                                                     font-weight: bold; text-transform: uppercase; 
                                                     background: ${pet.estado === 'adoptado' ? '#4caf5020' : '#2196f320'}; 
                                                     padding: 4px 8px; border-radius: 4px;">
                                            ${pet.estado}
                                        </span>
                                    </p>
                    </div>
                `;

        petsGrid.appendChild(petCard);
    });

    container.innerHTML = '';
    container.appendChild(petsGrid);
}

// Función para seleccionar una mascota
function selectPet(pet) {
    selectedPet = pet;

    // Actualizar visual de selección
    document.querySelectorAll('.pet-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');

    // Mostrar formulario de adopción
    const formContainer = document.getElementById('adoption-form-container');
    const selectedPetInfo = document.getElementById('selected-pet-info');

    selectedPetInfo.innerHTML = `
                <h4>🎉 Mascota seleccionada: </h4>
                <p>${pet.nombre}</p>
                <p><strong>Especie:</strong> ${pet.especie} | <strong>Raza:</strong> ${pet.raza} | <strong>Edad:</strong> ${pet.edad} años</p>
                <p><strong>Estado de salud:</strong> ${pet.estado_salud}</p>
            `;

    formContainer.style.display = 'block';

    // Scroll hacia el formulario
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Función para filtrar mascotas por especie
function filterPets(especie) {
    currentPetFilter = especie;

    // Actualizar botones
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Mostrar mascotas filtradas
    displayPets(allPets);

    // Resetear selección
    selectedPet = null;
    document.getElementById('adoption-form-container').style.display = 'none';
}

// Función para actualizar la UI según si es adoptante o no
async function updateAdoptionRequestUI(isAdopter) {
    const adoptionRequestContent = document.getElementById('adoption-request-content');

    // Verificar nuevamente por si acaso
    const currentStatus = await checkAdopterStatus();
    isAdopter = currentStatus || isAdopter;

    if (isAdopter) {
        // Mostrar selector de mascotas y formulario
        adoptionRequestContent.innerHTML = `
                    <div class="filters-container">
                        <h4 style="margin: 0 0 10px 0; color: #333;">Filtrar mascotas por especie:</h4>
                        <div class="filter-buttons">
                            <button class="filter-btn active" onclick="filterPets('todas')">🐾 Todas</button>
                            <button class="filter-btn" onclick="filterPets('perro')">🐕 Perros</button>
                            <button class="filter-btn" onclick="filterPets('gato')">🐱 Gatos</button>
                            <button class="filter-btn" onclick="filterPets('ave')">🐦 Aves</button>
                            <button class="filter-btn" onclick="filterPets('otro')">🐹 Otros</button>
                        </div>
                    </div>

                    <div id="loading-pets">Cargando mascotas disponibles...</div>
                    <div id="pets-container"></div>

                    <div id="adoption-form-container" class="adoption-form-container">
                        <div id="selected-pet-info" class="selected-pet-info"></div>
                        
                        <form id="submit-adoption-form">
                            <label for="adoption-reason">¿Por qué quieres adoptar a esta mascota?</label>
                            <textarea id="adoption-reason" name="adoption-reason" required 
                                     style="width: 100%; height: 120px; margin-top: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;" 
                                     minlength="20" maxlength="500"
                                     placeholder="Cuéntanos por qué quieres adoptar a esta mascota, tu experiencia con animales, y cómo planeas cuidarla..."></textarea>
                            <small style="color: #666;">Mínimo 20 caracteres, máximo 500.</small>
                            
                            <button type="submit" style="margin-top: 15px; background: #ff6f61; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold;">
                                💌 Enviar Solicitud de Adopción
                            </button>
                        </form>
                        <p id="adoption-message" style="margin-top: 15px;"></p>
                    </div>
                `;

        // Cargar mascotas disponibles
        setTimeout(() => {
            document.getElementById('loading-pets').style.display = 'none';
            loadAvailablePets();
        }, 500);

        // Agregar evento al formulario
        setTimeout(() => {
            const form = document.getElementById('submit-adoption-form');
            if (form) {
                form.addEventListener('submit', function (e) {
                    e.preventDefault();
                    submitAdoptionRequest();
                });
            }
        }, 1000);

    } else {
        // Mostrar mensaje para registrarse como adoptante
        adoptionRequestContent.innerHTML = `
                    <div class="alert alert-info" style="padding: 20px; background: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; text-align: center;">
                        <h3 style="color: #1976d2; margin-top: 0;">¡Únete a nuestra familia de adoptantes! 🏠</h3>
                        <p style="font-size: 16px; margin: 15px 0;">Para solicitar la adopción de una mascota, primero debes registrarte como adoptante completando tu información personal.</p>
                        <button onclick="registerAsAdopter()" style="background: #ff6f61; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold;">
                            📝 Registrarme como Adoptante
                        </button>
                        <p class="small" style="margin-top: 10px; color: #666;">(Serás redirigido a completar tu información)</p>
                    </div>
                `;
    }
}

// Función para registrar al usuario como adoptante
function registerAsAdopter() {
    // Mostrar el formulario de edición
    showSection('user-info');
    setActive(document.querySelector('.account-menu a[onclick*="user-info"]'));
    showEditForm();

    // Mostrar mensaje explicativo
    const successMsg = document.getElementById('update-success-message');
    successMsg.textContent = 'Por favor completa y guarda tu información para registrarte como adoptante';
    successMsg.style.display = 'block';
    successMsg.style.color = 'blue'; // Cambiar color para mensaje informativo

    // Ocultar mensaje de error si está visible
    document.getElementById('update-error-message').style.display = 'none';
}

async function submitAdoptionRequest() {
    try {
        // Validaciones iniciales
        if (!selectedPet) {
            showToast('Error', 'Por favor selecciona una mascota primero', 'error', 4000);
            return;
        }

        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            showToast('Error', 'No se encontró información de usuario', 'error', 4000);
            return;
        }

        const reason = document.getElementById('adoption-reason').value;
        if (!reason || reason.length < 20) {
            showToast('Error', 'Por favor escribe al menos 20 caracteres explicando por qué quieres adoptar', 'error', 4000);
            return;
        }

        // PRIMERA CONFIRMACIÓN usando toast + confirm nativo
        const firstConfirmation = confirm(`¿Estás segur@ que deseas solicitar la adopción de ${selectedPet.nombre}?\n\nEspecie: ${selectedPet.especie}\nEdad: ${selectedPet.edad} años\n\nTu solicitud será revisada por nuestro equipo.`);

        if (!firstConfirmation) {
            // SEGUNDA CONFIRMACIÓN de cancelación
            const secondConfirmation = confirm('¿Estás seguro de cancelar la solicitud?\n\nLa mascota permanecerá disponible para adopción.');

            if (secondConfirmation) {
                showToast('Operación cancelada', 'No se ha enviado la solicitud de adopción', 'info', 3000);
            }
            return;
        }

        // Mostrar carga
        const loadingToast = showToast('Procesando', 'Enviando tu solicitud de adopción...', 'info', 0);

        // Enviar datos al servidor
        const response = await fetch('../api/adoption/submit_adoption.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                pet_id: selectedPet.id,
                motivo: reason
            })
        });

        // Cerrar toast de carga
        removeToast(loadingToast);

        if (!response.ok) {
            throw new Error('Error al enviar la solicitud al servidor');
        }

        // Actualizar estado de la mascota
        await fetch(`../api/pets/update_pet_status.php?id=${selectedPet.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ estado: 'procesando' })
        });

        // Mostrar éxito
        showToast(
            '¡Solicitud enviada!',
            `Hemos recibido tu solicitud para adoptar a ${selectedPet.nombre}. Te contactaremos pronto.`,
            'success',
            5000
        );

        // Resetear UI
        resetAdoptionFormUI();
        await loadAvailablePets();
        await loadAdoptionRequests();

    } catch (error) {
        showToast(
            'Error',
            error.message || 'Ocurrió un problema al enviar la solicitud',
            'error',
            5000
        );
    }
}

// Función auxiliar para resetear el formulario
function resetAdoptionFormUI() {
    document.getElementById('submit-adoption-form').reset();
    selectedPet = null;
    document.querySelectorAll('.pet-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.getElementById('adoption-form-container').style.display = 'none';
    document.getElementById('adoption-message').textContent = '';
}

// Función para cargar el historial de solicitudes del usuario
async function loadAdoptionRequests() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        const response = await fetch('../api/adoption/get_user_adoptions.php?user_id=' + currentUser.id, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (response.ok) {
            const requests = await response.json();
            const requestsList = document.getElementById('adoption-requests-list');
            requestsList.innerHTML = '';

            if (requests.length === 0) {
                requestsList.innerHTML = '<p>No tienes solicitudes de adopción.</p>';
                return;
            }

            requests.forEach(request => {
                const requestElement = document.createElement('div');
                requestElement.className = 'request-item';
                requestElement.style.cssText = `
                            border: 1px solid #ddd;
                            margin: 10px 0;
                            padding: 15px;
                            border-radius: 8px;
                            background-color: #f9f9f9;
                        `;

                let estadoColor = '#666';
                if (request.estado === 'pendiente') estadoColor = '#ff9800';
                if (request.estado === 'aprobado') estadoColor = '#4caf50';
                if (request.estado === 'rechazado') estadoColor = '#f44336';

                requestElement.innerHTML = `
                            <div class="request-info">
                                <p><strong>Mascota ID:</strong> ${request.id_mascota}</p>
                                <p><strong>Fecha:</strong> ${request.fecha_solicitud}</p>
                                <p><strong>Estado:</strong> <span style="color: ${estadoColor}; font-weight: bold; text-transform: uppercase; background: ${estadoColor}20; padding: 4px 8px; border-radius: 4px;">${request.estado}</span></p>
                                ${request.motivo ? `<p><strong>Motivo:</strong> ${request.motivo}</p>` : ''}
                            </div>
                            ${request.estado === 'pendiente' ? `
                                <div class="request-actions" style="margin-top: 10px;">
                                    <button onclick="deleteAdoptionRequest(${request.id})" 
                                            style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                                        Cancelar Solicitud
                                    </button>
                                </div>
                            ` : ''}
                        `;
                requestsList.appendChild(requestElement);
            });
        }
    } catch (error) {
        console.error('Error al cargar solicitudes:', error);
    }
}

// Función corregida para eliminar solicitud de adopción
async function deleteAdoptionRequest(requestId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta solicitud de adopción?')) {
        return;
    }

    try {
        // Mostrar toast de carga
        const loadingToast = showToast('Procesando', 'Cancelando tu solicitud de adopción...', 'info', 0);

        // SIMPLIFICADO: Solo eliminar la solicitud, el PHP se encarga del resto
        const response = await fetch(`../api/adoption/delete_adoption_request.php?id=${requestId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        // Cerrar toast de carga
        removeToast(loadingToast);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar la solicitud');
        }

        const result = await response.json();

        if (result.success) {
            // Mostrar notificación de éxito
            showToast(
                'Solicitud cancelada',
                'La solicitud de adopción ha sido eliminada correctamente. La mascota volverá a estar disponible.',
                'success',
                4000
            );

            // Recargar las listas para reflejar los cambios
            await loadAvailablePets();  // Esto mostrará la mascota como disponible nuevamente
            await loadAdoptionRequests(); // Esto actualizará el historial

        } else {
            throw new Error(result.message || 'Error desconocido');
        }

    } catch (error) {
        console.error('Error al eliminar solicitud:', error);

        // Mostrar notificación de error
        showToast(
            'Error al cancelar',
            error.message || 'Ocurrió un problema al cancelar la solicitud',
            'error',
            5000
        );
    }
}

// Función para mostrar secciones
async function showSection(sectionId) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.account-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Mostrar la sección seleccionada
    document.getElementById(sectionId).style.display = 'block';

    // Si es la sección de solicitud de adopción, verificar estado
    if (sectionId === 'adoption-request') {
        await checkAdopterStatus();
        updateAdoptionRequestUI(localStorage.getItem('isAdopter') === 'true');
    }
}

// Función para marcar elemento activo en el menú
function setActive(element) {
    document.querySelectorAll('.account-menu a').forEach(a => {
        a.classList.remove('active');
    });
    element.classList.add('active');
}

// Función logout
function logout() {
    console.log('Cerrando sesión...');

    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (user.id) {
        // Limpiar datos específicos del usuario
        sessionStorage.removeItem(`mascotaAdopcion_${user.id}`);
        sessionStorage.removeItem(`formularioAdopcionTemp_${user.id}`);
        localStorage.removeItem(`lastPetAdoption_${user.id}`);
    }

    // Limpiar TODOS los datos de sesión
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAdopter');
    sessionStorage.removeItem('mascotaAdopcion');
    sessionStorage.removeItem('formularioAdopcionTemp');
    localStorage.removeItem('lastPetAdoption');

    // Mostrar notificación de logout
    showToast(
        'Sesión cerrada',
        'Has cerrado sesión correctamente. ¡Hasta pronto!',
        'info',
        3000
    );

    // Intentar cerrar sesión en el servidor
    fetch('../api/auth/logout.php', {
        method: 'POST',
        credentials: 'include'
    }).finally(() => {
        setTimeout(() => {
            console.log('Redirigiendo al login...');
            window.location.href = 'login.html';
        }, 1000);
    });
}

// Funciones para editar información
function showEditForm() {
    document.getElementById('edit-user-form').style.display = 'block';
    document.getElementById('current-password').value = '';
}

function hideEditForm() {
    document.getElementById('edit-user-form').style.display = 'none';
}

// Función para mostrar toast cuando se actualiza información (opcional)
// Puedes llamar esta función desde scriptEditarInfo.js cuando sea exitosa la actualización
window.showSuccessToast = function (message) {
    showToast(
        'Información actualizada',
        message || 'Tu información ha sido actualizada correctamente.',
        'success',
        4000
    );
};

window.showErrorToast = function (message) {
    showToast(
        'Error al actualizar',
        message || 'Hubo un problema al actualizar tu información.',
        'error',
        5000
    );
};

// === FUNCIONES PARA MASCOTAS ADOPTADAS ===
async function loadAdoptedPets() {
    try {
        const response = await fetch('../api/adoption/get_adopted_pets.php', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const pets = await response.json();
        const container = document.getElementById('adopted-pets-container');

        if (pets.length === 0) {
            container.innerHTML = `
                <div class="no-pets-message">
                    <p>No tienes mascotas adoptadas.</p>
                </div>
            `;
            return;
        }

        // Crear el grid de mascotas adoptadas
        const petsGrid = document.createElement('div');
        petsGrid.className = 'adopted-pets-grid';

        container.innerHTML = '';
        
        pets.forEach(pet => {
            const petCard = document.createElement('div');
            petCard.className = 'adopted-pet-card';
            
            petCard.innerHTML = `
                <div class="adopted-pet-header">
                    <div class="adopted-pet-info">
                        <h4>${pet.nombre}</h4>
                        <div class="pet-details-row">
                            <div class="pet-detail-item">
                                <strong>Raza:</strong>
                                <span>${pet.raza}</span>
                            </div>
                            <div class="pet-detail-item">
                                <strong>Edad:</strong>
                                <span>${pet.edad} ${pet.edad === 1 ? 'año' : 'años'}</span>
                            </div>
                        </div>
                        <div class="adoption-date">
                            <strong>Adoptado: ${new Date(pet.fecha_adopcion).toLocaleDateString()}</strong>
                        </div>
                    </div>
                    <div class="pet-actions">
                        ${!pet.tiene_solicitud_pendiente ?
                            `<button class="return-button" onclick="openReturnModal(${pet.historial_id}, '${pet.nombre}')">Devolver</button>` :
                            `<div class="pending-status">Solicitud pendiente</div>`
                        }
                    </div>
                </div>
            `;
            
            petsGrid.appendChild(petCard);
        });

        container.appendChild(petsGrid);
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('adopted-pets-container').innerHTML = `
            <div class="no-pets-message">
                <p style="color: red;">Error al cargar mascotas</p>
            </div>
        `;
    }
}

function openReturnModal(historialId, petName) {
    document.getElementById('historial-id').value = historialId;
    document.getElementById('return-modal').style.display = 'block';
}

function closeReturnModal() {
    document.getElementById('return-modal').style.display = 'none';
    document.getElementById('return-form').reset();
}

// Event listener para formulario de reingreso
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        const form = document.getElementById('return-form');
        if (form) {
            form.addEventListener('submit', async function (e) {
                e.preventDefault();

                const historialId = document.getElementById('historial-id').value;
                const reason = document.getElementById('return-reason').value;
                const details = document.getElementById('return-details').value;

                if (!reason || details.length < 10) {
                    alert('Por favor completa todos los campos');
                    return;
                }

                if (!confirm('¿Estás seguro? Se aplicará una multa de $500 MXN')) {
                    return;
                }

                const motivo = `Motivo: ${reason}\nDetalles: ${details}`;

                try {
                    const response = await fetch('../api/adoption/submit_return_request.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        },
                        body: JSON.stringify({
                            historial_id: parseInt(historialId),
                            motivo_reingreso: motivo
                        })
                    });

                    const result = await response.json();
                    if (result.success) {
                        alert('Solicitud enviada correctamente');
                        closeReturnModal();
                        loadAdoptedPets();
                    } else {
                        alert('Error: ' + result.message);
                    }
                } catch (error) {
                    alert('Error al enviar solicitud');
                }
            });
        }
    }, 1000);
});

// === VISTA DEL USUARIO - Ver solicitudes de reingreso rechazadas ===

// Función para cargar solicitudes de reingreso del usuario (para account.html)
async function loadUserReturnRequests() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return;

        const response = await fetch(`../api/adoption/get_user_return_requests.php?user_id=${currentUser.id}`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        
        const requests = await response.json();
        const container = document.getElementById('user-return-requests-container');
        
        if (!container) return; // Si no existe el contenedor, no hacer nada
        
        if (requests.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">No tienes solicitudes de reingreso.</p>';
            return;
        }
        
        container.innerHTML = requests.map(req => `
            <div style="border:1px solid #ddd; padding:15px; margin:10px 0; border-radius:8px; border-left:4px solid ${req.estado === 'pendiente' ? '#ffc107' : req.estado === 'aprobada' ? '#28a745' : '#dc3545'};">
                <h4>${req.nombre_mascota}</h4>
                <div style="margin:10px 0;">
                    <p><strong>Fecha de solicitud:</strong> ${new Date(req.fecha_solicitud).toLocaleDateString()}</p>
                    <p><strong>Multa:</strong> $${req.monto_multa} MXN</p>
                    <p><strong>Estado:</strong> 
                        <span style="text-transform:uppercase; font-weight:bold; padding:4px 8px; border-radius:4px; background:${req.estado === 'pendiente' ? '#fff3cd' : req.estado === 'aprobada' ? '#d4edda' : '#f8d7da'}; color:${req.estado === 'pendiente' ? '#856404' : req.estado === 'aprobada' ? '#155724' : '#721c24'};">
                            ${req.estado === 'pendiente' ? '⏳ PENDIENTE' : req.estado === 'aprobada' ? '✅ APROBADA' : '❌ RECHAZADA'}
                        </span>
                    </p>
                </div>
                
                <div style="background:#f8f9fa; padding:10px; border-radius:4px; margin:10px 0;">
                    <strong>Tu motivo:</strong><br>
                    <em style="word-wrap: break-word">${req.motivo_reingreso}</em>
                </div>
                
                ${req.estado === 'rechazada' && req.observaciones_admin ? `
                    <div style="background:#ffebee; padding:12px; border-radius:6px; margin:10px 0; border-left:4px solid #dc3545;">
                        <strong style="color:#c62828; display:flex; align-items:center; gap:5px; margin-bottom:8px;">
                            ❌ Motivo del rechazo:
                        </strong>
                        <p style="color:#555; margin:0; line-height:1.4; word-wrap:break-word; background:white; padding:10px; border-radius:4px; border:1px solid #ffcdd2;">
                            ${req.observaciones_admin}
                        </p>
                        <small style="color:#999; margin-top:8px; display:block;">
                            Puedes contactar al administrador si tienes dudas sobre esta decisión.
                        </small>
                    </div>
                ` : ''}
                
                ${req.estado === 'aprobada' ? `
                    <div style="background:#d4edda; padding:12px; border-radius:6px; margin:10px 0; border-left:4px solid #28a745;">
                        <strong style="color:#155724;">✅ Solicitud aprobada</strong>
                        <p style="color:#155724; margin:5px 0 0 0;">La mascota ha sido reingresada al sistema. La multa debe ser pagada según los términos establecidos.</p>
                    </div>
                ` : ''}
                
                ${req.estado === 'pendiente' ? `
                    <div style="background:#fff3cd; padding:12px; border-radius:6px; margin:10px 0; border-left:4px solid #ffc107;">
                        <strong style="color:#856404;">⏳ En revisión</strong>
                        <p style="color:#856404; margin:5px 0 0 0;">Tu solicitud está siendo revisada por nuestro equipo. Te notificaremos cuando tengamos una respuesta.</p>
                    </div>
                ` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error:', error);
        const container = document.getElementById('user-return-requests-container');
        if (container) {
            container.innerHTML = '<p style="color:red; text-align:center; padding:20px;">Error al cargar solicitudes</p>';
        }
    }
}

// Función para mostrar secciones
async function showSection(sectionId) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.account-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Mostrar la sección seleccionada
    document.getElementById(sectionId).style.display = 'block';

    // Cargar datos específicos según la sección
    if (sectionId === 'adoption-request') {
        await checkAdopterStatus();
        updateAdoptionRequestUI(localStorage.getItem('isAdopter') === 'true');
    } else if (sectionId === 'adopted-pets') {
        await loadAdoptedPets();
    } else if (sectionId === 'user-return-requests') {
        loadUserReturnRequests();
    }
}
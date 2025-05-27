// Variable global para almacenar todas las solicitudes
let allRequests = [];
let currentFilter = 'todas';

// Sistema de notificaciones toast
function showToast(title, message, type = 'success', duration = 5000) {
    const container = document.getElementById('toast-container');

    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Iconos según el tipo
    const icons = {
        success: '✅',
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

// Función para verificar el rol del usuario al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser && currentUser.rol === 'admin') {
        document.getElementById('admin-menu-item').style.display = 'block';
        console.log('Usuario es administrador, mostrando panel');

        // Cargar solicitudes automáticamente para admin
        setTimeout(() => {
            loadAdoptionRequests();
        }, 500);
    } else {
        console.log('Usuario NO es administrador', currentUser);

        // Para usuarios normales, cargar sus propias solicitudes
        setTimeout(() => {
            loadUserAdoptionRequests();
        }, 500);
    }
});

// Función para filtrar solicitudes
function filterRequests(estado) {
    currentFilter = estado;

    // Actualizar estado de los botones
    document.querySelectorAll('.filter-buttons button').forEach(btn => {
        btn.style.fontWeight = 'normal';
        btn.style.opacity = '0.8';
    });

    const activeButton = document.getElementById(`filter-${estado}`);
    if (activeButton) {
        activeButton.style.fontWeight = 'bold';
        activeButton.style.opacity = '1';
    }

    // Filtrar y mostrar solicitudes
    const filteredRequests = estado === 'todas' ? allRequests : allRequests.filter(request => request.estado === estado);

    // Actualizar texto de estado
    const statusText = {
        'todas': 'Todas las solicitudes',
        'pendiente': 'Solicitudes pendientes',
        'aprobada': 'Solicitudes aprobadas',
        'rechazada': 'Solicitudes rechazadas'
    };

    document.getElementById('filter-status').textContent = `Mostrando: ${statusText[estado]} (${filteredRequests.length})`;

    // Mostrar solicitudes filtradas
    displayRequests(filteredRequests);
}

// Función para mostrar las solicitudes en el DOM
function displayRequests(requests) {
    const requestsList = document.getElementById('adoption-requests-list');

    // Mantener los filtros, solo actualizar la lista
    const existingFilters = requestsList.querySelector('.filters-container');
    requestsList.innerHTML = '';
    if (existingFilters) {
        requestsList.appendChild(existingFilters);
    }

    const listContainer = document.createElement('div');
    listContainer.id = 'requests-container';

    if (requests.length === 0) {
        listContainer.innerHTML = `<p style="text-align: center; color: #666; font-style: italic; margin: 20px 0;">
                    No hay solicitudes ${currentFilter === 'todas' ? '' : 'con estado "' + currentFilter + '"'} para mostrar.
                </p>`;
        requestsList.appendChild(listContainer);
        return;
    }

    requests.forEach(request => {
        const requestElement = document.createElement('div');
        requestElement.className = 'request-item';
        requestElement.style.cssText = `
                    border: 1px solid #ddd;
                    margin: 15px 0;
                    padding: 20px;
                    border-radius: 8px;
                    background-color: #f9f9f9;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                `;

        // Determinar el color del estado
        let estadoColor = '#666';
        let estadoBorder = '#ddd';
        if (request.estado === 'pendiente') {
            estadoColor = '#ff9800';
            estadoBorder = '#ff9800';
        }
        if (request.estado === 'aprobado') {
            estadoColor = '#4caf50';
            estadoBorder = '#4caf50';
        }
        if (request.estado === 'rechazado') {
            estadoColor = '#f44336';
            estadoBorder = '#f44336';
        }

        // Agregar borde izquierdo según el estado
        requestElement.style.borderLeft = `4px solid ${estadoBorder}`;

        requestElement.innerHTML = `
                    <div class="request-info">
                        <h4 style="margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
                            Solicitud #${request.id}
                        </h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div>
                                <p><strong>👤 Solicitante:</strong> ${request.nombre_usuario || 'No especificado'}</p>
                                <p><strong>📧 Email:</strong> ${request.email || 'No especificado'}</p>
                                <p><strong>📱 Teléfono:</strong> ${request.telefono || 'No registrado'}</p>
                                <p><strong>📍 Dirección:</strong> ${request.direccion || 'No registrada'}</p>
                            </div>
                            <div>
                                <p><strong>🐕 Mascota:</strong> ${request.nombre_mascota || 'ID: ' + request.id_mascota}</p>
                                <p><strong>🏷️ Raza:</strong> ${request.raza || 'No especificado'}</p>
                                <p><strong>🐾 Especie:</strong> ${request.especie || 'No especificado'}</p>
                                <p><strong>📅 Fecha:</strong> ${new Date(request.fecha_solicitud).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <p><strong>📊 Estado:</strong> 
                            <span style="color: ${estadoColor}; font-weight: bold; text-transform: uppercase; 
                                         background: ${estadoColor}20; padding: 4px 8px; border-radius: 4px;">
                                ${request.estado}
                            </span>
                        </p>
                        ${request.motivo ? `<p><strong>💭 Motivo:</strong> <em>"${request.motivo}"</em></p>` : ''}
                    </div>
                    <div class="request-actions" style="margin-top: 20px; text-align: right; border-top: 1px solid #ddd; padding-top: 15px;">
                        ${request.estado === 'pendiente' ? `
                            <button onclick="approveRequest(${request.id}, ${request.id_mascota})" 
                                    style="background: #4caf50; color: white; border: none; padding: 10px 20px; 
                                           margin: 0 5px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                                ✅ Aprobar Solicitud
                            </button>
                            <button onclick="rejectRequest(${request.id})" 
                                    style="background: #f44336; color: white; border: none; padding: 10px 20px; 
                                           margin: 0 5px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                                ❌ Rechazar Solicitud
                            </button>
                        ` : `
                            <span style="color: #666; font-style: italic; padding: 10px;">
                                ${request.estado === 'aprobada' ? '✅ Solicitud ya aprobada' : '❌ Solicitud ya rechazada'}
                            </span>
                        `}
                    </div>
                `;
        listContainer.appendChild(requestElement);
    });

    requestsList.appendChild(listContainer);
}

// Funciones para el panel de administrador
async function loadPets() {
    try {
        console.log('Cargando mascotas...');
        const response = await fetch('../api/pets/get_pets.php', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (response.ok) {
            const pets = await response.json();
            const petsList = document.getElementById('pets-list');
            petsList.innerHTML = '';

            if (pets.length === 0) {
                petsList.innerHTML = '<p>No hay mascotas registradas.</p>';
                return;
            }

            pets.forEach(pet => {
                const petElement = document.createElement('div');
                petElement.className = 'pet-item';

                petElement.innerHTML = `
                            <div class="pet-header">
                                <h4 style="margin: 0; color: #333;">🐾 ${pet.nombre}</h4>
                                <div class="pet-actions">
                                    <button class="btn btn-edit" onclick="openEditModal(${pet.id})">
                                        ✏️ Editar
                                    </button>
                                    <button class="btn btn-delete" onclick="deletePet(${pet.id}, '${pet.nombre}')">
                                        🗑️ Eliminar
                                    </button>
                                </div>
                            </div>
                            <div class="pet-details">
                                <div class="pet-image-container">
                                    <img src="${pet.imagen_ruta}" alt="${pet.nombre}" onerror="this.src='../img/default-pet.png'">
                                </div>
                                <div class="pet-info">
                                    <p><strong>ID:</strong> ${pet.id}</p>
                                    <p><strong>Edad:</strong> ${pet.edad} ${pet.edad === 1 ? 'año' : 'años'}</p>
                                    <p><strong>Raza:</strong> ${pet.raza}</p>
                                    <p><strong>Sexo:</strong> ${pet.sexo}</p>
                                    <p><strong>Estado de salud:</strong> ${pet.estado_salud}</p>
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
                            </div>
                        `;
                petsList.appendChild(petElement);
            });
        } else {
            console.error('Error al cargar mascotas:', response.status);
            document.getElementById('pets-list').innerHTML = '<p>Error al cargar mascotas.</p>';
        }
    } catch (error) {
        console.error('Error al cargar mascotas:', error);
        document.getElementById('pets-list').innerHTML = '<p>Error de conexión.</p>';
    }
}


// Función para cargar TODAS las solicitudes de adopción (PARA ADMIN)
async function loadAdoptionRequests() {
    try {
        console.log('Cargando solicitudes de adopción para admin...');

        const response = await fetch('../api/adoption/get_adoption_requests.php', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const requests = await response.json();
            console.log('Solicitudes recibidas:', requests);

            // Guardar todas las solicitudes globalmente
            allRequests = requests;

            // Aplicar filtro actual
            filterRequests(currentFilter);

        } else {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            document.getElementById('adoption-requests-list').innerHTML =
                '<p style="color: red;">❌ Error al cargar las solicitudes de adopción.</p>';
        }
    } catch (error) {
        console.error('Error al cargar solicitudes de adopción:', error);
        document.getElementById('adoption-requests-list').innerHTML =
            '<p style="color: red;">❌ Error de conexión al cargar las solicitudes.</p>';
    }
}

// Función para cargar solicitudes del usuario actual (NO ADMIN)
async function loadUserAdoptionRequests() {
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
            requestsList.innerHTML = '<h3>Mis Solicitudes de Adopción</h3>';

            if (requests.length === 0) {
                requestsList.innerHTML += '<p>No tienes solicitudes de adopción.</p>';
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
                                <p><strong>Fecha:</strong> ${new Date(request.fecha_solicitud).toLocaleDateString()}</p>
                                <p><strong>Estado:</strong> <span style="color: ${estadoColor}; font-weight: bold;">${request.estado}</span></p>
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
        console.error('Error al cargar solicitudes del usuario:', error);
    }
}


// Función para verificar autenticación
function verifyAuth() {
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!token || !currentUser.id) {
        showToast(
            'Sesión Expirada',
            'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
            'error',
            5000
        );
        logout();
        return false;
    }
    return true;
}

// Función para aprobar solicitud (VERSIÓN FINAL CORREGIDA)
async function approveRequest(requestId, petId) {
    if (!verifyAuth()) return;

    if (!confirm('¿Estás seguro de que deseas aprobar esta solicitud?\n\n⚠️ ATENCIÓN: La mascota será ELIMINADA definitivamente del sistema.')) return;

    try {
        console.log(`Aprobando solicitud ${requestId} para mascota ${petId}`);

        const response = await fetch(`../api/adoption/approve_request.php?id=${requestId}`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showToast('Sesión Expirada', 'Token no válido. Inicia sesión nuevamente.', 'error', 5000);
            logout();
            return;
        }

        if (response.ok) {
            const result = await response.json();
            console.log('Solicitud aprobada:', result);

            showToast(
                '¡Solicitud Aprobada!',
                `La solicitud #${requestId} ha sido aprobada correctamente y la mascota ha sido eliminada del sistema.`,
                'success',
                6000
            );

            // Recargar datos
            loadAdoptionRequests();
            if (typeof loadPets === 'function' && document.getElementById('admin-panel').style.display !== 'none') {
                loadPets();
            }
        } else {
            const error = await response.json();
            console.error('Error al aprobar:', error);
            showToast(
                'Error al Aprobar',
                error.message || 'No se pudo aprobar la solicitud.',
                'error',
                5000
            );
        }
    } catch (error) {
        console.error('Error al aprobar solicitud:', error);
        showToast(
            'Error de Conexión',
            'No se pudo conectar con el servidor.',
            'error',
            5000
        );
    }
}

// Función para rechazar solicitud (VERSIÓN FINAL CORREGIDA)
async function rejectRequest(requestId) {
    if (!verifyAuth()) return;

    if (!confirm('¿Estás seguro de que deseas rechazar esta solicitud?\n\nLa mascota volverá a estar disponible para adopción.')) return;

    try {
        console.log(`Rechazando solicitud ${requestId}`);

        const response = await fetch(`../api/adoption/reject_request.php?id=${requestId}`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showToast('Sesión Expirada', 'Token no válido. Inicia sesión nuevamente.', 'error', 5000);
            logout();
            return;
        }

        if (response.ok) {
            const result = await response.json();
            console.log('Solicitud rechazada:', result);

            showToast(
                'Solicitud Rechazada',
                `La solicitud #${requestId} ha sido rechazada correctamente. La mascota vuelve a estar disponible.`,
                'info',
                5000
            );

            // Recargar datos
            loadAdoptionRequests();
            if (typeof loadPets === 'function' && document.getElementById('admin-panel').style.display !== 'none') {
                loadPets();
            }
        } else {
            const error = await response.json();
            console.error('Error al rechazar:', error);
            showToast(
                'Error al Rechazar',
                error.message || 'No se pudo rechazar la solicitud.',
                'error',
                5000
            );
        }
    } catch (error) {
        console.error('Error al rechazar solicitud:', error);
        showToast(
            'Error de Conexión',
            'No se pudo conectar con el servidor.',
            'error',
            5000
        );
    }
}

// Funciones CRUD para mascotas
async function addPet() {
    const form = document.getElementById('add-pet-form');
    const formData = new FormData(form);

    try {
        const response = await fetch('../api/pets/add_pet.php', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: formData
        });

        const result = await response.json();
        if (response.ok) {
            showToast(
                '¡Mascota Agregada!',
                `${formData.get('nombre')} ha sido agregada exitosamente al sistema.`,
                'success',
                5000
            );

            document.getElementById('add-pet-message').innerHTML = '';
            form.reset();
            document.getElementById('image-preview').style.display = 'none';
            loadPets();
        } else {
            showToast(
                'Error al Agregar Mascota',
                result.message || 'No se pudo agregar la mascota al sistema.',
                'error',
                5000
            );

            document.getElementById('add-pet-message').textContent = 'Error: ' + (result.message || 'No se pudo agregar la mascota');
            document.getElementById('add-pet-message').style.color = 'red';
        }
    } catch (error) {
        console.error('Error al agregar mascota:', error);
        showToast(
            'Error de Conexión',
            'No se pudo conectar con el servidor para agregar la mascota.',
            'error',
            5000
        );

        document.getElementById('add-pet-message').textContent = 'Error al agregar mascota';
        document.getElementById('add-pet-message').style.color = 'red';
    }
}

// Función para abrir modal de edición
async function openEditModal(petId) {
    try {
        // Obtener datos de la mascota
        const response = await fetch(`../api/pets/get_pet.php?id=${petId}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (response.ok) {
            const pet = await response.json();

            // Llenar el formulario con los datos actuales
            document.getElementById('edit-pet-id').value = pet.id;
            document.getElementById('edit-pet-name').value = pet.nombre;
            document.getElementById('edit-pet-age').value = pet.edad;
            document.getElementById('edit-pet-breed').value = pet.raza;
            document.getElementById('edit-pet-gender').value = pet.sexo;
            document.getElementById('edit-pet-health').value = pet.estado_salud;
            document.getElementById('edit-pet-species').value = pet.especie;
            document.getElementById('edit-pet-status').value = pet.estado;

            // Mostrar modal
            document.getElementById('edit-pet-modal').style.display = 'block';
        } else {
            showToast(
                'Error',
                'No se pudieron cargar los datos de la mascota.',
                'error',
                4000
            );
        }
    } catch (error) {
        console.error('Error al cargar datos de mascota:', error);
        showToast(
            'Error de Conexión',
            'No se pudo conectar con el servidor.',
            'error',
            4000
        );
    }
}

// Función para cerrar modal de edición
function closeEditModal() {
    document.getElementById('edit-pet-modal').style.display = 'none';
    document.getElementById('edit-image-preview').style.display = 'none';
}

// Función para actualizar mascota
async function updatePet() {
    const form = document.getElementById('edit-pet-form');
    const formData = new FormData(form);
    const petName = formData.get('nombre');

    try {
        const response = await fetch('../api/pets/update_pet.php', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: formData
        });

        const result = await response.json();
        if (response.ok) {
            showToast(
                '¡Mascota Actualizada!',
                `Los datos de ${petName} han sido actualizados correctamente.`,
                'success',
                5000
            );

            closeEditModal();
            loadPets(); // Recargar lista de mascotas
        } else {
            showToast(
                'Error al Actualizar',
                result.message || 'No se pudieron actualizar los datos de la mascota.',
                'error',
                5000
            );
        }
    } catch (error) {
        console.error('Error al actualizar mascota:', error);
        showToast(
            'Error de Conexión',
            'No se pudo conectar con el servidor para actualizar la mascota.',
            'error',
            5000
        );
    }
}

// Función para eliminar mascota
async function deletePet(petId, petName) {
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${petName}? Esta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await fetch(`../api/pets/delete_pet.php?id=${petId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        const result = await response.json();
        if (response.ok) {
            showToast(
                'Mascota Eliminada',
                `${petName} ha sido eliminada del sistema correctamente.`,
                'success',
                5000
            );

            loadPets(); // Recargar lista de mascotas
        } else {
            showToast(
                'Error al Eliminar',
                result.message || 'No se pudo eliminar la mascota del sistema.',
                'error',
                5000
            );
        }
    } catch (error) {
        console.error('Error al eliminar mascota:', error);
        showToast(
            'Error de Conexión',
            'No se pudo conectar con el servidor para eliminar la mascota.',
            'error',
            5000
        );
    }
}

// Vista previa de imagen para agregar
document.getElementById('pet-image').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            document.getElementById('preview-img').src = event.target.result;
            document.getElementById('image-preview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Vista previa de imagen para editar
document.getElementById('edit-pet-image').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            document.getElementById('edit-preview-img').src = event.target.result;
            document.getElementById('edit-image-preview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Event listeners
document.getElementById('add-pet-form').addEventListener('submit', function (e) {
    e.preventDefault();
    addPet();
});

document.getElementById('edit-pet-form').addEventListener('submit', function (e) {
    e.preventDefault();
    updatePet();
});

// Cerrar modal al hacer clic fuera de él
window.onclick = function (event) {
    const modal = document.getElementById('edit-pet-modal');
    if (event.target === modal) {
        closeEditModal();
    }
}

// Función para mostrar secciones (MEJORADA)
function showSection(sectionId) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.account-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Mostrar la sección seleccionada
    document.getElementById(sectionId).style.display = 'block';

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Cargar datos específicos según la sección
    if (currentUser && currentUser.rol === 'admin') {
        if (sectionId === 'admin-panel') {
            console.log('Cargando panel de administrador...');
            loadPets();
            loadAdoptionRequests();
        } else if (sectionId === 'adoption-history') {
            console.log('Cargando gestión de solicitudes de adopción para admin...');
            loadAdoptionRequests();
        }
    } else if (sectionId === 'adoption-history') {
        // Para usuarios no admin, cargar solo sus propias solicitudes
        console.log('Cargando solicitudes del usuario...');
        loadUserAdoptionRequests();
    }
}

// Función setActive para cambiar el menú activo
function setActive(element) {
    document.querySelectorAll('.account-menu a').forEach(a => {
        a.classList.remove('active');
    });
    element.classList.add('active');
}

// Función para eliminar solicitud del usuario (función existente)
async function deleteAdoptionRequest(requestId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta solicitud de adopción?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast(
                'Sesión Expirada',
                'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
                'error',
                5000
            );
            logout();
            return;
        }

        const response = await fetch(`../api/adoption/delete_adoption_request.php?id=${requestId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showToast(
                'Sesión Expirada',
                'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
                'error',
                5000
            );
            logout();
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al eliminar la solicitud');
        }

        showToast(
            'Solicitud Cancelada',
            data.message || 'La solicitud de adopción ha sido cancelada correctamente.',
            'success',
            4000
        );

        loadUserAdoptionRequests(); // Recargar la lista
    } catch (error) {
        console.error('Error al eliminar solicitud:', error);
        showToast(
            'Error al Cancelar',
            error.message,
            'error',
            5000
        );
    }
}

// Función logout (debe estar definida)
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

    showToast(
        'Sesión Cerrada',
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

// Funciones para editar información (deben estar definidas para que funcione el formulario)
function showEditForm() {
    document.getElementById('edit-user-form').style.display = 'block';
    document.getElementById('current-password').value = '';
}

function hideEditForm() {
    document.getElementById('edit-user-form').style.display = 'none';
}

// Funciones para mostrar toast desde otros archivos (opcional)
window.showSuccessToast = function (message) {
    showToast(
        'Operación Exitosa',
        message || 'La operación se completó correctamente.',
        'success',
        4000
    );
};

window.showErrorToast = function (message) {
    showToast(
        'Error',
        message || 'Hubo un problema al procesar la solicitud.',
        'error',
        5000
    );
};

function toggleOtherSpecies() {
    const select = document.getElementById('pet-species');
    const otherContainer = document.getElementById('other-species-container');
    const otherInput = document.getElementById('other-species');

    if (select.value === 'otro') {
        otherContainer.style.display = 'block';
        otherInput.setAttribute('required', 'required');
        otherInput.setAttribute('name', 'especie'); // ahora este es el válido
        select.removeAttribute('name'); // se quita del select para evitar conflictos
    } else {
        otherContainer.style.display = 'none';
        otherInput.removeAttribute('required');
        otherInput.removeAttribute('name');
        otherInput.value = '';
        select.setAttribute('name', 'especie'); // el select vuelve a tener el name
    }
}

function toggleEditOtherSpecies() {
    const select = document.getElementById('edit-pet-species');
    const otherContainer = document.getElementById('edit-other-species-container');
    const otherInput = document.getElementById('edit-other-species');

    if (select.value === 'otro') {
        otherContainer.style.display = 'block';
        otherInput.setAttribute('required', 'required');
        otherInput.setAttribute('name', 'especie'); // ahora este es el válido
        select.removeAttribute('name'); // se quita del select para evitar conflictos
    } else {
        otherContainer.style.display = 'none';
        otherInput.removeAttribute('required');
        otherInput.removeAttribute('name');
        otherInput.value = '';
        select.setAttribute('name', 'especie'); // el select vuelve a tener el name
    }
}

// === GESTIÓN DE SOLICITUDES DE REINGRESO ===
async function loadReturnRequests() {
    try {
        const response = await fetch('../api/adoption/get_return_requests.php', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const requests = await response.json();
        const container = document.getElementById('return-requests-list');
        
        if (requests.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:40px;">No hay solicitudes de reingreso.</p>';
            return;
        }
        
        container.innerHTML = requests.map(req => `
            <div style="border:1px solid #ddd; padding:15px; margin:10px 0; border-radius:8px; border-left:4px solid ${req.estado === 'pendiente' ? '#ffc107' : req.estado === 'aprobada' ? '#28a745' : '#dc3545'};">
                <h4>Solicitud #${req.solicitud_id} - ${req.nombre_mascota}</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin:10px 0;">
                    <div>
                        <p><strong>Usuario:</strong> ${req.nombre_usuario}</p>
                        <p><strong>Email:</strong> ${req.email}</p>
                        <p><strong>Fecha:</strong> ${new Date(req.fecha_solicitud).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p><strong>Multa:</strong> $${req.monto_multa} MXN</p>
                        <p><strong>Estado:</strong> <span style="text-transform:uppercase; font-weight:bold; color:${req.estado === 'pendiente' ? '#ff9800' : req.estado === 'aprobada' ? '#28a745' : '#dc3545'};">${req.estado}</span></p>
                    </div>
                </div>
                <div style="background:#f8f9fa; padding:10px; border-radius:4px; margin:10px 0;">
                    <strong>Motivo:</strong><br>
                    <em>${req.motivo_reingreso}</em>
                </div>
                ${req.estado === 'pendiente' ? `
                    <div style="text-align:right; margin-top:15px;">
                        <button onclick="processReturn(${req.solicitud_id}, 'aprobar')" style="background:#28a745; color:white; padding:8px 15px; border:none; border-radius:4px; margin-right:10px; cursor:pointer;">✅ Aprobar</button>
                        <button onclick="processReturn(${req.solicitud_id}, 'rechazar')" style="background:#dc3545; color:white; padding:8px 15px; border:none; border-radius:4px; cursor:pointer;">❌ Rechazar</button>
                    </div>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('return-requests-list').innerHTML = '<p style="color:red;">Error al cargar solicitudes</p>';
    }
}

async function processReturn(solicitudId, action) {
    const actionText = action === 'aprobar' ? 'aprobar' : 'rechazar';
    if (!confirm(`¿Estás seguro de ${actionText} esta solicitud?`)) return;
    
    try {
        const endpoint = action === 'aprobar' ? 'approve_return_request.php' : 'reject_return_request.php';
        const response = await fetch(`../api/adoption/${endpoint}?id=${solicitudId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ observaciones_admin: '' })
        });
        
        const result = await response.json();
        if (result.success) {
            showToast('Éxito', result.message, 'success', 4000);
            loadReturnRequests();
            // Recargar mascotas si es necesario
            if (typeof loadPets === 'function') loadPets();
        } else {
            showToast('Error', result.message, 'error', 4000);
        }
    } catch (error) {
        showToast('Error', 'Error al procesar solicitud', 'error', 4000);
    }
}

// Modificar showSection existente para incluir solicitudes de reingreso
const _originalShowSectionAdmin = window.showSection;
window.showSection = function(sectionId) {
    if (_originalShowSectionAdmin) {
        _originalShowSectionAdmin(sectionId);
    } else {
        document.querySelectorAll('.account-section').forEach(s => s.style.display = 'none');
        document.getElementById(sectionId).style.display = 'block';
    }
    
    // Cargar datos específicos según la sección
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.rol === 'admin') {
        if (sectionId === 'return-requests') {
            loadReturnRequests();
        }
    }
};
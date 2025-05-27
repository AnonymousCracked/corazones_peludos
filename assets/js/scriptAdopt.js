// Variables globales
let allPets = [];
let filteredPets = [];
let currentPetFilter = 'todas';
let currentAgeFilter = 'todas';
const petsPerPage = 21;
let currentPage = 1;
let totalPages = 1;

// Función para cargar mascotas disponibles desde la base de datos
async function loadAvailablePets() {
    try {
        document.getElementById('loading-message').style.display = 'block';
        

        // Obtener el token de autenticación si es necesario
        const token = localStorage.getItem('token');

        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Hacer la petición al servidor para obtener las mascotas disponibles
        const response = await fetch('../api/pets/get_pets.php', {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error('Error al obtener las mascotas');
        }

        allPets = await response.json();

        // Filtrar solo mascotas disponibles
        allPets = allPets.filter(pet =>
            pet.estado === 'disponible' && !pet.has_pending_request
        );

        applyFilters();

    } catch (error) {
        console.error('Error al cargar mascotas:', error);
        document.getElementById('lista-mascotas').innerHTML = `
                    <div style="text-align: center; color: red; padding: 20px;">
                        Error al cargar las mascotas: ${error.message}
                    </div>
                `;
    } finally {
         const loading = document.getElementById('loading-message');
    if (loading) {
        loading.style.display = 'none';
    }
    }

// Función para aplicar los filtros
function applyFilters() {
    currentPetFilter = document.getElementById('especie').value;
    currentAgeFilter = document.getElementById('edad').value;
    currentPage = 1; // Resetear a la primera pagina al aplicar nuevos filtros

    filterPets();
    updatePagination();
    displayCurrentPage();
}

// Funcion para filtrar las mascotas según los criterios
function filterPets() {
    // Especies comunes (comparar en minusculas)
    const especiesComunes = ['perro', 'gato', 'ave'];

    // Obtener el valor numerico de la edad (vacio o 0 significa "todas")
    const edadFiltro = document.getElementById('edad').value;
    const edadNumerica = edadFiltro === '' ? 0 : parseFloat(edadFiltro);

    // Filtrar mascotas según los filtros actuales
    filteredPets = allPets.filter(pet => {
        // Filtrar por especie
        if (currentPetFilter !== 'todas') {
            const especie = pet.especie.toLowerCase();

            if (currentPetFilter === 'otro') {
                if (especiesComunes.includes(especie)) {
                    return false;
                }
            } else if (especie !== currentPetFilter) {
                return false;
            }
        }

        // Filtrar por edad (solo si se ingreso un valor)
        if (edadNumerica > 0) {
            // Mostrar mascotas cuya edad sea igual al valor ingresado
            // (o puedes cambiar esto para mostrar mascotas menores o mayores según prefieras)
            if (Math.floor(pet.edad) !== Math.floor(edadNumerica)) {
                return false;
            }
        }

        return true;
    });

    // Calcular el numero total de páginas
    totalPages = Math.ceil(filteredPets.length / petsPerPage);
}

// Función para mostrar la página actual
function displayCurrentPage() {
    const container = document.getElementById('lista-mascotas');

    if (!filteredPets || filteredPets.length === 0) {
        container.innerHTML = `
                    <div style="text-align: center; color: #666; padding: 40px;">
                        No hay mascotas disponibles con los filtros seleccionados.
                    </div>
                `;
        return;
    }

    container.innerHTML = '';

    // Calcular índices de las mascotas a mostrar
    const startIndex = (currentPage - 1) * petsPerPage;
    const endIndex = Math.min(startIndex + petsPerPage, filteredPets.length);
    const petsToShow = filteredPets.slice(startIndex, endIndex);

    // Organizar en filas de 3 mascotas
    for (let i = 0; i < petsToShow.length; i += 3) {
        const rowPets = petsToShow.slice(i, i + 3);

        const rowDiv = document.createElement('div');
        rowDiv.className = 'pets-row';

        rowPets.forEach(pet => {
            const petCard = createPetCard(pet);
            rowDiv.appendChild(petCard);
        });

        container.appendChild(rowDiv);
    }
}
}

// Función para crear una tarjeta de mascota
function createPetCard(pet) {
    const petCard = document.createElement('div');
    petCard.className = 'mascota';
    petCard.setAttribute('data-id', pet.id);

    // Determinar si es ave para mostrar "Especie" en lugar de "Raza"
    const tipoRaza = pet.especie.toLowerCase() === 'ave' ? 'Especie' : 'Raza';
    const valorRaza = pet.especie.toLowerCase() === 'ave' ? pet.especie : pet.raza;

    // Verificar si el usuario está logueado
    const isLoggedIn = localStorage.getItem('token') !== null;
    const adoptionLink = isLoggedIn ?
        `account.html` :
        `login.html`;

    petCard.innerHTML = `
        <img src="${pet.imagen_ruta}" alt="${pet.nombre}"">
        <h3>${pet.nombre}</h3>
        <p><strong>Edad:</strong> ${formatEdad(pet.edad)}</p>
        <p><strong>${tipoRaza}:</strong> ${valorRaza}</p>
        <p><strong>Sexo:</strong> ${pet.sexo}</p>
        <p><strong>Salud:</strong> ${pet.estado_salud}</p>
        <div style="margin-top: 8px;">
            <p><strong>Especie:</strong> <span class="pet-badge" style="text-transform: capitalize;">${pet.especie.toLowerCase()}</span></p>
            <p><strong>Estado:</strong> <span class="pet-badge" style="background: #2196f3;">Disponible</span></p>
        </div>
        <nav style="margin-top: 15px;">
            <a href="${adoptionLink}" class="btn">Solicitar adopción</a>
        </nav>
    `;

    return petCard;
}

// Función para actualizar la paginación
function updatePagination() {
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = '';

    if (totalPages <= 1) return;

    // Botón Anterior
    const prevBtn = document.createElement('button');
    prevBtn.className = `page-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '&laquo; Anterior';
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            displayCurrentPage();
            updatePagination();
        }
    };
    paginationDiv.appendChild(prevBtn);

    // Números de página
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.className = 'page-btn';
        firstBtn.textContent = '1';
        firstBtn.onclick = () => {
            currentPage = 1;
            displayCurrentPage();
            updatePagination();
        };
        paginationDiv.appendChild(firstBtn);

        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '8px 12px';
            paginationDiv.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => {
            currentPage = i;
            displayCurrentPage();
            updatePagination();
        };
        paginationDiv.appendChild(pageBtn);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '8px 12px';
            paginationDiv.appendChild(ellipsis);
        }

        const lastBtn = document.createElement('button');
        lastBtn.className = 'page-btn';
        lastBtn.textContent = totalPages;
        lastBtn.onclick = () => {
            currentPage = totalPages;
            displayCurrentPage();
            updatePagination();
        };
        paginationDiv.appendChild(lastBtn);
    }

    // Botón Siguiente
    const nextBtn = document.createElement('button');
    nextBtn.className = `page-btn ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = 'Siguiente &raquo;';
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayCurrentPage();
            updatePagination();
        }
    };
    paginationDiv.appendChild(nextBtn);
}

// Función para formatear la edad (mostrar meses si es menor a 1 año)
function formatEdad(edad) {
    if (edad < 1) {
        const meses = Math.round(edad * 12);
        return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    }
    return `${edad} ${edad === 1 ? 'año' : 'años'}`;
}

// Cargar las mascotas al iniciar la página
document.addEventListener('DOMContentLoaded', function () {
    loadAvailablePets();

});
    
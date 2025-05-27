document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        console.log('Intentando iniciar sesion con:', { email, password });
        
        fetch('../api/auth/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        })
        .then(response => {
            console.log('Respuesta del servidor:', response);
            
            // Verificar el codigo de estado
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Error desconocido');
                });
            }
            
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos:', data);

            if (data.success) {

                // GUARDAR EL TOKEN PRIMERO
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    console.log('âœ… Token guardado:', data.token);
                } else {
                    console.error('âŒ No se recibiÃ³ token del servidor');
                    alert('Error: El servidor no devolviÃ³ token de autenticaciÃ³n');
                    return;
                }

                // IMPORTANTE: Guardar los datos del usuario en localStorage
                // para que account.html pueda acceder a ellos
                const userData = {
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    rol: data.user.rol,
                    password: password, // Solo para compatibilidad con el cÃ³digo existente
                    registerDate: new Date().toISOString()
                };
                
                // Guardar en localStorage
                localStorage.setItem('currentUser', JSON.stringify(userData));
                
                // Limpiar datos temporales de formularios
                Object.keys(sessionStorage).forEach(key => {
                    if (key.includes('formularioAdopcionTemp_') || key.includes('mascotaAdopcion_')) {
                        sessionStorage.removeItem(key);
                    }
                });
                
                // Redirigir segun el rol
                if (data.user.rol === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    // Verificar si hay una redireccion guardada
                    const redirectTo = sessionStorage.getItem('redirectTo') || 'account.html';
                    sessionStorage.removeItem('redirectTo'); // Limpiar despues de usar
                    window.location.href = redirectTo;
                }
            } else {
                // Mostrar mensaje de error
                errorMessage.textContent = data.message;
                console.error('Error de login:', data);
            }
        })
        .catch(error => {
            console.error('Error completo:', error);
            errorMessage.textContent = error.message || 'Ocurria un error al iniciar sesion';
        });
    });
});

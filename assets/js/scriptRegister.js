document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');

    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorMessage = document.getElementById('errorMessage');
        const termsChecked = document.getElementById('terms').checked;

        // Validaciones
        if (!termsChecked) {
            errorMessage.textContent = 'Debes aceptar los terminos y condiciones';
            return;
        }

        if (password !== confirmPassword) {
            errorMessage.textContent = 'Las contraseñas no coinciden.';
            return;
        }

        if (password.length < 6) {
            errorMessage.textContent = 'La contraseña debe tener al menos 6 caracteres';
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
                console.log('Respuesta del servidor:', result); // Para depuracion

                if (result.includes('Usuario registrado correctamente')) {
                    errorMessage.textContent = '';
                    window.location.href = 'account.html';
                } else {
                    errorMessage.textContent = result;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                errorMessage.textContent = 'Ocurrio un error al registrar el usuario';
            });
    });
});

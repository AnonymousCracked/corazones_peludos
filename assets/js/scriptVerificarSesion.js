function verificarSesion() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        window.location.href = 'account.html';
    } else {
        window.location.href = 'login.html';
    }
}
<?php
session_start();

// Destruir todas las variables de sesiÃ³n
$_SESSION = array();

// Destruir la cookie de sesion si existe
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destruir la sesion
session_destroy();

// Responder con exito
header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'Sesion cerrada correctamente']);
?>
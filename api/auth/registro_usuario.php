<?php
include("../config/conexion.php");

// Habilitar reporte de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Verifica que se haya enviado el formulario
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Verificar si los campos existen
    if (!isset($_POST["name"]) || !isset($_POST["email"]) || !isset($_POST["password"])) {
        echo "Campos incompletos";
        exit;
    }

    $nombre = $_POST["name"];
    $email = $_POST["email"];
    $password = password_hash($_POST["password"], PASSWORD_DEFAULT); // Seguridad

    $rol = 'usuario';
    
    // Verificar si el email ya existe
    $stmt_check = $conexion->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt_check->bind_param("s", $email);
    $stmt_check->execute();
    $result = $stmt_check->get_result();
    
    if ($result->num_rows > 0) {
        echo "El correo electronico ya esta registrado";
        exit;
    }

    // Preparar y ejecutar inserciÃ³n
    $sql = "INSERT INTO usuarios (nombre, email, password, rol, fecha_registro) VALUES (?, ?, ?, ?, NOW())";
    $stmt = $conexion->prepare($sql);
    
    if (!$stmt) {
        echo "Error en la preparacion de la consulta: " . $conexion->error;
        exit;
    }
    
    $stmt->bind_param("ssss", $nombre, $email, $password, $rol);

    if ($stmt->execute()) {
        echo "Usuario registrado correctamente.";
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
}
?>
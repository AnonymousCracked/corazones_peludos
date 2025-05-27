<?php
$conexion = new mysqli("localhost", "root", "", "corazones_peludos");
$nombre = "Administrador";
$email = "adminuevo@gmail.com";
$passwordPlano = "admin123";
$rol = "admin";

// Cifrar contraseña
$hash = password_hash($passwordPlano, PASSWORD_DEFAULT);

// Insertar en la base de datos
$sql = "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)";
$stmt = $conexion->prepare($sql);
$stmt->bind_param("ssss", $nombre, $email, $hash, $rol);

if ($stmt->execute()) {
    echo "✅ Usuario administrador creado con éxito.";
} else {
    echo "❌ Error: " . $stmt->error;
}

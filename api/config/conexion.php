<?php
$host = "localhost";
$usuario = "root";
$clave = "";
$bd = "corazones_peludos";

// Crear conexión
$conexion = new mysqli($host, $usuario, $clave, $bd);

// Verificar conexión
if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}
?>

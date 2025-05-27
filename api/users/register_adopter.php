<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include_once '../config/conexion.php';

function verifyToken($token) {
    return !empty($token);
}

$method = $_SERVER['REQUEST_METHOD'];
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : '';

if (!verifyToken($token)) {
    http_response_code(401);
    echo json_encode(array("message" => "Token no valido"));
    exit();
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(array("message" => "Metodo no permitido"));
    exit();
}

$data = json_decode(file_get_contents("php://input"));

// Registrar al usuario como adoptante
$query = "INSERT INTO adoptantes (id_usuario, nombre_completo, direccion, telefono, correo, edad, experiencia_mascotas) VALUES (?, ?, ?, ?, ?, ?, ?)";
$stmt = $conexion->prepare($query);
$stmt->bind_param("issssis", 
    $data->user_id,
    $data->nombre_completo,
    $data->direccion,
    $data->telefono,
    $data->correo,
    $data->edad,
    $data->experiencia_mascotas
);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode(array("message" => "Registro como adoptante exitoso"));
} else {
    http_response_code(500);
    echo json_encode(array("message" => "Error al registrarse como adoptante: " . $stmt->error));
}

$stmt->close();
?>
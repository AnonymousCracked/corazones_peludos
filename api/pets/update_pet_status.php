<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include_once '../config/conexion.php';

function verifyToken($token){
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
$petId = $_GET['id'] ?? 0;
$estado = $data->estado ?? '';

// Actualizar el estado de la mascota
$query = "UPDATE mascotas SET estado = ? WHERE id = ?";
$stmt = $conexion->prepare($query);
$stmt->bind_param("si", $estado, $petId);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode(array("message" => "Estado de mascota actualizado exitosamente"));
} else {
    http_response_code(500);
    echo json_encode(array("message" => "Error al actualizar estado: " . $stmt->error));
}

$stmt->close();
?>
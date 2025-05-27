<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
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

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(array("message" => "Metodo no permitido"));
    exit();
}

$userId = $_GET['id'] ?? 0;

// Verificar si el usuario existe en la tabla adoptantes
$query = "SELECT id FROM adoptantes WHERE id_usuario = ?";
$stmt = $conexion->prepare($query);
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

http_response_code(200);
echo json_encode(array("isAdopter" => $result->num_rows > 0));
$stmt->close();
?>
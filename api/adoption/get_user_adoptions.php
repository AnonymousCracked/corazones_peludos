<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include_once '../config/conexion.php';

$method = $_SERVER['REQUEST_METHOD'];
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : '';

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(array("message" => "Metodo no permitido"));
    exit();
}

$userId = $_GET['user_id'] ?? 0;

// Obtener solicitudes de adopcion del usuario
$query = "SELECT s.id, s.id_mascota, s.fecha_solicitud, s.estado, s.motivo 
          FROM solicitudes_adopcion s 
          JOIN adoptantes a ON s.id_adoptante = a.id 
          WHERE a.id_usuario = ? 
          ORDER BY s.fecha_solicitud DESC";
$stmt = $conexion->prepare($query);
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$requests = array();
while ($row = $result->fetch_assoc()) {
    $requests[] = $row;
}

http_response_code(200);
echo json_encode($requests);
$stmt->close();
?>
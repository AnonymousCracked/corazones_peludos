<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include_once '../config/conexion.php';
include_once '../helpers/jwt_helper.php';

try {
    // Verificar token
    $token = getBearerToken();
    $payload = verifyToken($token);
    
    $userId = $payload['id'];
    
    $query = "SELECT id, titulo, mensaje, tipo, fecha, leida 
              FROM notificaciones 
              WHERE id_usuario = ? 
              ORDER BY fecha DESC 
              LIMIT 20";
              
    $stmt = $conexion->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $notificaciones = [];
    while ($row = $result->fetch_assoc()) {
        $notificaciones[] = $row;
    }
    
    echo json_encode($notificaciones);
    
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["error" => $e->getMessage()]);
}
?>
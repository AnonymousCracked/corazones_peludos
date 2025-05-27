<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include_once '../config/conexion.php';

function verifyToken($token) {
    if (empty($token)) return false;
    try {
        $tokenParts = explode('.', $token);
        if (count($tokenParts) !== 3) return false;
        $payload = json_decode(base64_decode($tokenParts[1]), true);
        if (!$payload || !isset($payload['id'])) return false;
        return $payload;
    } catch (Exception $e) {
        return false;
    }
}

try {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    $token = (strpos($authHeader, 'Bearer ') === 0) ? substr($authHeader, 7) : '';
    
    $tokenData = verifyToken($token);
    if (!$tokenData) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Token no válido"]);
        exit();
    }

    $query = "SELECT 
                sr.id as solicitud_id,
                sr.motivo_reingreso,
                sr.monto_multa,
                sr.estado,
                sr.fecha_solicitud,
                ha.fecha_adopcion,
                m.nombre as nombre_mascota,
                m.raza,
                m.especie,
                u.nombre as nombre_usuario,
                u.email
              FROM solicitudes_reingreso sr
              INNER JOIN historial_adopciones ha ON sr.id_historial_adopcion = ha.id
              INNER JOIN mascotas m ON ha.id_mascota = m.id
              INNER JOIN adoptantes ad ON ha.id_adoptante = ad.id
              INNER JOIN usuarios u ON ad.id_usuario = u.id
              ORDER BY sr.fecha_solicitud DESC";
    
    $stmt = $conexion->prepare($query);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $requests = [];
    while ($row = $result->fetch_assoc()) {
        $requests[] = $row;
    }
    
    echo json_encode($requests);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error interno"]);
}
?>
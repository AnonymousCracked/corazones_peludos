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

    $userId = $tokenData['id'];

    $query = "SELECT 
                ha.id as historial_id,
                ha.fecha_adopcion,
                m.nombre,
                m.edad,
                m.raza,
                m.sexo,
                m.especie,
                m.imagen,
                CONCAT('../assets/img/', m.imagen) as imagen_ruta,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM solicitudes_reingreso sr 
                        WHERE sr.id_historial_adopcion = ha.id 
                        AND sr.estado = 'pendiente'
                    ) THEN 1 
                    ELSE 0 
                END as tiene_solicitud_pendiente
              FROM historial_adopciones ha
              INNER JOIN mascotas m ON ha.id_mascota = m.id
              INNER JOIN adoptantes a ON ha.id_adoptante = a.id
              WHERE a.id_usuario = ? AND ha.estado = 'activa'
              ORDER BY ha.fecha_adopcion DESC";
    
    $stmt = $conexion->prepare($query);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $adoptedPets = [];
    while ($row = $result->fetch_assoc()) {
        $adoptedPets[] = $row;
    }
    
    echo json_encode($adoptedPets);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error interno"]);
}
?>
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include_once '../config/conexion.php';

// Funcion para verificar token
function verifyToken($token) {
    if (empty($token)) {
        return false;
    }
    
    try {
        $tokenParts = explode('.', $token);
        if (count($tokenParts) !== 3) {
            return false;
        }
        
        $payload = json_decode(base64_decode($tokenParts[1]), true);
        
        if (!$payload || !isset($payload['id'])) {
            return false;
        }
        
        // Verificar expiracion si existe
        if (isset($payload['exp']) && time() > $payload['exp']) {
            return false;
        }
        
        return $payload;
        
    } catch (Exception $e) {
        return false;
    }
}

try {
    // Verificar metodo
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Metodo no permitido"]);
        exit();
    }

    // Verificar token
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    $token = '';
    
    if (strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
    }
    
    $tokenData = verifyToken($token);
    if (!$tokenData) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Token no valido"]);
        exit();
    }

    // Obtener todas las solicitudes de adopcion con informacion del usuario y mascota
    $query = "SELECT 
                s.id,
                s.id_mascota,
                s.fecha_solicitud,
                s.estado,
                s.motivo,
                u.nombre as nombre_usuario,
                u.email,
                a.telefono,
                a.direccion,
                m.nombre as nombre_mascota,
                m.raza,
                m.especie
              FROM solicitudes_adopcion s
              JOIN adoptantes ad ON s.id_adoptante = ad.id
              JOIN usuarios u ON ad.id_usuario = u.id
              LEFT JOIN adoptantes a ON u.id = a.id_usuario
              LEFT JOIN mascotas m ON s.id_mascota = m.id
              ORDER BY s.fecha_solicitud DESC";
    
    $stmt = $conexion->prepare($query);
    
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error preparando consulta: " . $conexion->error]);
        exit();
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $requests = [];
    while ($row = $result->fetch_assoc()) {
        $requests[] = [
            'id' => $row['id'],
            'id_mascota' => $row['id_mascota'],
            'fecha_solicitud' => $row['fecha_solicitud'],
            'estado' => $row['estado'],
            'motivo' => $row['motivo'],
            'nombre_usuario' => $row['nombre_usuario'],
            'email' => $row['email'],
            'telefono' => $row['telefono'],
            'direccion' => $row['direccion'],
            'nombre_mascota' => $row['nombre_mascota'],
            'raza' => $row['raza'],
            'especie' => $row['especie']
        ];
    }
    
    echo json_encode($requests);
    
} catch (Exception $e) {
    error_log("Error en get_adoption_requests.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Error interno del servidor",
        "debug" => $e->getMessage()
    ]);
} finally {
    if (isset($conexion)) {
        $conexion->close();
    }
}
?>
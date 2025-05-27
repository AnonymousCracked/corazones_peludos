<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include_once '../config/conexion.php';

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

    $requestId = $_GET['id'] ?? 0;

    if (!$requestId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID de solicitud requerido"]);
        exit();
    }

    $query = "SELECT s.id, s.id_adoptante, s.id_mascota, s.estado, s.motivo, s.fecha_solicitud 
              FROM solicitudes_adopcion s
              INNER JOIN adoptantes a ON s.id_adoptante = a.id
              WHERE s.id = ? AND a.id_usuario = ?";
    
    $stmt = $conexion->prepare($query);
    
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error preparando consulta: " . $conexion->error]);
        exit();
    }
    
    $stmt->bind_param("ii", $requestId, $tokenData['id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $request = $result->fetch_assoc();
        http_response_code(200);
        echo json_encode($request);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Solicitud no encontrada"]);
    }
    
    $stmt->close();

} catch (Exception $e) {
    error_log("Error en get_adoption_request.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Error interno del servidor"
    ]);
} finally {
    if (isset($conexion)) {
        $conexion->close();
    }
}
?>
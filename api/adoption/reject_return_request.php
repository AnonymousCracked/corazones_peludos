<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
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

    $solicitudId = $_GET['id'] ?? 0;

    $updateQuery = "UPDATE solicitudes_reingreso 
                    SET estado = 'rechazada', fecha_respuesta = NOW() 
                    WHERE id = ? AND estado = 'pendiente'";
    
    $stmt = $conexion->prepare($updateQuery);
    $stmt->bind_param("i", $solicitudId);
    
    if ($stmt->execute() && $stmt->affected_rows > 0) {
        echo json_encode([
            "success" => true, 
            "message" => "Solicitud rechazada correctamente"
        ]);
    } else {
        echo json_encode([
            "success" => false, 
            "message" => "Solicitud no encontrada o ya procesada"
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error interno"]);
}
?>
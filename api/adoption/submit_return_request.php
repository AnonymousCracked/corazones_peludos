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

    $data = json_decode(file_get_contents("php://input"), true);
    $historialId = $data['historial_id'];
    $motivoReingreso = $data['motivo_reingreso'];
    $userId = $tokenData['id'];

    // Verificar que el historial pertenece al usuario
    $verifyQuery = "SELECT ha.id FROM historial_adopciones ha
                    INNER JOIN adoptantes a ON ha.id_adoptante = a.id
                    WHERE ha.id = ? AND a.id_usuario = ? AND ha.estado = 'activa'";
    
    $verifyStmt = $conexion->prepare($verifyQuery);
    $verifyStmt->bind_param("ii", $historialId, $userId);
    $verifyStmt->execute();
    
    if ($verifyStmt->get_result()->num_rows === 0) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "No autorizado"]);
        exit();
    }

    // Verificar que no existe solicitud pendiente
    $existingQuery = "SELECT id FROM solicitudes_reingreso WHERE id_historial_adopcion = ? AND estado = 'pendiente'";
    $existingStmt = $conexion->prepare($existingQuery);
    $existingStmt->bind_param("i", $historialId);
    $existingStmt->execute();
    
    if ($existingStmt->get_result()->num_rows > 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Ya existe una solicitud pendiente"]);
        exit();
    }

    // Insertar solicitud
    $insertQuery = "INSERT INTO solicitudes_reingreso (id_historial_adopcion, motivo_reingreso, monto_multa) 
                    VALUES (?, ?, 500.00)";
    
    $insertStmt = $conexion->prepare($insertQuery);
    $insertStmt->bind_param("is", $historialId, $motivoReingreso);
    
    if ($insertStmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Solicitud enviada correctamente",
            "monto_multa" => 500.00
        ]);
    } else {
        throw new Exception("Error al insertar solicitud");
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error interno"]);
}
?>
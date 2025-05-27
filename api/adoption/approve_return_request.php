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

    $conexion->begin_transaction();

    try {
        // Obtener información
        $query = "SELECT sr.id_historial_adopcion, ha.id_mascota, m.nombre 
                  FROM solicitudes_reingreso sr
                  INNER JOIN historial_adopciones ha ON sr.id_historial_adopcion = ha.id
                  INNER JOIN mascotas m ON ha.id_mascota = m.id
                  WHERE sr.id = ? AND sr.estado = 'pendiente'";
        
        $stmt = $conexion->prepare($query);
        $stmt->bind_param("i", $solicitudId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            throw new Exception("Solicitud no encontrada");
        }
        
        $data = $result->fetch_assoc();

        // Aprobar solicitud
        $updateSolicitud = "UPDATE solicitudes_reingreso SET estado = 'aprobada', fecha_respuesta = NOW() WHERE id = ?";
        $stmt = $conexion->prepare($updateSolicitud);
        $stmt->bind_param("i", $solicitudId);
        $stmt->execute();

        // Marcar historial como reingresada
        $updateHistorial = "UPDATE historial_adopciones SET estado = 'reingresada' WHERE id = ?";
        $stmt = $conexion->prepare($updateHistorial);
        $stmt->bind_param("i", $data['id_historial_adopcion']);
        $stmt->execute();

        // Marcar mascota como disponible
        $updateMascota = "UPDATE mascotas SET estado = 'disponible' WHERE id = ?";
        $stmt = $conexion->prepare($updateMascota);
        $stmt->bind_param("i", $data['id_mascota']);
        $stmt->execute();

        $conexion->commit();

        echo json_encode([
            "success" => true, 
            "message" => "Solicitud aprobada. " . $data['nombre'] . " está disponible para adopción."
        ]);

    } catch (Exception $e) {
        $conexion->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
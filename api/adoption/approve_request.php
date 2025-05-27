<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include_once '../config/conexion.php';

// Función para verificar token (igual que antes)
function verifyToken($token) {
    if (empty($token)) return false;
    try {
        $tokenParts = explode('.', $token);
        if (count($tokenParts) !== 3) return false;
        $payload = json_decode(base64_decode($tokenParts[1]), true);
        if (!$payload || !isset($payload['id'])) return false;
        if (isset($payload['exp']) && time() > $payload['exp']) return false;
        return $payload;
    } catch (Exception $e) {
        return false;
    }
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Método no permitido"]);
        exit();
    }

    // Verificar token
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    $token = (strpos($authHeader, 'Bearer ') === 0) ? substr($authHeader, 7) : '';
    
    $tokenData = verifyToken($token);
    if (!$tokenData) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Token no válido"]);
        exit();
    }

    $requestId = $_GET['id'] ?? 0;
    if (!$requestId || !is_numeric($requestId)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID de solicitud inválido"]);
        exit();
    }

    // Iniciar transacción
    $conexion->begin_transaction();

    try {
        // PASO 1: Obtener el ID de la mascota de la solicitud
        $query = "SELECT id_mascota FROM solicitudes_adopcion WHERE id = ?";
        $stmt = $conexion->prepare($query);
        $stmt->bind_param("i", $requestId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            throw new Exception("Solicitud no encontrada");
        }
        
        $mascotaId = $result->fetch_assoc()['id_mascota'];

        // PASO 2: Marcar la solicitud como "aprobada"
        $query = "UPDATE solicitudes_adopcion SET estado = 'aprobada' WHERE id = ?";
        $stmt = $conexion->prepare($query);
        $stmt->bind_param("i", $requestId);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            throw new Exception("No se pudo actualizar la solicitud");
        }

        // PASO 3: Marcar la mascota como "adoptada" (sin asignar dueño)
        $query = "UPDATE mascotas SET estado = 'adoptada' WHERE id = ?";
        $stmt = $conexion->prepare($query);
        $stmt->bind_param("i", $mascotaId);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            throw new Exception("No se pudo actualizar la mascota");
        }


        

        // Confirmar transacción
        $conexion->commit();

        echo json_encode([
            "success" => true, 
            "message" => "✅ Solicitud aprobada. Mascota marcada como adoptada.",
            "mascota_id" => $mascotaId
        ]);

    } catch (Exception $e) {
        $conexion->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Error en approve_request.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} finally {
    if (isset($conexion)) $conexion->close();
}
?>
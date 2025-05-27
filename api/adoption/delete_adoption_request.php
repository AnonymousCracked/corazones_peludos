<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include_once '../config/conexion.php';

// Desactivar mensajes de error en produccion
ini_set('display_errors', 0);
error_reporting(0);

function verifyToken($token) {
    if (empty($token)) {
        return false;
    }
    
    try {
        // Decodificar el token JWT (parte del payload)
        $tokenParts = explode('.', $token);
        if (count($tokenParts) !== 3) {
            return false;
        }
        
        $payload = json_decode(base64_decode($tokenParts[1]), true);
        return isset($payload['id']) ? $payload : false;
    } catch (Exception $e) {
        return false;
    }
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $headers = getallheaders();
    $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : '';
    
    $tokenData = verifyToken($token);
    if (!$tokenData) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Token no valido"]);
        exit();
    }

    if ($method !== 'DELETE') {
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Metodo no permitido"]);
        exit();
    }

    $requestId = $_GET['id'] ?? 0;
    $userId = $tokenData['id'];

    if (!$requestId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID de solicitud requerido"]);
        exit();
    }
    // Pasos

    // PASO 1: Obtener informacion de la solicitud Y la mascota asociada ANTES de eliminar
    $getInfoQuery = "SELECT s.id, s.id_mascota, m.id as mascota_id 
                     FROM solicitudes_adopcion s
                     INNER JOIN mascotas m ON s.id_mascota = m.id
                     INNER JOIN adoptantes a ON s.id_adoptante = a.id
                     WHERE s.id = ? AND a.id_usuario = ?";
    
    $stmt = $conexion->prepare($getInfoQuery);
    $stmt->bind_param("ii", $requestId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "No tienes permiso para eliminar esta solicitud o no existe"]);
        exit();
    }
    
    $solicitudInfo = $result->fetch_assoc();
    $petId = $solicitudInfo['id_mascota'];

    // PASO 2: Iniciar transaccion para atomicidad
    $conexion->begin_transaction();

    try {
        // PASO 3: Eliminar la solicitud
        $deleteQuery = "DELETE FROM solicitudes_adopcion WHERE id = ?";
        $stmt = $conexion->prepare($deleteQuery);
        $stmt->bind_param("i", $requestId);
        
        if (!$stmt->execute()) {
            throw new Exception("Error al eliminar la solicitud");
        }

        // PASO 4: Actualizar estado de la mascota a 'disponible'
        $updatePetQuery = "UPDATE mascotas SET estado = 'disponible' WHERE id = ?";
        $stmt = $conexion->prepare($updatePetQuery);
        $stmt->bind_param("i", $petId);
        
        if (!$stmt->execute()) {
            throw new Exception("Error al actualizar estado de la mascota");
        }

        // PASO 5: Confirmar transaccion
        $conexion->commit();
        
        echo json_encode([
            "success" => true, 
            "message" => "Solicitud eliminada correctamente",
            "pet_id" => $petId,
            "pet_updated" => true
        ]);

    } catch (Exception $e) {
        // Revertir cambios si algo falla
        $conexion->rollback();
        throw $e;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Error interno: " . $e->getMessage()
    ]);
} finally {
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($conexion)) {
        $conexion->close();
    }
}
?>
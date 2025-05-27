<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include_once '../config/conexion.php';

// Desactivar visualizacion de errores en produccion
ini_set('display_errors', 0);
error_reporting(0);

function verifyToken($token) {
    return !empty($token);
}

// Verificar metodo y token
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Metodo no permitido']);
    exit();
}

$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : '';

if (!verifyToken($token)) {
    http_response_code(401);
    echo json_encode(['message' => 'Token no valido']);
    exit();
}

try {
    // Obtener datos del cuerpo de la solicitud
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Datos JSON invalidos');
    }

    // Validar datos requeridos
    if (empty($data['user_id']) || empty($data['pet_id']) || empty($data['motivo'])) {
        throw new Exception('Datos incompletos');
    }

    // Verificar si el usuario es adoptante
    $stmt = $conexion->prepare("SELECT id FROM adoptantes WHERE id_usuario = ?");
    $stmt->bind_param("i", $data['user_id']);
    $stmt->execute();
    
    if (!$stmt->get_result()->num_rows) {
        throw new Exception('Usuario no registrado como adoptante');
    }

    // Insertar solicitud
    $insertStmt = $conexion->prepare(
        "INSERT INTO solicitudes_adopcion 
        (id_adoptante, id_mascota, fecha_solicitud, estado, motivo) 
        VALUES ((SELECT id FROM adoptantes WHERE id_usuario = ?), ?, NOW(), 'pendiente', ?)"
    );
    
    $insertStmt->bind_param("iis", $data['user_id'], $data['pet_id'], $data['motivo']);
    
    if ($insertStmt->execute()) {
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Solicitud creada exitosamente'
        ]);
    } else {
        throw new Exception('Error al crear solicitud: ' . $insertStmt->error);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
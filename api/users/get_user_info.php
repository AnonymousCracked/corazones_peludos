<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include("../config/conexion.php");

// Verificar metodo POST
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'MÃ©todo no permitido']);
    exit;
}

// Leer datos de entrada
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$user_id = $data['user_id'] ?? '';

if (empty($user_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
    exit;
}

try {
    // Obtener informacion de la tabla usuarios
    $stmt_user = $conexion->prepare("SELECT id, nombre, email, rol, fecha_registro FROM usuarios WHERE id = ?");
    $stmt_user->bind_param("i", $user_id);
    $stmt_user->execute();
    $result_user = $stmt_user->get_result();
    
    if ($user_data = $result_user->fetch_assoc()) {
        // Obtener informacion de la tabla adoptantes si existe
        $stmt_adoptante = $conexion->prepare("
            SELECT nombre_completo, direccion, telefono, correo, edad, experiencia_mascotas 
            FROM adoptantes 
            WHERE id_usuario = ?
        ");
        $stmt_adoptante->bind_param("i", $user_id);
        $stmt_adoptante->execute();
        $result_adoptante = $stmt_adoptante->get_result();
        
        $adoptante_data = null;
        if ($result_adoptante->num_rows > 0) {
            $adoptante_data = $result_adoptante->fetch_assoc();
        }
        
        echo json_encode([
            'success' => true,
            'userInfo' => $user_data,
            'adoptanteInfo' => $adoptante_data
        ]);
        
        $stmt_adoptante->close();
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
    }
    
    $stmt_user->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error al obtener informacion del usuario',
        'error' => $e->getMessage()
    ]);
}

$conexion->close();
?>
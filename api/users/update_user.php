<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include("../config/conexion.php");

// Verificar metodo POST
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metodo no permitido']);
    exit;
}

// Leer datos de entrada
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validar datos requeridos
$user_id = $data['user_id'] ?? '';
$nombre = $data['nombre'] ?? '';
$email = $data['email'] ?? '';
$current_password = $data['current_password'] ?? '';
$new_password = $data['new_password'] ?? '';

// Datos opcionales de adoptante
$telefono = $data['telefono'] ?? '';
$direccion = $data['direccion'] ?? '';
$edad = $data['edad'] ?? null;
$experiencia_mascotas = $data['experiencia_mascotas'] ?? '';

if (empty($user_id) || empty($nombre) || empty($email) || empty($current_password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

try {
    // Verificar contraseña actual
    $stmt_verify = $conexion->prepare("SELECT password FROM usuarios WHERE id = ?");
    $stmt_verify->bind_param("i", $user_id);
    $stmt_verify->execute();
    $result = $stmt_verify->get_result();
    
    if ($user = $result->fetch_assoc()) {
        if (!password_verify($current_password, $user['password'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Contraseña actual incorrecta']);
            exit;
        }
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        exit;
    }
    
    // Verificar si el nuevo email ya existe
    $stmt_email = $conexion->prepare("SELECT id FROM usuarios WHERE email = ? AND id != ?");
    $stmt_email->bind_param("si", $email, $user_id);
    $stmt_email->execute();
    if ($stmt_email->get_result()->num_rows > 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'El correo electrÃ³nico ya estÃ¡ registrado']);
        exit;
    }
    
    // Iniciar transaccion
    $conexion->begin_transaction();
    
    // Actualizar tabla usuarios
    if (!empty($new_password)) {
        $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
        $stmt_user = $conexion->prepare("UPDATE usuarios SET nombre = ?, email = ?, password = ? WHERE id = ?");
        $stmt_user->bind_param("sssi", $nombre, $email, $hashed_password, $user_id);
    } else {
        $stmt_user = $conexion->prepare("UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?");
        $stmt_user->bind_param("ssi", $nombre, $email, $user_id);
    }
    
    if (!$stmt_user->execute()) {
        throw new Exception("Error al actualizar datos de usuario");
    }
    
    // Verificar si existe registro en adoptantes
    $stmt_check = $conexion->prepare("SELECT id FROM adoptantes WHERE id_usuario = ?");
    $stmt_check->bind_param("i", $user_id);
    $stmt_check->execute();
    $adoptante_exists = $stmt_check->get_result()->num_rows > 0;
    
    // Si hay datos de adoptante para guardar
    if ($telefono || $direccion || $edad || $experiencia_mascotas) {
        if ($adoptante_exists) {
            // Actualizar registro existente
            $stmt_adoptante = $conexion->prepare("
                UPDATE adoptantes 
                SET nombre_completo = ?, direccion = ?, telefono = ?, 
                    correo = ?, edad = ?, experiencia_mascotas = ?
                WHERE id_usuario = ?
            ");
            $stmt_adoptante->bind_param("ssssisi", $nombre, $direccion, $telefono, 
                                      $email, $edad, $experiencia_mascotas, $user_id);
        } else {
            // Crear nuevo registro
            $stmt_adoptante = $conexion->prepare("
                INSERT INTO adoptantes (id_usuario, nombre_completo, direccion, 
                                      telefono, correo, edad, experiencia_mascotas)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt_adoptante->bind_param("issssis", $user_id, $nombre, $direccion, 
                                      $telefono, $email, $edad, $experiencia_mascotas);
        }
        
        if (!$stmt_adoptante->execute()) {
            throw new Exception("Error al actualizar datos de adoptante");
        }
    }
    
    // Confirmar transaccion
    $conexion->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Informacion actualizada correctamente'
    ]);
    
} catch (Exception $e) {
    // Revertir cambios en caso de error
    $conexion->rollback();
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar la informaciÃ³n',
        'error' => $e->getMessage()
    ]);
}

$conexion->close();
?>
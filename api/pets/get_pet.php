<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include_once '../config/conexion.php';

function verifyToken($token) {
    return !empty($token);
}

$method = $_SERVER['REQUEST_METHOD'];
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : '';

if (!verifyToken($token)) {
    http_response_code(401);
    echo json_encode(array("message" => "Token no valido"));
    exit();
}

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(array("message" => "Metodo no permitido"));
    exit();
}

$petId = $_GET['id'] ?? 0;

if (!$petId) {
    http_response_code(400);
    echo json_encode(array("message" => "ID de mascota requerido"));
    exit();
}

try {
    $query = "SELECT id, nombre, edad, raza, sexo, estado_salud, especie, estado, imagen 
              FROM mascotas 
              WHERE id = ?";
    
    $stmt = $conexion->prepare($query);
    
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conexion->error);
    }
    
    $stmt->bind_param("i", $petId);
    
    if (!$stmt->execute()) {
        throw new Exception("Error al ejecutar la consulta: " . $stmt->error);
    }
    
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $pet = $result->fetch_assoc();
        
        $pet['imagen_ruta'] = !empty($pet['imagen']) ? '../img/' . $pet['imagen'] : '../img/default-pet.png';
        
        http_response_code(200);
        echo json_encode($pet);
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Mascota no encontrada"));
    }

    $stmt->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "message" => "Error interno del servidor",
        "error" => $e->getMessage()
    ));
}
?>
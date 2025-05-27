<?php 
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8"); 
header("Access-Control-Allow-Methods: POST"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization"); 

include_once '../config/conexion.php'; 

function verifyToken($token) {
    if (empty($token)) {
        return false;
    }
    return true;
}

function isAdmin() {
    return true;
}

$method = $_SERVER['REQUEST_METHOD'];
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : '';

if (!verifyToken($token)) {
    http_response_code(401);
    echo json_encode(array("message" => "Token no valido"));
    exit();
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(array("message" => "Metodo no permitido"));
    exit();
}

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(array("message" => "No tienes permisos de administrador"));
    exit();
}

// Cambiamos a recibir datos de formulario multipart para manejar la imagen
$nombre = $_POST['nombre'] ?? '';
$edad = $_POST['edad'] ?? '';
$raza = $_POST['raza'] ?? '';
$sexo = $_POST['sexo'] ?? '';
$estado_salud = $_POST['estado_salud'] ?? '';
$especie = $_POST['especie'] ?? '';
$estado = $_POST['estado'] ?? 'disponible';
$imagen = $_FILES['imagen'] ?? null;

if (empty($nombre) || empty($edad) || empty($raza) || empty($sexo) || empty($estado_salud) || empty($especie) || empty($estado) || empty($imagen)) {
    http_response_code(400);
    echo json_encode(array("message" => "Todos los campos son obligatorios"));
    exit();
}

// Procesar la imagen
$nombreImagen = '';
if ($imagen && $imagen['error'] === UPLOAD_ERR_OK) {
    // Generar nombre de la imagen: nombre + raza + extension
    $nombreSinEspacios = preg_replace('/\s+/', '', $nombre);
    $razaSinEspacios = preg_replace('/\s+/', '', $raza);
    $extension = pathinfo($imagen['name'], PATHINFO_EXTENSION);
    $nombreImagen = ucfirst(strtolower($nombreSinEspacios)) . ucfirst(strtolower($razaSinEspacios)) . '.' . $extension;
    
    // Directorio donde se guardaran las imagenes (debe existir y tener permisos)
    $directorioImagenes = __DIR__ . '/../../assets/img/';
    
    // Mover el archivo subido al directorio de imagenes
    if (!move_uploaded_file($imagen['tmp_name'], $directorioImagenes . $nombreImagen)) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al subir la imagen"));
        exit();
    }
}

$query = "INSERT INTO mascotas (nombre, edad, raza, sexo, estado_salud, especie, estado, imagen) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = $conexion->prepare($query);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(array("message" => "Error en la preparacion de la consulta: " . $conexion->error));
    exit();
}

$stmt->bind_param("sissssss", $nombre, $edad, $raza, $sexo, $estado_salud, $especie, $estado, $nombreImagen);
if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode(array("message" => "Mascota agregada exitosamente", "id" => $stmt->insert_id));
} else {
    http_response_code(500);
    echo json_encode(array("message" => "Error al agregar mascota: " . $stmt->error));
}

$stmt->close();
?>
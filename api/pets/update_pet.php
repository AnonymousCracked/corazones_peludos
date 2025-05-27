<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
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

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(array("message" => "Metodo no permitido"));
    exit();
}

// Obtener datos del formulario
$petId = $_POST['pet_id'] ?? 0;
$nombre = trim($_POST['nombre'] ?? '');
$edad = intval($_POST['edad'] ?? 0);
$raza = trim($_POST['raza'] ?? '');
$sexo = trim($_POST['sexo'] ?? '');
$estado_salud = trim($_POST['estado_salud'] ?? '');
$especie = trim($_POST['especie'] ?? '');
$estado = trim($_POST['estado'] ?? 'disponible');

// Validar campos requeridos
if (!$petId || empty($nombre) || empty($raza) || empty($sexo) || empty($estado_salud) || empty($especie)) {
    http_response_code(400);
    echo json_encode(array("message" => "Todos los campos son requeridos"));
    exit();
}

if ($edad < 0 || $edad > 30) {
    http_response_code(400);
    echo json_encode(array("message" => "La edad debe estar entre 0 y 30 años"));
    exit();
}

// Validar enum values
$validSexo = ['macho', 'hembra'];
$validEstadoSalud = ['bueno', 'regular', 'malo'];
$validEstado = ['disponible', 'procesando'];

if (!in_array($sexo, $validSexo)) {
    http_response_code(400);
    echo json_encode(array("message" => "Sexo debe ser: macho o hembra"));
    exit();
}

if (!in_array($estado_salud, $validEstadoSalud)) {
    http_response_code(400);
    echo json_encode(array("message" => "Estado de salud debe ser: bueno, regular o malo"));
    exit();
}

try {
    // Verificar que la mascota existe y obtener imagen actual
    $checkQuery = "SELECT id, imagen FROM mascotas WHERE id = ?";
    $checkStmt = $conexion->prepare($checkQuery);
    $checkStmt->bind_param("i", $petId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows === 0) {
        http_response_code(404);
        echo json_encode(array("message" => "Mascota no encontrada"));
        exit();
    }

    $existingPet = $checkResult->fetch_assoc();
    $checkStmt->close();

    // Manejar la imagen si se subio una nueva
    $imagenNombre = $existingPet['imagen']; // Mantener la imagen actual por defecto

    if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../../assets/img/';
        
        // Crear directorio si no existe
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $imageFileType = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));
        $allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        if (!in_array($imageFileType, $allowedTypes)) {
            http_response_code(400);
            echo json_encode(array("message" => "Solo se permiten archivos JPG, JPEG, PNG, GIF y WEBP"));
            exit();
        }

        // Generar nombre unico para la imagen
        $fileName = 'pet_' . $petId . '_' . time() . '.' . $imageFileType;
        $targetPath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['imagen']['tmp_name'], $targetPath)) {
            // Eliminar imagen anterior si existe y no es la imagen por defecto
            if ($existingPet['imagen'] && 
                $existingPet['imagen'] !== 'default-pet.png' &&
                file_exists($uploadDir . $existingPet['imagen'])) {
                unlink($uploadDir . $existingPet['imagen']);
            }
            
            $imagenNombre = $fileName; // Solo guardamos el nombre del archivo
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Error al subir la imagen"));
            exit();
        }
    }

    // Actualizar la mascota
    $query = "UPDATE mascotas 
              SET nombre = ?, edad = ?, raza = ?, sexo = ?, estado_salud = ?, 
                  especie = ?, estado = ?, imagen = ?
              WHERE id = ?";
    $stmt = $conexion->prepare($query);
    $stmt->bind_param("sissssssi", $nombre, $edad, $raza, $sexo, $estado_salud, $especie, $estado, $imagenNombre, $petId);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(array(
            "message" => "Mascota actualizada correctamente",
            "success" => true,
            "pet_id" => $petId
        ));
    } else {
        http_response_code(500);
        echo json_encode(array("message" => "Error al actualizar la mascota: " . $stmt->error));
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
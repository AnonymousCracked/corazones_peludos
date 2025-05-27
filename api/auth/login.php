<?php
// Configuracion para mostrar todos los errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Manejar solicitudes OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    exit(0);
}

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

session_start();

function generateSimpleToken($userId, $email) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'id' => $userId,
        'email' => $email,
        'iat' => time(),
        'exp' => time() + (24 * 60 * 60) // Expira en 24 horas
    ]);
    
    $headerEncoded = base64_encode($header);
    $payloadEncoded = base64_encode($payload);
    $signature = hash('sha256', $headerEncoded . "." . $payloadEncoded . "secret_key");
    
    return $headerEncoded . "." . $payloadEncoded . "." . $signature;
}

// Conexion a la BD con manejo de errores detallado
$conn = new mysqli("localhost", "root", "", "corazones_peludos");

// Verificar conexiÃ³n
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error de conexion a la base de datos',
        'error_details' => $conn->connect_error
    ]);
    exit;
}

// Procesar peticion POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Leer datos de entrada
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    // Si no se pudo parsear JSON, intentar con POST
    if (!$data) {
        $data = $_POST;
    }

    // Imprimir todos los datos recibidos (para debug)
    error_log("Datos recibidos: " . print_r($data, true));

    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    // Validar campos vacios
    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Email y contraseña son obligatorios.',
            'received_email' => $email,
            'received_password_length' => strlen($password)
        ]);
        exit;
    }

    // Preparar y ejecutar la consulta con manejo de errores
    $stmt = $conn->prepare("SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ?");
    
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Error en la preparacion de la consulta',
            'error_details' => $conn->error
        ]);
        exit;
    }

    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    // Validar usuario
    if ($user = $result->fetch_assoc()) {
        // Imprime info del usuario (solo para debug)
        error_log("Usuario encontrado: " . print_r($user, true));

        // Verificar contraseña
        if (password_verify($password, $user['password'])) {
            $_SESSION['usuario_id'] = $user['id'];
            $_SESSION['rol'] = $user['rol'];

            // GENERAR TOKEN
            $token = generateSimpleToken($user['id'], $user['email']);

            echo json_encode([
                'success' => true,
                'token' => $token,  // AGREGAR ESTA LÃNEA
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['nombre'],
                    'email' => $user['email'],
                    'rol' => $user['rol']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode([
                'success' => false, 
                'message' => 'Contraseña incorrecta.',
                'debug' => [
                    'stored_hash' => $user['password'],
                    'input_password' => $password
                ]
            ]);
        }
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false, 
            'message' => 'Usuario no encontrado.',
            'received_email' => $email
        ]);
    }

    $stmt->close();
    $conn->close();
}
?>
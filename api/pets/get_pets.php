<?php 
header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json; charset=UTF-8"); 
header("Access-Control-Allow-Methods: GET"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization"); 

include_once '../config/conexion.php'; 

$method = $_SERVER['REQUEST_METHOD'];
$headers = getallheaders();

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(array("message" => "Metodo no permitido"));
    exit();
}

// Consulta para la verificacion de solicitudes pendientes
$query = "SELECT 
            m.*, 
            CONCAT('../assets/img/', m.imagen) as imagen_ruta,
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM solicitudes_adopcion s 
                    WHERE s.id_mascota = m.id 
                    AND s.estado = 'pendiente'
                ) THEN 1 
                ELSE 0 
            END as has_pending_request
          FROM mascotas m 
          ORDER BY m.id DESC";

$result = $conexion->query($query);

if (!$result) {
    http_response_code(500);
    echo json_encode(array("message" => "Error al obtener mascotas: " . $conexion->error));
    exit();
}

$pets = array();
while ($row = $result->fetch_assoc()) {
    // Convertir has_pending_request a boolean
    $row['has_pending_request'] = (bool)$row['has_pending_request'];
    $pets[] = $row;
}

http_response_code(200);
echo json_encode($pets);
?>
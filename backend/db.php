<?php
/**
 * db.php — shared database connection (Amazon RDS MySQL)
 * Edit the 4 values below to match your RDS instance.
 * (Member 6/Member 5: RDS endpoint is shown on the RDS console
 *  "Connectivity & security" tab.)
 */

// ---- EDIT THESE FOR YOUR RDS INSTANCE ----
define('DB_HOST', 'your-rds-endpoint.xxxxxxxxxx.ap-south-1.rds.amazonaws.com');
define('DB_NAME', 'cloudcart');
define('DB_USER', 'admin');
define('DB_PASS', 'YourPasswordHere');
// -------------------------------------------

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                 PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Database connection failed']);
            exit;
        }
    }
    return $pdo;
}

// Common headers for every API endpoint
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// simple helper to read JSON body
function body() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

// very small session-token helper (demo-level auth, not production grade)
session_start();

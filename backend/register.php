<?php
require 'db.php';
$data = body();

$name  = trim($data['name'] ?? '');
$email = trim(strtolower($data['email'] ?? ''));
$pass  = $data['password'] ?? '';

if (!$name || !$email || strlen($pass) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Name, valid email and a password of 6+ characters are required']);
    exit;
}
if (!preg_match('/^[a-zA-Z0-9._%+-]+@gmail\.com$/', $email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Please use a Gmail address']);
    exit;
}

$db = getDB();

$stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'error' => 'An account with this email already exists']);
    exit;
}

$hash = password_hash($pass, PASSWORD_BCRYPT);
$stmt = $db->prepare('INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)');
$stmt->execute([$name, $email, $hash]);
$userId = $db->lastInsertId();

$_SESSION['user_id'] = $userId;

echo json_encode([
    'success' => true,
    'user' => ['id' => $userId, 'name' => $name, 'email' => $email]
]);

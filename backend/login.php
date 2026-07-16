<?php
require 'db.php';
$data = body();

$email = trim(strtolower($data['email'] ?? ''));
$pass  = $data['password'] ?? '';

if (!$email || !$pass) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email and password are required']);
    exit;
}

$db = getDB();
$stmt = $db->prepare('SELECT id, full_name, email, password_hash FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($pass, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Invalid email or password']);
    exit;
}

$_SESSION['user_id'] = $user['id'];

echo json_encode([
    'success' => true,
    'user' => ['id' => $user['id'], 'name' => $user['full_name'], 'email' => $user['email']]
]);

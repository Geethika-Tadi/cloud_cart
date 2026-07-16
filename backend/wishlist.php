<?php
require 'db.php';
$db = getDB();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Please sign in first']);
    exit;
}
$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->prepare(
        'SELECT p.* FROM wishlist w JOIN products p ON p.id = w.product_id WHERE w.user_id = ?'
    );
    $stmt->execute([$userId]);
    echo json_encode(['success' => true, 'items' => $stmt->fetchAll()]);
    exit;
}

$data = body();
$action = $data['action'] ?? '';
$productId = (int)($data['product_id'] ?? 0);

if ($method === 'POST' && $action === 'add') {
    $stmt = $db->prepare('INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)');
    $stmt->execute([$userId, $productId]);
    echo json_encode(['success' => true]);
    exit;
}

if ($method === 'POST' && $action === 'remove') {
    $stmt = $db->prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?');
    $stmt->execute([$userId, $productId]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Unknown action']);

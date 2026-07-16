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
    // Return the cart joined with product info, plus computed totals
    $stmt = $db->prepare(
        'SELECT c.product_id, c.quantity, p.name, p.price, p.image_url
         FROM cart c JOIN products p ON p.id = c.product_id
         WHERE c.user_id = ?'
    );
    $stmt->execute([$userId]);
    $items = $stmt->fetchAll();

    $total = 0;
    foreach ($items as $item) { $total += $item['price'] * $item['quantity']; }

    echo json_encode(['success' => true, 'items' => $items, 'total' => $total]);
    exit;
}

$data = body();
$action = $data['action'] ?? '';

if ($method === 'POST' && $action === 'add') {
    $productId = (int)$data['product_id'];
    $qty       = max(1, (int)($data['quantity'] ?? 1));

    $stmt = $db->prepare(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)'
    );
    $stmt->execute([$userId, $productId, $qty]);
    echo json_encode(['success' => true]);
    exit;
}

if ($method === 'POST' && $action === 'update') {
    $productId = (int)$data['product_id'];
    $qty       = (int)$data['quantity'];

    if ($qty <= 0) {
        $stmt = $db->prepare('DELETE FROM cart WHERE user_id = ? AND product_id = ?');
        $stmt->execute([$userId, $productId]);
    } else {
        $stmt = $db->prepare('UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?');
        $stmt->execute([$qty, $userId, $productId]);
    }
    echo json_encode(['success' => true]);
    exit;
}

if ($method === 'POST' && $action === 'remove') {
    $productId = (int)$data['product_id'];
    $stmt = $db->prepare('DELETE FROM cart WHERE user_id = ? AND product_id = ?');
    $stmt->execute([$userId, $productId]);
    echo json_encode(['success' => true]);
    exit;
}

if ($method === 'POST' && $action === 'clear') {
    $stmt = $db->prepare('DELETE FROM cart WHERE user_id = ?');
    $stmt->execute([$userId]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Unknown action']);

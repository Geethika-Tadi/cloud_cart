<?php
require 'db.php';
$db = getDB();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Please sign in first']);
    exit;
}
$userId = $_SESSION['user_id'];

$stmt = $db->prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC');
$stmt->execute([$userId]);
$orders = $stmt->fetchAll();

foreach ($orders as &$order) {
    $stmt2 = $db->prepare(
        'SELECT oi.quantity, oi.price, p.name, p.image_url
         FROM order_items oi JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?'
    );
    $stmt2->execute([$order['id']]);
    $order['items'] = $stmt2->fetchAll();
}

echo json_encode(['success' => true, 'orders' => $orders]);

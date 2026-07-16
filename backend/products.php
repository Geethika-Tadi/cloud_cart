<?php
require 'db.php';
$db = getDB();

// GET /products.php            -> all products
// GET /products.php?id=5       -> single product
// GET /products.php?category=Sports&search=shoe -> filtered

if (isset($_GET['id'])) {
    $stmt = $db->prepare('SELECT * FROM products WHERE id = ?');
    $stmt->execute([(int)$_GET['id']]);
    $product = $stmt->fetch();
    if (!$product) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Product not found']);
        exit;
    }
    echo json_encode(['success' => true, 'product' => $product]);
    exit;
}

$sql = 'SELECT * FROM products WHERE 1=1';
$params = [];

if (!empty($_GET['category']) && $_GET['category'] !== 'All') {
    $sql .= ' AND category = ?';
    $params[] = $_GET['category'];
}
if (!empty($_GET['search'])) {
    $sql .= ' AND name LIKE ?';
    $params[] = '%' . $_GET['search'] . '%';
}
$sql .= ' ORDER BY id ASC';

$stmt = $db->prepare($sql);
$stmt->execute($params);
echo json_encode(['success' => true, 'products' => $stmt->fetchAll()]);

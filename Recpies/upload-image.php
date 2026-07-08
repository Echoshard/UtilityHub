<?php
declare(strict_types=1);

require_once __DIR__ . '/recipes-config.php';

header('Content-Type: application/json; charset=utf-8');
@ini_set('display_errors', '0');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$adminCode = $_POST['adminCode'] ?? '';
if (!is_string($adminCode) || $adminCode !== RECIPES_ADMIN_CODE) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid admin code.']);
    exit;
}

if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No image uploaded.']);
    exit;
}

$file = $_FILES['image'];

if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Image upload failed.']);
    exit;
}

$tmpPath = $file['tmp_name'] ?? null;
if (!is_string($tmpPath) || !is_uploaded_file($tmpPath)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid upload payload.']);
    exit;
}

$mime = null;
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = $finfo ? finfo_file($finfo, $tmpPath) : null;
    if ($finfo) {
        finfo_close($finfo);
    }
} elseif (function_exists('mime_content_type')) {
    $mime = mime_content_type($tmpPath);
}

$mime = is_string($mime) ? strtolower(trim($mime)) : null;
$extensionMap = [
    'image/jpeg' => 'jpg',
    'image/pjpeg' => 'jpg',
    'image/jpg' => 'jpg',
    'image/png' => 'png',
    'image/x-png' => 'png',
    'image/gif' => 'gif',
    'image/webp' => 'webp'
];
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

$extension = $mime && isset($extensionMap[$mime]) ? $extensionMap[$mime] : null;

if ($extension === null) {
    $originalExtension = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
    if (in_array($originalExtension, $allowedExtensions, true)) {
        $extension = $originalExtension === 'jpeg' ? 'jpg' : $originalExtension;
    }
}

if ($extension === null) {
    http_response_code(415);
    echo json_encode(['error' => 'Unsupported image type.']);
    exit;
}

if (!is_dir(RECIPES_IMAGES_DIR)) {
    if (!mkdir(RECIPES_IMAGES_DIR, 0775, true) && !is_dir(RECIPES_IMAGES_DIR)) {
        http_response_code(500);
        echo json_encode(['error' => 'Unable to create image directory.']);
        exit;
    }
}

try {
    $randomName = bin2hex(random_bytes(8));
} catch (Throwable) {
    http_response_code(500);
    echo json_encode(['error' => 'Unable to generate file name.']);
    exit;
}

$finalName = sprintf('%s.%s', $randomName, $extension);
$targetPath = RECIPES_IMAGES_DIR . DIRECTORY_SEPARATOR . $finalName;

if (!move_uploaded_file($tmpPath, $targetPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to store uploaded image.']);
    exit;
}

$url = RECIPES_IMAGES_URL_PREFIX . '/' . $finalName;

echo json_encode([
    'path' => $url
]);

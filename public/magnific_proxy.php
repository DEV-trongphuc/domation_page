<?php
/**
 * CORS Proxy for Magnific Downloader
 * This script fetches HTML content from Magnific/Freepik and returns it as JSON.
 * It bypasses CORS restrictions and simulates a real browser request.
 */

// Headers for CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Hỗ trợ Fotoget API Proxy qua POST
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Hỗ trợ tải trực tiếp file để không bị mở tab mới (Force Download)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'downloadImage') {
    $imgUrl = isset($_GET['imgUrl']) ? $_GET['imgUrl'] : '';
    if (filter_var($imgUrl, FILTER_VALIDATE_URL)) {
        // Lấy đuôi file từ URL (mặc định là jpg nếu không tìm thấy)
        $ext = pathinfo(parse_url($imgUrl, PHP_URL_PATH), PATHINFO_EXTENSION);
        if (!$ext) $ext = 'jpg';
        
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="premium_download.' . $ext . '"');
        readfile($imgUrl);
    }
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($action === 'imagePreview' || $action === 'checkTryParsing')) {
    $postData = file_get_contents('php://input');
    $ch = curl_init("https://fotoget.org/ajax/" . $action);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/x-www-form-urlencoded'));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    echo curl_exec($ch);
    exit();
}

$url = isset($_GET['url']) ? $_GET['url'] : '';

if (empty($url)) {
    http_response_code(400);
    echo json_encode(["error" => "Thiếu tham số url."]);
    exit();
}

// Validate URL format
if (filter_var($url, FILTER_VALIDATE_URL) === false) {
    http_response_code(400);
    echo json_encode(["error" => "URL không hợp lệ."]);
    exit();
}

// Ensure it's magnific, freepik, or adobe stock to prevent abuse
if (strpos($url, 'magnific.com') === false && strpos($url, 'freepik.com') === false && strpos($url, 'stock.adobe.com') === false) {
    http_response_code(400);
    echo json_encode(["error" => "Chỉ hỗ trợ URL từ Magnific, Freepik."]);
    exit();
}

// Initialize cURL
$ch = curl_init();

/** 
 * GIẢI PHÁP VƯỢT TƯỜNG LỬA (CLOUDFLARE / DATADOME):
 * Đã tích hợp ScraperAPI thành công.
 */

$scraperApiKey = '1d451825ed54e5398ea469c6880b2b7f';
$url = "http://api.scraperapi.com?api_key={$scraperApiKey}&url=" . urlencode($url);

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
// Mimic a real browser to bypass anti-bot protection
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Ignore SSL errors just in case
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language: en-US,en;q=0.5",
    "Connection: keep-alive",
    "Upgrade-Insecure-Requests: 1",
    "Sec-Fetch-Dest: document",
    "Sec-Fetch-Mode: navigate",
    "Sec-Fetch-Site: none",
    "Sec-Fetch-User: ?1"
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(500);
    echo json_encode(["error" => "Lỗi cURL khi fetch dữ liệu: " . $error]);
    exit();
}

// Mimic the structure of allorigins.win to minimize frontend changes
echo json_encode([
    "contents" => $response,
    "status" => [
        "http_code" => $httpCode,
        "url" => $url
    ]
]);

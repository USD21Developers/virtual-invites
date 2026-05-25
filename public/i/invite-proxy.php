<?php

$target_url = 'https://api.usd21.org/invites/invite';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $target_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']); // Preserve original request method
curl_setopt($ch, CURLOPT_TIMEOUT, 15);          // max total seconds to wait
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);    // max seconds to establish connection

$headers = getallheaders();
$headers_array = [];

foreach ($headers as $key => $value) {
    if (strtolower($key) == 'host') continue; // Don't forward "Host"
    $headers_array[] = "$key: $value";
}

// Ensure "Content-Type" is set (for POST/PUT/PATCH requests)
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH']) && 
    !array_key_exists('content-type', array_change_key_case($headers, CASE_LOWER))) {
    $headers_array[] = "Content-Type: application/json";
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers_array);

// Handle request body only for non-GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $post_data = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
}

// Execute cURL request
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Handle cURL errors (e.g., timeouts, unreachable server)
if ($response === false) {
    $error_message = curl_error($ch);
    curl_close($ch);
    http_response_code(502);
    echo json_encode(["msg" => "proxy error", "error" => $error_message]);
    exit;
}

curl_close($ch);

// Return the correct HTTP status code
http_response_code($http_code);
echo $response;

?>

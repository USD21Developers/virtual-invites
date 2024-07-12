<?php

$target_url = 'https://api.usd21.org/invites/country-of-coordinates';

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $target_url);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$headers = apache_request_headers();
$headers_array = [];
foreach ($headers as $key => $value) {
    if (strtolower($key) == 'host') continue;
    $headers_array[] = "$key: $value";
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers_array);

$request_method = $_SERVER['REQUEST_METHOD'];

curl_setopt($ch, CURLOPT_POST, true);

$post_data = file_get_contents('php://input');

curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);

$response = curl_exec($ch);

$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

http_response_code($http_code);

echo $response;

?>

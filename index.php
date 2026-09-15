<?php
// InfinityFree & Shared Hosting compatibility launcher for Pop
if (file_exists(__DIR__ . '/dist/index.html')) {
    $html = file_get_contents(__DIR__ . '/dist/index.html');
    // If running at root while dist is in a subfolder, adjust asset paths
    $html = str_replace('href="./assets/', 'href="./dist/assets/', $html);
    $html = str_replace('src="./assets/', 'src="./dist/assets/', $html);
    header('Content-Type: text/html; charset=UTF-8');
    echo $html;
    exit;
}
?>

<?php
require 'C:/xampp/htdocs/e-Reklamo/server/vendor/autoload.php';
$app = require_once 'C:/xampp/htdocs/e-Reklamo/server/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\API\v1\ChatController;

$controller = new ChatController();

echo "--- Testing messages() for Conv 2 ---\n";
$req2 = Request::create('/api/v1/chat/conversations/2/messages', 'GET');
$res2 = json_decode($controller->messages($req2, 2)->getContent(), true);
print_r($res2['data']['messages']);

echo "\n--- Testing messages() for Conv 3 ---\n";
$req3 = Request::create('/api/v1/chat/conversations/3/messages', 'GET');
$res3 = json_decode($controller->messages($req3, 3)->getContent(), true);
print_r($res3['data']['messages']);

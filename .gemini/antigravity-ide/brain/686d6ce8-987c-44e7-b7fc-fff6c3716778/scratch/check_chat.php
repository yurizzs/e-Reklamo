<?php
require 'C:/xampp/htdocs/e-Reklamo/server/vendor/autoload.php';
$app = require_once 'C:/xampp/htdocs/e-Reklamo/server/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== CONVERSATIONS (" . App\Models\Conversation::count() . ") ===\n";
foreach (App\Models\Conversation::with(['user', 'messages'])->get() as $c) {
    echo "Conv ID: {$c->id} | User ID: " . ($c->user_id ?? 'NULL') . " | User Name: " . ($c->user ? ($c->user->first_name . ' ' . $c->user->last_name) : 'N/A') . "\n";
    foreach ($c->messages as $m) {
        echo "   -> Msg #{$m->id} [{$m->sender_type}/{$m->sender_role}] {$m->sender_name} (ID: {$m->sender_id}): {$m->message_text}\n";
    }
}

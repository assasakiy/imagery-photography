<?php
require '/var/www/imagery/vendor/autoload.php';
$app=require '/var/www/imagery/bootstrap/app.php'; $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use App\Models\ClientAccessToken;
use App\Models\Project;
$p=Project::create(['user_id'=>3,'name'=>'Test Arsip Verify','status'=>'awaiting_payment','price'=>1500000,'preview_ends_at'=>now()->addDays(20)]);
ClientAccessToken::create(['project_id'=>$p->id,'user_id'=>3,'token'=>ClientAccessToken::generateToken(),'expires_at'=>now()->addYear()]);
echo $p->id;

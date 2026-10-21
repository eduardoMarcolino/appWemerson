<?php

namespace App\Support;

use App\Models\UserModel;
use Laravel\Sanctum\NewAccessToken;

class MobileTokenIssuer
{
    public function issue(UserModel $user, string $name): NewAccessToken
    {
        return $user->createToken(
            $name,
            ['*'],
            now()->addMinutes((int) config('sanctum.expiration', 60)),
        );
    }
}

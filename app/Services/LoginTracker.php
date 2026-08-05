<?php

namespace App\Services;

use App\Models\LoginHistory;
use App\Models\User;

class LoginTracker
{
    public function recordLogin(User $user, string $method = 'password'): LoginHistory
    {
        LoginHistory::where('user_id', $user->id)->open()->get()->each(function (LoginHistory $lh) {
            $lh->logged_out_at = now();
            $lh->duration_seconds = $lh->logged_in_at ? max(0, now()->diffInSeconds($lh->logged_in_at)) : null;
            $lh->save();
        });

        return LoginHistory::create([
            'user_id' => $user->id,
            'method' => $method,
            'status' => 'success',
            'ip' => request()->ip(),
            'user_agent' => substr((string) request()->userAgent(), 0, 500),
            'logged_in_at' => now(),
        ]);
    }

    public function recordFailed(?User $user, string $method = 'password'): void
    {
        LoginHistory::create([
            'user_id' => $user?->id,
            'method' => $method,
            'status' => 'failed',
            'ip' => request()->ip(),
            'user_agent' => substr((string) request()->userAgent(), 0, 500),
            'logged_in_at' => now(),
        ]);
    }

    public function recordLogout(?User $user): void
    {
        if (!$user) {
            return;
        }

        $latest = LoginHistory::where('user_id', $user->id)->open()->latest('id')->first();

        if (!$latest) {
            return;
        }

        $latest->logged_out_at = now();
        $latest->duration_seconds = $latest->logged_in_at ? max(0, now()->diffInSeconds($latest->logged_in_at)) : null;
        $latest->save();
    }

    public function isSuspicious(User $user): bool
    {
        $ip = request()->ip();
        $ua = substr((string) request()->userAgent(), 0, 500);

        $latest = LoginHistory::where('user_id', $user->id)->where('status', 'success')->latest('id')->first();

        if (!$latest) {
            return false;
        }

        $known = LoginHistory::where('user_id', $user->id)
            ->where('status', 'success')
            ->where('id', '!=', $latest->id)
            ->where(function ($q) use ($ip, $ua) {
                $q->where('ip', $ip)->orWhere('user_agent', $ua);
            })
            ->exists();

        if ($known) {
            return false;
        }

        return LoginHistory::where('user_id', $user->id)
            ->where('status', 'success')
            ->where('id', '!=', $latest->id)
            ->exists();
    }
}
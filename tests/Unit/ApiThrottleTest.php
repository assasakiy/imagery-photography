<?php

namespace Tests\Unit;

use App\Support\ApiThrottle;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class ApiThrottleTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_exceeded_atomic_hit()
    {
        $key = 'otp.send';
        $email = 'test@example.com';

        // first 5 attempts should pass
        for ($i = 0; $i < 5; $i++) {
            $this->assertFalse(ApiThrottle::exceeded($key, ['identifier' => $email]));
        }

        // 6th should fail
        $this->assertTrue(ApiThrottle::exceeded($key, ['identifier' => $email]));
    }

    public function test_floor_ceiling_clamp()
    {
        $cfg = config('apithrottle.policies.otp.send');
        $this->assertEquals(5, ApiThrottle::effectiveLimit('otp.send'));

        // floor 5
        $this->assertGreaterThanOrEqual(5, ApiThrottle::effectiveLimit('otp.send'));
    }

    public function test_key_builds_composite()
    {
        $key1 = ApiThrottle::key('otp.send', ['identifier' => 'test@example.com']);
        $key2 = ApiThrottle::key('otp.send', ['identifier' => 'test@example.com']);
        $key3 = ApiThrottle::key('otp.send', ['identifier' => 'other@example.com']);

        $this->assertEquals($key1, $key2);
        $this->assertNotEquals($key1, $key3);
    }

    public function test_reset()
    {
        $email = 'test@example.com';
        ApiThrottle::exceeded('otp.send', ['identifier' => $email]);
        ApiThrottle::reset('otp.send', ['identifier' => $email]);
        $this->assertFalse(ApiThrottle::exceeded('otp.send', ['identifier' => $email]));
    }

    public function test_retry_after()
    {
        $email = 'test@example.com';
        for ($i = 0; $i < 5; $i++) {
            ApiThrottle::exceeded('otp.send', ['identifier' => $email]);
        }
        $retry = ApiThrottle::retryAfter('otp.send', ['identifier' => $email]);
        $this->assertGreaterThan(0, $retry);
    }

    public function test_record_manual()
    {
        $email = 'test@example.com';
        $this->assertFalse(ApiThrottle::exceeded('booking.create', ['email' => $email]));
        ApiThrottle::record('booking.create', ['email' => $email]);
        $this->assertTrue(ApiThrottle::exceeded('booking.create', ['email' => $email]));
    }
}
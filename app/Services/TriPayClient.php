<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TriPayClient
{
    private string $apiKey;
    private string $privateKey;
    private string $merchantCode;
    private bool $isSandbox;

    public function __construct(RuntimeSettings $settings)
    {
        $config = $settings->paymentTripayConfig();
        $this->apiKey = $config['api_key'] ?? '';
        $this->privateKey = $config['private_key'] ?? '';
        $this->merchantCode = $config['merchant_code'] ?? '';
        $this->isSandbox = ($config['mode'] ?? 'sandbox') === 'sandbox';
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->privateKey) && !empty($this->merchantCode);
    }

    private function baseUrl(): string
    {
        return $this->isSandbox 
            ? 'https://tripay.co.id/api-sandbox/' 
            : 'https://tripay.co.id/api/';
    }

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->apiKey,
        ];
    }

    public function paymentChannels(): array
    {
        if (!$this->isConfigured()) return [];

        try {
            $response = Http::withHeaders($this->headers())
                ->get($this->baseUrl() . 'merchant/payment-channel');
            
            if ($response->successful()) {
                return $response->json('data') ?? [];
            }
            Log::warning('TriPay channel fetch failed', ['res' => $response->body()]);
        } catch (\Exception $e) {
            Log::error('TriPay channel fetch error', ['error' => $e->getMessage()]);
        }

        return [];
    }

    public function createTransaction(string $merchantRef, int $amount, string $method, array $customer, array $orderItems, ?string $returnUrl = null): ?array
    {
        if (!$this->isConfigured()) return null;

        $signature = hash_hmac('sha256', $this->merchantCode . $merchantRef . $amount, $this->privateKey);

        $payload = [
            'method'         => $method,
            'merchant_ref'   => $merchantRef,
            'amount'         => $amount,
            'customer_name'  => $customer['name'],
            'customer_email' => $customer['email'],
            'customer_phone' => $customer['phone'] ?? '080000000000',
            'order_items'    => $orderItems,
            'signature'      => $signature,
        ];

        if ($returnUrl) {
            $payload['return_url'] = $returnUrl;
        }

        try {
            $response = Http::withHeaders($this->headers())
                ->post($this->baseUrl() . 'transaction/create', $payload);

            if ($response->successful() && $response->json('success')) {
                return $response->json('data');
            }

            Log::error('TriPay create tx failed', [
                'req' => $payload, 
                'res' => $response->body()
            ]);
        } catch (\Exception $e) {
            Log::error('TriPay create tx exception', ['error' => $e->getMessage()]);
        }

        return null;
    }

    public function checkStatus(string $reference): ?array
    {
        if (!$this->isConfigured()) return null;

        try {
            $response = Http::withHeaders($this->headers())
                ->get($this->baseUrl() . 'transaction/detail', ['reference' => $reference]);
                
            if ($response->successful() && $response->json('success')) {
                return $response->json('data');
            }
        } catch (\Exception $e) {
            Log::error('TriPay check status exception', ['error' => $e->getMessage()]);
        }

        return null;
    }

    public function verifyCallback(string $jsonBody, string $signatureHeader): bool
    {
        if (!$this->isConfigured()) return false;
        
        $signature = hash_hmac('sha256', $jsonBody, $this->privateKey);
        
        return hash_equals($signature, $signatureHeader);
    }
}
<?php

namespace App\Services\WhatsApp;

use App\Services\RuntimeSettings;
use InvalidArgumentException;

/**
 * Schema-driven WhatsApp driver registry.
 *
 * Every driver declares its own config schema (fields, types, validation).
 * The dashboard renders a dynamic form from these schemas, so adding a new
 * provider (Green API, WhatsApp Cloud API, etc.) is just a new entry here —
 * no frontend changes required.
 */
class WhatsAppDriverRegistry
{
    /**
     * Driver key => driver class implementing WhatsAppDriver.
     */
    public const CLASSES = [
        'gowa' => GoWADriver::class,
        'evolution' => EvolutionApiDriver::class,
        'waha' => WahaDriver::class,
        'fonnte' => FonnteWhatsAppDriver::class,
        'twilio' => TwilioDriver::class,
        'custom' => CustomApiDriver::class,
        'meta' => MetaWhatsAppDriver::class,
    ];

    public function all(): array
    {
        $drivers = [];

        foreach (array_keys(self::CLASSES) as $key) {
            $drivers[] = $this->schema($key);
        }

        return $drivers;
    }

    /**
     * Full schema for a driver (name, description, fields).
     */
    public function schema(string $driver): ?array
    {
        return self::SCHEMAS[$driver] ?? null;
    }

    /**
     * Field list for a driver (or empty array when unknown).
     */
    public function fields(string $driver): array
    {
        return $this->schema($driver)['fields'] ?? [];
    }

    public function class(string $driver): ?string
    {
        return self::CLASSES[$driver] ?? null;
    }

    public function has(string $driver): bool
    {
        return isset(self::SCHEMAS[$driver]);
    }

    /**
     * True when the given {driver, config} payload satisfies every required field.
     */
    public function isConfigured(array $whatsappConfig): bool
    {
        $driver = $whatsappConfig['driver'] ?? '';
        $schema = $this->schema($driver);

        if (!$schema) {
            return false;
        }

        $values = $whatsappConfig['config'] ?? [];

        foreach ($schema['fields'] as $field) {
            if (!($field['required'] ?? false)) {
                continue;
            }

            if (empty($values[$field['key']] ?? '')) {
                return false;
            }
        }

        return true;
    }

    public function resolve(string $driver): WhatsAppDriver
    {
        $class = $this->class($driver);

        if (!$class) {
            throw new InvalidArgumentException("Unsupported WhatsApp driver: {$driver}");
        }

        return app($class);
    }

    private const SCHEMAS = [
        'gowa' => [
            'key' => 'gowa',
            'name' => 'GoWA',
            'description' => 'Gateway self-hosted berbasis GoWhatsApp.',
            'fields' => [
                [
                    'key' => 'base_url',
                    'label' => 'Base URL',
                    'type' => 'url',
                    'required' => true,
                    'placeholder' => 'https://gowa.example.com',
                    'help' => 'URL server GoWA Anda.',
                ],
                [
                    'key' => 'username',
                    'label' => 'Username',
                    'type' => 'text',
                    'required' => false,
                    'placeholder' => 'admin',
                    'help' => 'Login admin GoWA (bila otentikasi diaktifkan).',
                ],
                [
                    'key' => 'password',
                    'label' => 'Password',
                    'type' => 'password',
                    'required' => false,
                    'help' => 'Password admin GoWA.',
                ],
                [
                    'key' => 'device_id',
                    'label' => 'Device ID',
                    'type' => 'text',
                    'required' => false,
                    'placeholder' => '62812xxxx@s.whatsapp.net',
                    'help' => 'ID device: nomor WhatsApp dengan akhiran @s.whatsapp.net.',
                ],
                [
                    'key' => 'endpoint_send',
                    'label' => 'Endpoint Send',
                    'type' => 'text',
                    'required' => false,
                    'default' => '/send/message',
                ],
                [
                    'key' => 'endpoint_status',
                    'label' => 'Endpoint Status',
                    'type' => 'text',
                    'required' => false,
                    'default' => '/app/devices',
                ],
            ],
        ],

        'evolution' => [
            'key' => 'evolution',
            'name' => 'Evolution API',
            'description' => 'Evolution API self-hosted (WhatsApp multi-device).',
            'fields' => [
                [
                    'key' => 'base_url',
                    'label' => 'Base URL',
                    'type' => 'url',
                    'required' => true,
                    'placeholder' => 'https://wa.domain.com',
                ],
                [
                    'key' => 'api_key',
                    'label' => 'API Key',
                    'type' => 'password',
                    'required' => true,
                ],
                [
                    'key' => 'instance',
                    'label' => 'Instance',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'dayama',
                ],
            ],
        ],

        'waha' => [
            'key' => 'waha',
            'name' => 'WAHA',
            'description' => 'WhatsApp HTTP API (WAHA / waha.dev).',
            'fields' => [
                [
                    'key' => 'base_url',
                    'label' => 'Base URL',
                    'type' => 'url',
                    'required' => true,
                    'placeholder' => 'https://waha.example.com',
                ],
                [
                    'key' => 'api_key',
                    'label' => 'API Key',
                    'type' => 'password',
                    'required' => false,
                    'help' => 'X-Api-Key bila keamanan diaktifkan di server WAHA.',
                ],
            ],
        ],

        'fonnte' => [
            'key' => 'fonnte',
            'name' => 'Fonnte',
            'description' => 'Fonnte SMS/WhatsApp gateway (cloud).',
            'fields' => [
                [
                    'key' => 'api_token',
                    'label' => 'API Token',
                    'type' => 'password',
                    'required' => true,
                ],
            ],
        ],

        'twilio' => [
            'key' => 'twilio',
            'name' => 'Twilio WhatsApp',
            'description' => 'Twilio WhatsApp Business API.',
            'fields' => [
                [
                    'key' => 'account_sid',
                    'label' => 'Account SID',
                    'type' => 'text',
                    'required' => true,
                ],
                [
                    'key' => 'auth_token',
                    'label' => 'Auth Token',
                    'type' => 'password',
                    'required' => true,
                ],
                [
                    'key' => 'from',
                    'label' => 'Nomor Pengirim',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'whatsapp:+14155552671',
                    'help' => 'Nomor WhatsApp sender di Twilio, format whatsapp:+62xxx.',
                ],
            ],
        ],

        'custom' => [
            'key' => 'custom',
            'name' => 'Custom REST API',
            'description' => 'Endpoint API apa pun dengan template body fleksibel.',
            'fields' => [
                [
                    'key' => 'method',
                    'label' => 'Method',
                    'type' => 'select',
                    'required' => true,
                    'default' => 'POST',
                    'options' => ['POST', 'GET', 'PUT', 'PATCH'],
                ],
                [
                    'key' => 'base_url',
                    'label' => 'Base URL',
                    'type' => 'url',
                    'required' => true,
                    'placeholder' => 'https://api.example.com',
                ],
                [
                    'key' => 'endpoint',
                    'label' => 'Endpoint',
                    'type' => 'text',
                    'required' => true,
                    'default' => '/send',
                    'placeholder' => '/send',
                ],
                [
                    'key' => 'auth_type',
                    'label' => 'Authentication',
                    'type' => 'select',
                    'required' => true,
                    'default' => 'none',
                    'options' => ['none', 'bearer', 'basic', 'api_key'],
                ],
                [
                    'key' => 'header_key',
                    'label' => 'Header Key',
                    'type' => 'text',
                    'required' => false,
                    'default' => 'Authorization',
                    'help' => 'Nama header untuk otentikasi Bearer / API Key.',
                ],
                [
                    'key' => 'header_value',
                    'label' => 'Header Value',
                    'type' => 'password',
                    'required' => false,
                    'help' => 'Nilai header (token). Untuk Basic Auth: username:password.',
                ],
                [
                    'key' => 'body_template',
                    'label' => 'Body Template (JSON)',
                    'type' => 'textarea',
                    'required' => false,
                    'default' => "{\n  \"phone\": \"{{phone}}\",\n  \"message\": \"{{message}}\"\n}",
                    'help' => 'Gunakan placeholder {{phone}} dan {{message}}.',
                ],
            ],
        ],

        'meta' => [
            'key' => 'meta',
            'name' => 'Meta WhatsApp Cloud API',
            'description' => 'Meta (Facebook) WhatsApp Cloud API resmi.',
            'fields' => [
                [
                    'key' => 'access_token',
                    'label' => 'Access Token',
                    'type' => 'password',
                    'required' => true,
                ],
                [
                    'key' => 'phone_number_id',
                    'label' => 'Phone Number ID',
                    'type' => 'text',
                    'required' => true,
                ],
                [
                    'key' => 'api_version',
                    'label' => 'API Version',
                    'type' => 'text',
                    'required' => false,
                    'default' => 'v21.0',
                ],
            ],
        ],
    ];
}

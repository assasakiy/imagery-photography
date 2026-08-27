#!/bin/sh

# Ensure storage directories exist
mkdir -p storage/framework/cache/data \
         storage/framework/sessions \
         storage/framework/views \
         storage/app/public \
         storage/logs

# Ensure log file exists for tail
touch storage/logs/laravel.log

# Set initial permissions
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Auto-detect APP_URL if not set or still localhost
if [ -z "$APP_URL" ] || echo "$APP_URL" | grep -q "localhost"; then
    if [ -n "$COOLIFY_FQDN" ]; then
        export APP_URL="$COOLIFY_FQDN"
    elif [ -n "$VIRTUAL_HOST" ]; then
        export APP_URL="https://$VIRTUAL_HOST"
    fi
fi

# Generate APP_KEY if missing
if [ -z "$APP_KEY" ]; then
    echo "APP_KEY is missing. Generating one..."
    export APP_KEY=$(php artisan key:generate --show)
    echo "APP_KEY=$APP_KEY" >> .env
fi

# Run database migrations FIRST
php artisan migrate --force

# Link storage (needs to happen after migration but before cache)
php artisan storage:link || true

# Run package discovery (requires DB for some packages)
php artisan package:discover --ansi

# Run optimizations if in production
if [ "$APP_ENV" = "production" ]; then
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

# Set permissions AGAIN after running artisan commands to ensure generated files (like logs and cache) are writable by www-data
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Start supervisord to run PHP-FPM, Nginx, and Queue Worker
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

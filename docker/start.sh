#!/bin/sh

# Ensure storage directories exist
mkdir -p storage/framework/cache/data \
         storage/framework/sessions \
         storage/framework/views \
         storage/app/public \
         storage/logs

# Set permissions
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

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

# Start supervisord to run PHP-FPM, Nginx, and Queue Worker
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

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

# Run package discovery
php artisan package:discover --ansi

# Run optimizations if in production
if [ "$APP_ENV" = "production" ]; then
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

# Run database migrations
php artisan migrate --force

# Link storage
php artisan storage:link || true

# Start supervisord to run PHP-FPM, Nginx, and Queue Worker
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

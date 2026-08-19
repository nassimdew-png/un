FROM php:8.2-fpm-alpine

# تثبيت متطلبات النظام وامتداد MongoDB
RUN apk add --no-cache \
    openssl-dev \
    git \
    unzip \
    libzip-dev \
    autoconf \
    g++ \
    make \
    && pecl install mongodb \
    && docker-php-ext-enable mongodb \
    && docker-php-ext-install zip pdo

# تثبيت Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json ./
RUN composer install --no-dev --no-interaction --optimize-autoloader --no-security-blocking

COPY . .

# إنشاء وضبط صلاحيات مجلدات الكاش والتخزين
RUN mkdir -p /var/www/html/bootstrap/cache \
             /var/www/html/storage/framework/cache \
             /var/www/html/storage/framework/sessions \
             /var/www/html/storage/framework/views \
             /var/www/html/storage/logs \
    && chmod -R 777 /var/www/html/bootstrap/cache /var/www/html/storage

EXPOSE 8000

CMD sh -c "php artisan db:seed --force 2>/dev/null || true; php artisan serve --host=0.0.0.0 --port=8000"

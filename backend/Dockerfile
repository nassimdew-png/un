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
RUN composer config audit.block false && composer install --no-dev --no-interaction --optimize-autoloader --no-audit

COPY . .

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

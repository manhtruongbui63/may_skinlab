FROM php:8.4-fpm-alpine

# Arguments for permission alignment (defaulting to standard 1000)
ARG USER_ID=1000
ARG GROUP_ID=1000

# Install system packages, shadow (for usermod/groupmod), and supervisor
RUN apk add --no-cache \
    curl \
    git \
    bash \
    supervisor \
    shadow \
    su-exec

# Install PHP extensions using the highly reliable docker-php-extension-installer
ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN chmod +x /usr/local/bin/install-php-extensions && \
    install-php-extensions gd bcmath zip intl opcache pdo_mysql redis pcntl sockets

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Dynamically adjust www-data's UID & GID to match the host user's UID & GID
RUN groupmod -g ${GROUP_ID} www-data && \
    usermod -u ${USER_ID} -g www-data www-data

# Set working directory
WORKDIR /var/www/html

# Create log directory for supervisor
RUN mkdir -p /var/log/supervisor && chown -R www-data:www-data /var/log/supervisor

EXPOSE 9000

CMD ["php-fpm"]

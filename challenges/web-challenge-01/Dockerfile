FROM php:8.1-apache

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache modules
RUN a2enmod rewrite

# Install PHP extensions
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Copy website files
COPY files/ /var/www/html/

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Apache configuration for security (intentionally weak for CTF)
RUN echo 'ServerTokens Prod\nServerSignature Off\n' >> /etc/apache2/conf-available/security.conf

# Start Apache
CMD ["apache2-foreground"]

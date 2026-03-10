#!/bin/bash
set -e

# =====================================================
#  Установка бэкенда "Король парковки" на Ubuntu 22.04
#  Запуск: bash install.sh
# =====================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
ask()     { echo -e "${YELLOW}[?]${NC} $1"; }

echo ""
echo "================================================="
echo "   Установка бэкенда «Король парковки»"
echo "================================================="
echo ""

# --- Проверка root ---
if [ "$EUID" -ne 0 ]; then
  error "Запусти скрипт от root: sudo bash install.sh"
fi

# --- Запрашиваем параметры ---
ask "Введи домен сервера (например: ednord.ru):"
read -r DOMAIN

ask "Введи строку подключения к PostgreSQL (DATABASE_URL):"
warn "Пример: postgresql://parking_user:password@localhost:5432/parking_db"
read -r DATABASE_URL

ask "Введи схему базы данных (MAIN_DB_SCHEMA, например: parking):"
read -r DB_SCHEMA

ask "Введи YOOKASSA_SHOP_ID (или Enter чтобы пропустить):"
read -r YOOKASSA_SHOP_ID

ask "Введи YOOKASSA_SECRET_KEY (или Enter чтобы пропустить):"
read -r YOOKASSA_SECRET_KEY

INSTALL_DIR="/var/www/parking"

echo ""
info "Обновляю систему..."
apt-get update -qq
apt-get upgrade -y -qq

info "Устанавливаю зависимости..."
apt-get install -y -qq \
  python3.11 python3.11-venv python3-pip \
  libpq-dev python3-dev \
  nginx \
  certbot python3-certbot-nginx \
  git curl

info "Создаю папку проекта: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

info "Копирую файлы бэкенда..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR/"

info "Создаю Python окружение..."
python3.11 -m venv "$INSTALL_DIR/venv"
"$INSTALL_DIR/venv/bin/pip" install -q --upgrade pip
"$INSTALL_DIR/venv/bin/pip" install -q -r "$INSTALL_DIR/requirements.txt"

info "Создаю файл переменных окружения..."
cat > "$INSTALL_DIR/.env" <<EOF
DATABASE_URL=$DATABASE_URL
MAIN_DB_SCHEMA=$DB_SCHEMA
YOOKASSA_SHOP_ID=$YOOKASSA_SHOP_ID
YOOKASSA_SECRET_KEY=$YOOKASSA_SECRET_KEY
EOF
chmod 600 "$INSTALL_DIR/.env"

info "Создаю systemd сервис..."
cat > /etc/systemd/system/parking.service <<EOF
[Unit]
Description=Король парковки — API
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

chown -R www-data:www-data "$INSTALL_DIR"

systemctl daemon-reload
systemctl enable parking
systemctl start parking

sleep 2
if systemctl is-active --quiet parking; then
  info "Сервис запущен успешно!"
else
  warn "Сервис не запустился. Проверь логи: journalctl -u parking -n 50"
fi

info "Настраиваю Nginx..."
cat > /etc/nginx/sites-available/parking <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # API бэкенд
    location /api/ {
        rewrite ^/api(/.*)$ \$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 30s;
    }

    # Фронтенд (если нужно)
    location / {
        root /var/www/parking/frontend;
        try_files \$uri /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/parking /etc/nginx/sites-enabled/parking
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
info "Nginx настроен!"

# --- SSL ---
echo ""
ask "Настроить SSL (HTTPS) через Let's Encrypt? (y/n):"
read -r SETUP_SSL

if [ "$SETUP_SSL" = "y" ] || [ "$SETUP_SSL" = "Y" ]; then
  ask "Введи email для SSL-сертификата:"
  read -r SSL_EMAIL

  warn "Убедись что DNS запись $DOMAIN указывает на IP этого сервера!"
  ask "Продолжить? (y/n):"
  read -r CONTINUE_SSL

  if [ "$CONTINUE_SSL" = "y" ] || [ "$CONTINUE_SSL" = "Y" ]; then
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$SSL_EMAIL" --redirect
    info "SSL настроен! Сайт доступен по https://$DOMAIN"
  fi
fi

# --- Проверка ---
echo ""
echo "================================================="
info "Установка завершена!"
echo ""
echo "  API доступен по адресу: http://$DOMAIN/api/"
echo "  Проверь: curl http://$DOMAIN/api/"
echo ""
echo "  Полезные команды:"
echo "  • Статус сервиса:  systemctl status parking"
echo "  • Логи сервиса:    journalctl -u parking -f"
echo "  • Перезапуск:      systemctl restart parking"
echo "  • Логи Nginx:      tail -f /var/log/nginx/error.log"
echo "================================================="

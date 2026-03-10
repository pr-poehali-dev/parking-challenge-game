#!/bin/bash
set -e

# =====================================================
#  Установка бэкенда "Король парковки" на Ubuntu 22.04
#  Запуск: sudo bash install.sh
# =====================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
ask()   { echo -e "${YELLOW}[?]${NC} $1"; }

echo ""
echo "================================================="
echo "   Установка бэкенда «Король парковки»"
echo "================================================="
echo ""

# --- Проверка root ---
if [ "$EUID" -ne 0 ]; then
  error "Запусти скрипт от root: sudo bash install.sh"
fi

# --- Параметры ---
ask "Введи домен сервера (например: ednord.ru):"
read -r DOMAIN

ask "Введи YOOKASSA_SHOP_ID (или Enter чтобы пропустить):"
read -r YOOKASSA_SHOP_ID

ask "Введи YOOKASSA_SECRET_KEY (или Enter чтобы пропустить):"
read -r YOOKASSA_SECRET_KEY

DB_NAME="parking_db"
DB_USER="parking_user"
DB_PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 20)"
DB_SCHEMA="parking"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
INSTALL_DIR="/var/www/parking"

echo ""
info "Обновляю систему..."
apt-get update -qq
apt-get upgrade -y -qq

info "Устанавливаю зависимости..."
apt-get install -y -qq \
  python3.11 python3.11-venv python3-pip \
  postgresql postgresql-contrib \
  libpq-dev python3-dev \
  nginx \
  certbot python3-certbot-nginx \
  git curl openssl

# =====================================================
#  БАЗА ДАННЫХ
# =====================================================
info "Настраиваю PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Создаём пользователя и БД
sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS ${DB_USER};" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

info "Создаю схему и таблицы..."
sudo -u postgres psql -d "${DB_NAME}" <<EOSQL

-- Создаём схему
CREATE SCHEMA IF NOT EXISTS ${DB_SCHEMA};
GRANT ALL ON SCHEMA ${DB_SCHEMA} TO ${DB_USER};

-- Таблица игроков
CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.players (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(16) NOT NULL,
    emoji           VARCHAR(8)  NOT NULL DEFAULT '😎',
    password_hash   VARCHAR(64) NOT NULL DEFAULT '',
    coins           INTEGER     NOT NULL DEFAULT 1000,
    gems            INTEGER     NOT NULL DEFAULT 50,
    xp              INTEGER     NOT NULL DEFAULT 0,
    wins            INTEGER     NOT NULL DEFAULT 0,
    games_played    INTEGER     NOT NULL DEFAULT 0,
    best_position   INTEGER     NOT NULL DEFAULT 99,
    selected_car    INTEGER     NOT NULL DEFAULT 0,
    owned_cars      TEXT        NOT NULL DEFAULT '0',
    upgrades        TEXT        NOT NULL DEFAULT '{}',
    created_at      TIMESTAMP   DEFAULT NOW(),
    updated_at      TIMESTAMP   DEFAULT NOW(),
    ya_id           VARCHAR(64)  NULL,
    anon_id         VARCHAR(128) NULL,
    friend_code     VARCHAR(16)  NULL,
    cars            TEXT         NULL,
    extra_data      TEXT         NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_ya_id    ON ${DB_SCHEMA}.players (ya_id)    WHERE ya_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_anon_id  ON ${DB_SCHEMA}.players (anon_id)  WHERE anon_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_name     ON ${DB_SCHEMA}.players (LOWER(name));
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_fcode    ON ${DB_SCHEMA}.players (friend_code) WHERE friend_code IS NOT NULL;

GRANT ALL ON ${DB_SCHEMA}.players TO ${DB_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${DB_SCHEMA} TO ${DB_USER};

-- Таблица друзей
CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.friends (
    id            SERIAL PRIMARY KEY,
    player_id     INTEGER     NOT NULL REFERENCES ${DB_SCHEMA}.players(id) ON DELETE CASCADE,
    friend_id     INTEGER     NOT NULL REFERENCES ${DB_SCHEMA}.players(id) ON DELETE CASCADE,
    status        VARCHAR(20) NOT NULL DEFAULT 'accepted',
    games_together INTEGER    NOT NULL DEFAULT 0,
    created_at    TIMESTAMP   DEFAULT NOW(),
    UNIQUE (player_id, friend_id)
);

GRANT ALL ON ${DB_SCHEMA}.friends TO ${DB_USER};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${DB_SCHEMA} TO ${DB_USER};

-- Таблица комнат
CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.rooms (
    id          VARCHAR(36) PRIMARY KEY,
    status      VARCHAR(16) NOT NULL DEFAULT 'waiting',
    round       INTEGER     NOT NULL DEFAULT 0,
    phase       VARCHAR(16) NOT NULL DEFAULT 'lobby',
    timer_end   BIGINT      NOT NULL DEFAULT 0,
    spots_json  TEXT        NOT NULL DEFAULT '[]',
    created_at  BIGINT      NOT NULL DEFAULT 0,
    started_at  BIGINT      NOT NULL DEFAULT 0,
    max_players INTEGER     NOT NULL DEFAULT 10
);

GRANT ALL ON ${DB_SCHEMA}.rooms TO ${DB_USER};

-- Таблица игроков в комнатах
CREATE TABLE IF NOT EXISTS ${DB_SCHEMA}.room_players (
    room_id      VARCHAR(36) NOT NULL REFERENCES ${DB_SCHEMA}.rooms(id) ON DELETE CASCADE,
    player_id    VARCHAR(64) NOT NULL,
    name         VARCHAR(32) NOT NULL,
    emoji        VARCHAR(8)  NOT NULL DEFAULT '🚗',
    color        VARCHAR(16) NOT NULL DEFAULT '#FF2D55',
    body_color   VARCHAR(16) NOT NULL DEFAULT '#CC0033',
    x            DOUBLE PRECISION NOT NULL DEFAULT 400,
    y            DOUBLE PRECISION NOT NULL DEFAULT 300,
    angle        DOUBLE PRECISION NOT NULL DEFAULT 0,
    speed        DOUBLE PRECISION NOT NULL DEFAULT 0,
    hp           DOUBLE PRECISION NOT NULL DEFAULT 100,
    max_hp       DOUBLE PRECISION NOT NULL DEFAULT 100,
    orbit_angle  DOUBLE PRECISION NOT NULL DEFAULT 0,
    orbit_radius DOUBLE PRECISION NOT NULL DEFAULT 270,
    parked       BOOLEAN NOT NULL DEFAULT false,
    park_spot    INTEGER NOT NULL DEFAULT -1,
    eliminated   BOOLEAN NOT NULL DEFAULT false,
    is_bot       BOOLEAN NOT NULL DEFAULT false,
    last_seen    BIGINT  NOT NULL DEFAULT 0,
    PRIMARY KEY (room_id, player_id)
);

GRANT ALL ON ${DB_SCHEMA}.room_players TO ${DB_USER};

EOSQL

info "База данных создана!"

# =====================================================
#  ПРИЛОЖЕНИЕ
# =====================================================
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
DATABASE_URL=${DATABASE_URL}
MAIN_DB_SCHEMA=${DB_SCHEMA}
YOOKASSA_SHOP_ID=${YOOKASSA_SHOP_ID}
YOOKASSA_SECRET_KEY=${YOOKASSA_SECRET_KEY}
EOF
chmod 600 "$INSTALL_DIR/.env"

# =====================================================
#  SYSTEMD СЕРВИС
# =====================================================
info "Создаю systemd сервис..."
cat > /etc/systemd/system/parking.service <<EOF
[Unit]
Description=Король парковки — API
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=${INSTALL_DIR}
ExecStart=${INSTALL_DIR}/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 2
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

# =====================================================
#  NGINX
# =====================================================
info "Настраиваю Nginx..."
cat > /etc/nginx/sites-available/parking <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location /api/ {
        rewrite ^/api(/.*)$ \$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 30s;
    }

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

# =====================================================
#  SSL
# =====================================================
echo ""
ask "Настроить SSL (HTTPS) через Let's Encrypt? (y/n):"
read -r SETUP_SSL

if [ "$SETUP_SSL" = "y" ] || [ "$SETUP_SSL" = "Y" ]; then
  ask "Введи email для SSL-сертификата:"
  read -r SSL_EMAIL
  warn "Убедись что DNS запись ${DOMAIN} указывает на IP этого сервера!"
  ask "Продолжить? (y/n):"
  read -r CONTINUE_SSL
  if [ "$CONTINUE_SSL" = "y" ] || [ "$CONTINUE_SSL" = "Y" ]; then
    certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${SSL_EMAIL}" --redirect
    info "SSL настроен! Сайт доступен по https://${DOMAIN}"
  fi
fi

# =====================================================
#  ИТОГ
# =====================================================
echo ""
echo "================================================="
info "Установка завершена!"
echo ""
echo "  Домен:    http://${DOMAIN}/api/"
echo "  Проверь:  curl http://${DOMAIN}/api/"
echo ""
echo "  Данные БД (сохрани!):"
echo "  • База:     ${DB_NAME}"
echo "  • Юзер:     ${DB_USER}"
echo "  • Пароль:   ${DB_PASS}"
echo "  • URL:      ${DATABASE_URL}"
echo ""
echo "  Полезные команды:"
echo "  • Статус:      systemctl status parking"
echo "  • Логи API:    journalctl -u parking -f"
echo "  • Перезапуск:  systemctl restart parking"
echo "  • Логи Nginx:  tail -f /var/log/nginx/error.log"
echo "================================================="

#!/bin/bash
set -e

# =====================================================
#  Обновление бэкенда "Король парковки"
#  Запуск: sudo bash update.sh
# =====================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo "================================================="
echo "   Обновление бэкенда «Король парковки»"
echo "================================================="
echo ""

if [ "$EUID" -ne 0 ]; then
  error "Запусти от root: sudo bash update.sh"
fi

INSTALL_DIR="/var/www/parking"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -d "$INSTALL_DIR" ]; then
  error "Бэкенд не установлен. Сначала запусти install.sh"
fi

if [ ! -f "$INSTALL_DIR/.env" ]; then
  error "Файл .env не найден в $INSTALL_DIR. Что-то пошло не так."
fi

info "Копирую обновлённые файлы..."
# Копируем всё кроме .env и venv — они не трогаются
rsync -a --exclude='.env' --exclude='venv/' --exclude='install.sh' \
  "$SCRIPT_DIR/" "$INSTALL_DIR/"

info "Обновляю Python зависимости..."
"$INSTALL_DIR/venv/bin/pip" install -q --upgrade pip
"$INSTALL_DIR/venv/bin/pip" install -q -r "$INSTALL_DIR/requirements.txt"

chown -R www-data:www-data "$INSTALL_DIR"

info "Перезапускаю сервис..."
systemctl restart parking

sleep 2
if systemctl is-active --quiet parking; then
  info "Сервис успешно обновлён и запущен!"
else
  warn "Сервис не запустился. Проверь логи: journalctl -u parking -n 50"
fi

echo ""
echo "================================================="
info "Обновление завершено!"
echo ""
echo "  Проверь API:  curl http://localhost:8000/"
echo "  Логи:         journalctl -u parking -f"
echo "================================================="

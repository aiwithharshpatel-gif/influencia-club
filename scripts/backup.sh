#!/bin/sh
set -eu

backup_dir="${BACKUP_DIR:-./backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="${backup_dir}/influenzia-${timestamp}.sql.gz"

mkdir -p "$backup_dir"
umask 077

docker compose exec -T database sh -c \
  'mysqldump --single-transaction --quick --lock-tables=false -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  | gzip -9 > "$backup_file"

gzip -t "$backup_file"
printf 'Backup created: %s\n' "$backup_file"

#!/bin/sh
set -eu

backup_dir="${BACKUP_DIR:-./backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="${backup_dir}/influenzia-${timestamp}.sql.gz"
temporary_file="${backup_dir}/.influenzia-${timestamp}.sql.tmp"

mkdir -p "$backup_dir"
umask 077
trap 'rm -f "$temporary_file"' EXIT HUP INT TERM

docker compose exec -T database sh -c \
  'mysqldump --single-transaction --quick --lock-tables=false -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  > "$temporary_file"

test -s "$temporary_file"
gzip -9c "$temporary_file" > "$backup_file"
gzip -t "$backup_file"
rm -f "$temporary_file"
trap - EXIT HUP INT TERM
printf 'Backup created: %s\n' "$backup_file"

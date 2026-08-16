#!/bin/bash
# Cria um banco de dados por microsserviço na mesma instância Postgres.
# Roda automaticamente na primeira inicialização do container (imagem oficial
# executa tudo em /docker-entrypoint-initdb.d/ nesse momento).
set -e

DATABASES=(user_db event_db order_db payment_db ticket_db dashboard_db)

for db in "${DATABASES[@]}"; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE $db'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
EOSQL
done

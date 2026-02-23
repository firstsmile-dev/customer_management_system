# Rebuilding the database

To delete the existing database and re-run all migrations from scratch:

##postsql reset password

```bash
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'new_password';
\q
```

## Option 1: Use the script (PostgreSQL)

From the project root (with PostgreSQL running and a superuser available):

```bash
# If your superuser is 'postgres' and you're prompted for password:
./backend/scripts/rebuild_db.sh

# Or set the superuser and password (e.g. in .env or inline):
export POSTGRES_USER=postgres
export PGPASSWORD=your_postgres_password
./backend/scripts/rebuild_db.sh
```

The script drops `customer_management_db`, recreates it with owner `cms_user`, then runs `python manage.py migrate`.

## Option 2: Manual steps (PostgreSQL)

1. **Drop and recreate the database** (connect as a superuser, e.g. `postgres`):

   ```bash
   psql -h localhost -p 5432 -U postgres -d postgres -c "DROP DATABASE IF EXISTS customer_management_db;"
   psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE customer_management_db OWNER cms_user;"
   ```

2. **Run migrations** (from `backend/`):

   ```bash
   cd backend
   python manage.py migrate
   ```

## Option 3: SQLite (if you switch to SQLite in settings)

If you use SQLite for local dev:

1. Delete the database file: `rm backend/db.sqlite3`
2. Run migrations: `cd backend && python manage.py migrate`

# Backup & Disaster Recovery Procedure

This document defines the automated backup routine, off-site retention schedule, and verified restore procedure for the **Digital India Error Decoder** WordPress site.

---

## 1. Automated Daily Backup Script (`/usr/local/bin/backup-error-decoder.sh`)

```bash
#!/bin/bash
set -euo pipefail

# Configuration
PROJECT_NAME="error-decoder"
BACKUP_DIR="/var/backups/${PROJECT_NAME}"
DATE=$(date +'%Y-%m-%d_%H%M%S')
RETENTION_DAYS=14

# Database credentials (or read from ~/.my.cnf)
DB_NAME="errordecoder_db"
DB_USER="errordecoder_user"
WP_ROOT="/var/www/error-decoder"

# Destination remote storage (e.g. AWS S3, Backblaze B2, or remote SFTP storage box)
REMOTE_DEST="remote-storage:backups/error-decoder"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting backup for ${PROJECT_NAME}..."

# 1. Database dump
echo "Exporting MariaDB database..."
mysqldump --single-transaction --quick --routines --triggers "${DB_NAME}" | gzip > "${BACKUP_DIR}/${PROJECT_NAME}_db_${DATE}.sql.gz"

# 2. Archive wp-content (themes, plugins, uploads)
echo "Archiving wp-content and configuration..."
tar -czf "${BACKUP_DIR}/${PROJECT_NAME}_files_${DATE}.tar.gz" -C "${WP_ROOT}" wp-content wp-config.php

# 3. Encrypt or sync off-site via rclone / scp
echo "Syncing backups to off-site location..."
rclone copy "${BACKUP_DIR}/" "${REMOTE_DEST}/" --include "*_${DATE}*"

# 4. Prune local files older than retention policy
find "${BACKUP_DIR}" -type f -name "${PROJECT_NAME}_*" -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] Backup completed successfully."
```

Make executable and register in root cron:
```bash
chmod +x /usr/local/bin/backup-error-decoder.sh
# Run daily at 02:30 AM UTC
crontab -e
30 2 * * * /usr/local/bin/backup-error-decoder.sh >> /var/log/backup-error-decoder.log 2>&1
```

---

## 2. Tested Disaster Recovery & Restore Drill

> [!IMPORTANT]
> A backup is only as good as its tested restore. Conduct this restore verification on a test environment or staging directory before final submission.

### Step-by-Step Restoration:

1. **Retrieve the off-site archive**:
   ```bash
   rclone copy remote-storage:backups/error-decoder/<TIMESTAMP_FILES>.tar.gz /tmp/
   rclone copy remote-storage:backups/error-decoder/<TIMESTAMP_DB>.sql.gz /tmp/
   ```

2. **Restore Files**:
   ```bash
   sudo tar -xzf /tmp/<TIMESTAMP_FILES>.tar.gz -C /var/www/error-decoder/
   sudo chown -R www-data:www-data /var/www/error-decoder
   sudo find /var/www/error-decoder -type d -exec chmod 755 {} \;
   sudo find /var/www/error-decoder -type f -exec chmod 644 {} \;
   ```

3. **Restore Database**:
   ```bash
   gunzip < /tmp/<TIMESTAMP_DB>.sql.gz | mysql -u errordecoder_user -p errordecoder_db
   ```

4. **Verify Integrity**:
   - Check WP-CLI status: `wp core is-installed --path=/var/www/error-decoder --allow-root`
   - Test frontend HTTP status: `curl -I https://error-decoder.in`
   - Validate permalinks: `wp rewrite flush --path=/var/www/error-decoder --allow-root`

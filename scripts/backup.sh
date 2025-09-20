# AirSense Database Backup Script
# Usage: ./scripts/backup.sh

set -e

# Configuration
BACKUP_DIR="/var/backups/airsense"
DB_PATH="./backend/database/air_quality.db"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[BACKUP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        print_status "Created backup directory: $BACKUP_DIR"
    fi
}

# Check if database exists
check_database() {
    if [ ! -f "$DB_PATH" ]; then
        print_error "Database not

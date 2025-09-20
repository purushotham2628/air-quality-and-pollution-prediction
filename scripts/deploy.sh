# AirSense Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="airsense"

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_status "Dependencies check passed ✅"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Root dependencies
    npm install
    
    # Backend dependencies
    cd backend
    npm install
    cd ..
    
    # Frontend dependencies
    cd frontend
    npm install
    cd ..
    
    print_status "Dependencies installed ✅"
}

# Build applications
build_applications() {
    print_status "Building applications..."
    
    # Build frontend
    cd frontend
    npm run build
    cd ..
    
    print_status "Applications built ✅"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Backend tests (if available)
    if [ -f "backend/package.json" ] && grep -q "test" backend/package.json; then
        cd backend
        npm test
        cd ..
    fi
    
    # Frontend tests (if available)
    if [ -f "frontend/package.json" ] && grep -q "test" frontend/package.json; then
        cd frontend
        npm test
        cd ..
    fi
    
    print_status "Tests completed ✅"
}

# Deploy to production
deploy_production() {
    print_status "Deploying to production..."
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 not found, installing..."
        npm install -g pm2
    fi
    
    # Stop existing processes
    pm2 stop $PROJECT_NAME-backend $PROJECT_NAME-frontend 2>/dev/null || true
    
    # Start applications with PM2
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    print_status "Production deployment completed ✅"
}

# Deploy to development
deploy_development() {
    print_status "Starting development environment..."
    
    # Kill existing processes
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "next.*dev" 2>/dev/null || true
    
    # Start in development mode
    npm run dev &
    
    print_status "Development environment started ✅"
}

# Deploy using Docker
deploy_docker() {
    print_status "Deploying with Docker..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Build and start containers
    docker-compose down
    docker-compose build
    docker-compose up -d
    
    print_status "Docker deployment completed ✅"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        print_status "Backend health check passed ✅"
    else
        print_error "Backend health check failed ❌"
        exit 1
    fi
    
    # Check frontend (if not in API-only mode)
    if [ "$ENVIRONMENT" != "api-only" ]; then
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            print_status "Frontend health check passed ✅"
        else
            print_warning "Frontend health check failed ⚠️"
        fi
    fi
}

# Cleanup old deployments
cleanup() {
    print_status "Cleaning up..."
    
    # Remove old log files
    find . -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    # Clean npm cache
    npm cache clean --force
    
    print_status "Cleanup completed ✅"
}

# Main deployment flow
main() {
    print_status "Starting AirSense deployment..."
    print_status "Environment: $ENVIRONMENT"
    print_status "Timestamp: $(date)"
    
    check_dependencies
    install_dependencies
    build_applications
    
    # Skip tests in development for faster deployment
    if [ "$ENVIRONMENT" = "production" ]; then
        run_tests
    fi
    
    case $ENVIRONMENT in
        "production")
            deploy_production
            ;;
        "development")
            deploy_development
            ;;
        "docker")
            deploy_docker
            ;;
        *)
            print_error "Unknown environment: $ENVIRONMENT"
            print_error "Available environments: production, development, docker"
            exit 1
            ;;
    esac
    
    health_check
    cleanup
    
    print_status "🎉 Deployment completed successfully!"
    print_status "Backend: http://localhost:5000"
    print_status "Frontend: http://localhost:3000"
    print_status "API Health: http://localhost:5000/api/health"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main

# Exit successfully
exit 0

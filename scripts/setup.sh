#!/bin/bash

# AirSense Setup Script
# This script will set up the entire AirSense application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        print_info "Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version $NODE_VERSION is too old"
        print_info "Please upgrade to Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    print_success "Node.js $(node -v) is installed"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm $(npm -v) is installed"
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    print_info "Installing root dependencies..."
    npm install
    
    print_info "Installing backend dependencies..."
    cd backend && npm install && cd ..
    
    print_info "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
    
    print_success "All dependencies installed"
}

# Setup environment files
setup_env_files() {
    print_header "Setting up Environment Files"
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        print_success "Created backend/.env from example"
        print_warning "Please add your OpenWeather API key to backend/.env"
    else
        print_info "backend/.env already exists"
    fi
    
    # Frontend .env.local
    if [ ! -f "frontend/.env.local" ]; then
        cp frontend/.env.example frontend/.env.local
        print_success "Created frontend/.env.local from example"
    else
        print_info "frontend/.env.local already exists"
    fi
}

# Create necessary directories
create_directories() {
    print_header "Creating Directories"
    
    mkdir -p backend/database
    mkdir -p backend/logs
    mkdir -p scripts
    
    print_success "Created necessary directories"
}

# Check OpenWeather API key
check_api_key() {
    print_header "Checking API Configuration"
    
    if grep -q "your_openweather_api_key_here" backend/.env; then
        print_warning "OpenWeather API key not configured"
        print_info "Please:"
        print_info "1. Visit https://openweathermap.org/api"
        print_info "2. Sign up for a free account"
        print_info "3. Get your API key"
        print_info "4. Replace 'your_openweather_api_key_here' in backend/.env"
        return 1
    else
        print_success "API key appears to be configured"
        return 0
    fi
}

# Test the setup
test_setup() {
    print_header "Testing Setup"
    
    # Test if we can start the backend
    print_info "Testing backend startup..."
    cd backend
    timeout 10s npm start &
    BACKEND_PID=$!
    sleep 5
    
    if kill -0 $BACKEND_PID 2>/dev/null; then
        print_success "Backend starts successfully"
        kill $BACKEND_PID
    else
        print_warning "Backend may have issues starting"
    fi
    
    cd ..
}

# Main setup function
main() {
    print_header "AirSense Setup Script"
    print_info "This script will set up the AirSense application"
    
    check_nodejs
    check_npm
    install_dependencies
    create_directories
    setup_env_files
    
    if check_api_key; then
        test_setup
        print_header "Setup Complete!"
        print_success "AirSense is ready to run"
        print_info "Run 'npm run dev' to start the application"
    else
        print_header "Setup Almost Complete!"
        print_warning "Please configure your OpenWeather API key"
        print_info "Then run 'npm run dev' to start the application"
    fi
    
    print_info ""
    print_info "Next steps:"
    print_info "1. Configure OpenWeather API key in backend/.env"
    print_info "2. Run: npm run dev"
    print_info "3. Open: http://localhost:5000"
    print_info ""
    print_info "For help, see README.md or create an issue on GitHub"
}

# Run main function
main

exit 0
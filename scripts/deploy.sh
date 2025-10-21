#!/bin/bash

# Pharmacy Assistant Academy Deployment Script

set -e

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

# Check if environment is provided
if [ -z "$1" ]; then
    print_error "Environment not specified. Usage: ./deploy.sh [production|staging|preview]"
    exit 1
fi

ENVIRONMENT=$1

print_status "Starting deployment for environment: $ENVIRONMENT"

# Validate environment
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "preview" ]]; then
    print_error "Invalid environment. Use: production, staging, or preview"
    exit 1
fi

# Check if required tools are installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

if ! command -v wrangler &> /dev/null; then
    print_error "wrangler is not installed. Run: npm install -g wrangler"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Run tests
print_status "Running tests..."
npm run test

# Build application
print_status "Building application for $ENVIRONMENT..."
if [ "$ENVIRONMENT" = "production" ]; then
    npm run build:production
else
    npm run build
fi

# Deploy based on environment
case $ENVIRONMENT in
    "production")
        print_status "Deploying to production..."
        npm run deploy:pages:production
        ;;
    "staging"|"preview")
        print_status "Deploying to staging/preview..."
        npm run deploy:pages:preview
        ;;
esac

# Deploy API Worker
print_status "Deploying API Worker..."
npm run deploy:worker

print_status "Deployment completed successfully!"
print_warning "Don't forget to:"
print_warning "1. Update DNS settings if using custom domain"
print_warning "2. Configure SSL certificates"
print_warning "3. Set up monitoring and analytics"
print_warning "4. Update environment variables in Cloudflare dashboard"
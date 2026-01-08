#!/bin/bash

###############################################################################
# Pre-flight Check Script - Document Management Module
# Verifies that all prerequisites are met before running the application
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

###############################################################################
# Helper Functions
###############################################################################

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNING++))
}

section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

###############################################################################
# Checks
###############################################################################

check_node() {
    section "🔍 Node.js and npm"

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        check_pass "Node.js installed: $NODE_VERSION"

        # Check version (need 18+)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            check_pass "Node.js version is 18+ (current: $MAJOR_VERSION)"
        else
            check_warn "Node.js version is below 18 (current: $MAJOR_VERSION). Upgrade recommended."
        fi
    else
        check_fail "Node.js not installed"
        echo "   Install from: https://nodejs.org/"
    fi

    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        check_pass "npm installed: $NPM_VERSION"
    else
        check_fail "npm not installed"
    fi
}

check_docker() {
    section "🐳 Docker"

    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        check_pass "Docker installed: $DOCKER_VERSION"

        # Check if Docker daemon is running
        if docker ps &> /dev/null; then
            check_pass "Docker daemon is running"
        else
            check_fail "Docker daemon is not running"
            echo "   Start Docker Desktop or run: sudo systemctl start docker"
        fi
    else
        check_warn "Docker not installed (optional but recommended)"
        echo "   Install from: https://www.docker.com/get-started"
    fi

    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version)
        check_pass "Docker Compose installed: $COMPOSE_VERSION"
    else
        check_warn "Docker Compose not installed (optional but recommended)"
    fi
}

check_dependencies() {
    section "📦 Node Dependencies"

    if [ -d "node_modules" ]; then
        check_pass "node_modules directory exists"

        # Count installed packages
        PACKAGE_COUNT=$(ls -1 node_modules | wc -l | tr -d ' ')
        check_pass "$PACKAGE_COUNT packages installed"
    else
        check_fail "node_modules not found"
        echo "   Run: npm install"
    fi

    if [ -f "package.json" ]; then
        check_pass "package.json found"
    else
        check_fail "package.json not found"
    fi

    if [ -f "package-lock.json" ]; then
        check_pass "package-lock.json found"
    else
        check_warn "package-lock.json not found"
    fi
}

check_env_file() {
    section "⚙️  Environment Configuration"

    if [ -f ".env" ]; then
        check_pass ".env file exists"

        # Check critical variables
        source .env 2>/dev/null

        # Database
        if [ -n "$DATABASE_HOST" ] && [ -n "$DATABASE_NAME" ]; then
            check_pass "Database configuration present"
        else
            check_fail "Database configuration incomplete"
        fi

        # Redis
        if [ -n "$REDIS_HOST" ]; then
            check_pass "Redis configuration present"
        else
            check_fail "Redis configuration missing"
        fi

        # JWT
        if [ -n "$JWT_SECRET" ]; then
            if [ "$JWT_SECRET" = "your-super-secret-jwt-key-change-this-in-production" ]; then
                check_warn "JWT_SECRET is using default value (change for production!)"
            else
                check_pass "JWT_SECRET configured"
            fi
        else
            check_fail "JWT_SECRET not set"
        fi

        # R2
        if [ -n "$R2_ACCOUNT_ID" ] && [ -n "$R2_ACCESS_KEY_ID" ] && [ -n "$R2_SECRET_ACCESS_KEY" ]; then
            check_pass "Cloudflare R2 configuration present"
        else
            check_fail "Cloudflare R2 configuration incomplete"
            echo "   Set: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT"
        fi

        # Gemini
        if [ -n "$GEMINI_API_KEY" ]; then
            check_pass "Gemini API key configured"
        else
            check_warn "Gemini API key not set (OCR will work without structured parsing)"
        fi

    else
        check_fail ".env file not found"
        echo "   Copy from template: cp .env.example .env"
        echo "   Then edit with your values"
    fi

    if [ -f ".env.example" ]; then
        check_pass ".env.example template exists"
    else
        check_warn ".env.example not found"
    fi
}

check_services() {
    section "🚀 Services (PostgreSQL & Redis)"

    # Check PostgreSQL
    if command -v docker &> /dev/null && docker ps &> /dev/null; then
        if docker ps | grep -q "remindy-postgres-dev"; then
            check_pass "PostgreSQL container is running"

            # Check health
            HEALTH=$(docker inspect --format='{{.State.Health.Status}}' remindy-postgres-dev 2>/dev/null)
            if [ "$HEALTH" = "healthy" ]; then
                check_pass "PostgreSQL is healthy"
            elif [ -n "$HEALTH" ]; then
                check_warn "PostgreSQL health status: $HEALTH"
            fi
        else
            check_warn "PostgreSQL container not running"
            echo "   Start with: docker-compose -f docker-compose.dev.yml up -d"
        fi

        # Check Redis
        if docker ps | grep -q "remindy-redis-dev"; then
            check_pass "Redis container is running"

            # Check health
            HEALTH=$(docker inspect --format='{{.State.Health.Status}}' remindy-redis-dev 2>/dev/null)
            if [ "$HEALTH" = "healthy" ]; then
                check_pass "Redis is healthy"
            elif [ -n "$HEALTH" ]; then
                check_warn "Redis health status: $HEALTH"
            fi
        else
            check_warn "Redis container not running"
            echo "   Start with: docker-compose -f docker-compose.dev.yml up -d"
        fi
    else
        check_warn "Cannot check services (Docker not available)"
        echo "   Make sure PostgreSQL and Redis are running"
    fi
}

check_database_connection() {
    section "🗄️  Database Connection"

    if [ -f ".env" ]; then
        source .env 2>/dev/null

        if command -v docker &> /dev/null && docker ps | grep -q "remindy-postgres-dev"; then
            # Try to connect to database
            if docker exec remindy-postgres-dev psql -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -c "SELECT 1" &> /dev/null; then
                check_pass "Database connection successful"

                # Check if migrations table exists
                MIGRATIONS=$(docker exec remindy-postgres-dev psql -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='migrations'" 2>/dev/null)
                if [ "$MIGRATIONS" = "1" ]; then
                    check_pass "Migrations table exists"

                    # Count executed migrations
                    MIGRATION_COUNT=$(docker exec remindy-postgres-dev psql -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -tAc "SELECT COUNT(*) FROM migrations" 2>/dev/null)
                    if [ "$MIGRATION_COUNT" -gt 0 ]; then
                        check_pass "$MIGRATION_COUNT migration(s) executed"
                    else
                        check_warn "No migrations executed yet"
                        echo "   Run: npm run migration:run"
                    fi
                else
                    check_warn "Migrations not run yet"
                    echo "   Run: npm run migration:run"
                fi

                # Check if documents table exists
                DOCUMENTS=$(docker exec remindy-postgres-dev psql -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='documents'" 2>/dev/null)
                if [ "$DOCUMENTS" = "1" ]; then
                    check_pass "Documents table exists"
                else
                    check_warn "Documents table not found (run migrations)"
                fi
            else
                check_fail "Cannot connect to database"
            fi
        else
            check_warn "Cannot test database connection (container not running)"
        fi
    fi
}

check_redis_connection() {
    section "📮 Redis Connection"

    if command -v docker &> /dev/null && docker ps | grep -q "remindy-redis-dev"; then
        if docker exec remindy-redis-dev redis-cli ping &> /dev/null; then
            check_pass "Redis connection successful"

            # Check queue keys
            QUEUE_KEYS=$(docker exec remindy-redis-dev redis-cli KEYS "bull:ocr:*" 2>/dev/null | wc -l | tr -d ' ')
            if [ "$QUEUE_KEYS" -gt 0 ]; then
                check_pass "Queue keys found ($QUEUE_KEYS keys)"
            else
                check_pass "Redis ready (no queue keys yet)"
            fi
        else
            check_fail "Cannot connect to Redis"
        fi
    else
        check_warn "Cannot test Redis connection (container not running)"
    fi
}

check_r2_bucket() {
    section "☁️  Cloudflare R2"

    if [ -f ".env" ]; then
        source .env 2>/dev/null

        if [ -n "$R2_BUCKET_NAME" ]; then
            check_pass "Bucket name configured: $R2_BUCKET_NAME"
        else
            check_fail "R2_BUCKET_NAME not set"
        fi

        if [ -n "$R2_ENDPOINT" ]; then
            check_pass "R2 endpoint configured"
        else
            check_fail "R2_ENDPOINT not set"
        fi

        echo ""
        echo "   ℹ️  Cannot verify bucket access without running the application"
        echo "   Make sure the bucket exists and credentials are correct"
    fi
}

check_scripts() {
    section "📜 Scripts"

    if [ -f "scripts/generate-test-token.js" ]; then
        check_pass "Token generator script exists"
        if [ -x "scripts/generate-test-token.js" ]; then
            check_pass "Token generator is executable"
        fi
    else
        check_warn "Token generator script not found"
    fi

    if [ -f "scripts/test-api.sh" ]; then
        check_pass "API test script exists"
        if [ -x "scripts/test-api.sh" ]; then
            check_pass "API test script is executable"
        else
            check_warn "API test script is not executable"
            echo "   Run: chmod +x scripts/test-api.sh"
        fi
    else
        check_warn "API test script not found"
    fi
}

###############################################################################
# Summary
###############################################################################

show_summary() {
    section "📊 Summary"

    TOTAL=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))

    echo ""
    echo "Total checks:     $TOTAL"
    echo -e "${GREEN}Passed:           $CHECKS_PASSED${NC}"

    if [ $CHECKS_WARNING -gt 0 ]; then
        echo -e "${YELLOW}Warnings:         $CHECKS_WARNING${NC}"
    else
        echo -e "${GREEN}Warnings:         $CHECKS_WARNING${NC}"
    fi

    if [ $CHECKS_FAILED -gt 0 ]; then
        echo -e "${RED}Failed:           $CHECKS_FAILED${NC}"
    else
        echo -e "${GREEN}Failed:           $CHECKS_FAILED${NC}"
    fi

    echo ""

    if [ $CHECKS_FAILED -eq 0 ]; then
        if [ $CHECKS_WARNING -eq 0 ]; then
            echo -e "${GREEN}✓ All checks passed! You're ready to go! 🚀${NC}"
            echo ""
            echo "Next steps:"
            echo "  1. npm run migration:run    (if not done yet)"
            echo "  2. npm run start:dev"
            echo "  3. npm run test"
        else
            echo -e "${YELLOW}⚠ Setup is mostly complete, but there are some warnings${NC}"
            echo ""
            echo "You can proceed, but review the warnings above."
        fi
    else
        echo -e "${RED}✗ Setup incomplete - fix the failed checks above${NC}"
        echo ""
        echo "Common fixes:"
        echo "  - Run: npm install"
        echo "  - Copy: cp .env.example .env (and edit)"
        echo "  - Start services: docker-compose -f docker-compose.dev.yml up -d"
        echo "  - Run migrations: npm run migration:run"
    fi

    echo ""
}

###############################################################################
# Main
###############################################################################

main() {
    clear
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║            Document Management Module - Setup Check          ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    check_node
    check_docker
    check_dependencies
    check_env_file
    check_services
    check_database_connection
    check_redis_connection
    check_r2_bucket
    check_scripts

    show_summary
}

# Run
main "$@"

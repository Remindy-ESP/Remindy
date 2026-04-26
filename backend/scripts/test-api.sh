#!/bin/bash

###############################################################################
# API Test Script - Document Management Module
# Tests all endpoints with various scenarios
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TEST_FILE="${TEST_FILE:-./test-document.pdf}"

# Counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

###############################################################################
# Helper Functions
###############################################################################

log_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
    ((TESTS_RUN++))
}

log_error() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
    ((TESTS_RUN++))
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

check_response() {
    local response="$1"
    local expected_status="$2"
    local test_name="$3"

    local status=$(echo "$response" | head -n 1 | grep -o '[0-9]\{3\}')

    if [ "$status" = "$expected_status" ]; then
        log_success "$test_name (status: $status)"
        return 0
    else
        log_error "$test_name (expected: $expected_status, got: $status)"
        echo "Response: $response" | tail -n +2
        return 1
    fi
}

###############################################################################
# Setup
###############################################################################

setup() {
    log_section "🔧 Setup"

    # Check if server is running
    log_info "Checking if server is running at $API_URL..."
    if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
        log_success "Server is running"
    else
        log_error "Server is not running at $API_URL"
        log_warning "Start the server with: npm run start:dev"
        exit 1
    fi

    # Check if test file exists
    if [ ! -f "$TEST_FILE" ]; then
        log_warning "Test file not found: $TEST_FILE"
        log_info "Creating a dummy PDF file..."

        # Create a minimal PDF
        cat > "$TEST_FILE" << 'EOF'
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF
EOF
        log_success "Created test PDF file"
    else
        log_success "Test file found: $TEST_FILE"
    fi

    echo ""
}

###############################################################################
# Generate JWT Token
###############################################################################

generate_token() {
    log_section "🔑 Generate JWT Token"

    log_info "Generating JWT token for testing..."

    # Try to use the generate-test-token script if available
    if [ -f "scripts/generate-test-token.js" ]; then
        TOKEN=$(node scripts/generate-test-token.js premium 1 2>/dev/null | grep -A 1 "Token:" | tail -n 1 | tr -d ' ')
        if [ -n "$TOKEN" ]; then
            log_success "Token generated successfully"
            echo "Token (first 50 chars): ${TOKEN:0:50}..."
            export TOKEN
            return 0
        fi
    fi

    # Fallback: use environment variable or ask user
    if [ -n "$TOKEN" ]; then
        log_success "Using TOKEN from environment"
    else
        log_warning "No token available"
        log_info "Please set TOKEN environment variable or run:"
        log_info "  node scripts/generate-test-token.js"
        echo ""
        read -p "Enter JWT token: " TOKEN
        export TOKEN
    fi

    echo ""
}

###############################################################################
# Test Cases
###############################################################################

test_health() {
    log_section "🏥 Health Check"

    local response=$(curl -s -w "\n%{http_code}" "$API_URL/health")
    check_response "$response" "200" "Health endpoint"
}

test_upload_document() {
    log_section "📤 Upload Document"

    log_info "Uploading document..."
    local response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/documents/upload" \
        -H "Authorization: Bearer $TOKEN" \
        -F "file=@$TEST_FILE" \
        -F "title=Test Document $(date +%s)" \
        -F "description=Automated test upload")

    if check_response "$response" "201" "Upload document"; then
        # Extract document ID from response
        DOCUMENT_ID=$(echo "$response" | sed '$d' | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        JOB_ID=$(echo "$response" | sed '$d' | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)

        if [ -n "$DOCUMENT_ID" ]; then
            log_info "Document ID: $DOCUMENT_ID"
            export DOCUMENT_ID
        fi

        if [ -n "$JOB_ID" ]; then
            log_info "Job ID: $JOB_ID"
            export JOB_ID
        fi
    fi
}

test_upload_without_auth() {
    log_section "🚫 Upload Without Authentication"

    log_info "Attempting upload without token..."
    local response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/documents/upload" \
        -F "file=@$TEST_FILE" \
        -F "title=Should Fail")

    check_response "$response" "401" "Upload without auth (should fail)"
}

test_list_documents() {
    log_section "📋 List Documents"

    log_info "Fetching documents list..."
    local response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/documents" \
        -H "Authorization: Bearer $TOKEN")

    if check_response "$response" "200" "List documents"; then
        local count=$(echo "$response" | sed '$d' | grep -o '"id":' | wc -l)
        log_info "Found $count document(s)"
    fi
}

test_get_document() {
    log_section "📄 Get Document Details"

    if [ -z "$DOCUMENT_ID" ]; then
        log_warning "No document ID available, skipping test"
        return
    fi

    log_info "Fetching document $DOCUMENT_ID..."
    local response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/documents/$DOCUMENT_ID" \
        -H "Authorization: Bearer $TOKEN")

    check_response "$response" "200" "Get document details"
}

test_get_nonexistent_document() {
    log_section "🔍 Get Non-existent Document"

    log_info "Attempting to fetch non-existent document..."
    local response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/documents/999999" \
        -H "Authorization: Bearer $TOKEN")

    check_response "$response" "404" "Get non-existent document (should fail)"
}

test_job_status() {
    log_section "⏳ Check Job Status"

    if [ -z "$JOB_ID" ]; then
        log_warning "No job ID available, skipping test"
        return
    fi

    log_info "Checking job status for job $JOB_ID..."
    local response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/documents/jobs/$JOB_ID" \
        -H "Authorization: Bearer $TOKEN")

    if check_response "$response" "200" "Get job status"; then
        local status=$(echo "$response" | sed '$d' | grep -o '"state":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$status" ]; then
            log_info "Job status: $status"
        fi
    fi
}

test_queue_stats() {
    log_section "📊 Queue Statistics"

    log_info "Fetching queue statistics..."
    local response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/documents/queue/stats" \
        -H "Authorization: Bearer $TOKEN")

    if check_response "$response" "200" "Get queue stats"; then
        local waiting=$(echo "$response" | sed '$d' | grep -o '"waiting":[0-9]*' | cut -d':' -f2)
        local active=$(echo "$response" | sed '$d' | grep -o '"active":[0-9]*' | cut -d':' -f2)
        local completed=$(echo "$response" | sed '$d' | grep -o '"completed":[0-9]*' | cut -d':' -f2)
        local failed=$(echo "$response" | sed '$d' | grep -o '"failed":[0-9]*' | cut -d':' -f2)

        log_info "Queue: waiting=$waiting, active=$active, completed=$completed, failed=$failed"
    fi
}

test_quota() {
    log_section "💾 Check Quota"

    log_info "Fetching quota information..."
    local response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/documents/quota" \
        -H "Authorization: Bearer $TOKEN")

    if check_response "$response" "200" "Get quota"; then
        local role=$(echo "$response" | sed '$d' | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
        local storage_used=$(echo "$response" | sed '$d' | grep -o '"used":[0-9]*' | head -1 | cut -d':' -f2)
        local docs_used=$(echo "$response" | sed '$d' | grep -o '"used":[0-9]*' | tail -1 | cut -d':' -f2)

        log_info "Role: $role, Storage used: $storage_used bytes, Documents: $docs_used"
    fi
}

test_download() {
    log_section "⬇️  Download Document"

    if [ -z "$DOCUMENT_ID" ]; then
        log_warning "No document ID available, skipping test"
        return
    fi

    log_info "Downloading document $DOCUMENT_ID..."
    local temp_file="/tmp/downloaded-doc-$$.pdf"

    local http_code=$(curl -s -w "%{http_code}" -o "$temp_file" \
        -X GET "$API_URL/documents/$DOCUMENT_ID/download" \
        -H "Authorization: Bearer $TOKEN")

    if [ "$http_code" = "200" ]; then
        if [ -f "$temp_file" ] && [ -s "$temp_file" ]; then
            log_success "Download document (status: 200, size: $(stat -f%z "$temp_file" 2>/dev/null || stat -c%s "$temp_file" 2>/dev/null) bytes)"
            rm -f "$temp_file"
            ((TESTS_PASSED++))
            ((TESTS_RUN++))
        else
            log_error "Download document (file empty or not created)"
            ((TESTS_FAILED++))
            ((TESTS_RUN++))
        fi
    else
        log_error "Download document (expected: 200, got: $http_code)"
        ((TESTS_FAILED++))
        ((TESTS_RUN++))
    fi
}

test_reprocess() {
    log_section "🔄 Reprocess OCR"

    if [ -z "$DOCUMENT_ID" ]; then
        log_warning "No document ID available, skipping test"
        return
    fi

    # Wait a bit for the first OCR to complete
    log_info "Waiting 5 seconds for initial OCR to complete..."
    sleep 5

    log_info "Reprocessing document $DOCUMENT_ID..."
    local response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/documents/$DOCUMENT_ID/reprocess" \
        -H "Authorization: Bearer $TOKEN")

    if check_response "$response" "200" "Reprocess OCR"; then
        local new_job_id=$(echo "$response" | sed '$d' | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$new_job_id" ]; then
            log_info "New job ID: $new_job_id"
        fi
    fi
}

test_delete_document() {
    log_section "🗑️  Delete Document"

    if [ -z "$DOCUMENT_ID" ]; then
        log_warning "No document ID available, skipping test"
        return
    fi

    log_info "Deleting document $DOCUMENT_ID..."
    local response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/documents/$DOCUMENT_ID" \
        -H "Authorization: Bearer $TOKEN")

    check_response "$response" "200" "Delete document"
}

test_delete_already_deleted() {
    log_section "♻️  Delete Already Deleted Document"

    if [ -z "$DOCUMENT_ID" ]; then
        log_warning "No document ID available, skipping test"
        return
    fi

    log_info "Attempting to delete already deleted document..."
    local response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/documents/$DOCUMENT_ID" \
        -H "Authorization: Bearer $TOKEN")

    check_response "$response" "404" "Delete already deleted document (should fail)"
}

###############################################################################
# Summary
###############################################################################

show_summary() {
    log_section "📊 Test Summary"

    echo "Total tests run:    $TESTS_RUN"
    echo -e "${GREEN}Tests passed:       $TESTS_PASSED${NC}"

    if [ $TESTS_FAILED -gt 0 ]; then
        echo -e "${RED}Tests failed:       $TESTS_FAILED${NC}"
    else
        echo -e "${GREEN}Tests failed:       $TESTS_FAILED${NC}"
    fi

    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}✗ Some tests failed${NC}"
        exit 1
    fi
}

###############################################################################
# Main Execution
###############################################################################

main() {
    clear
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║         Document Management Module - API Test Suite          ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    setup
    generate_token

    # Run all tests
    test_health
    test_upload_without_auth
    test_upload_document
    test_list_documents
    test_get_document
    test_get_nonexistent_document
    test_job_status
    test_queue_stats
    test_quota
    test_download
    test_reprocess
    test_delete_document
    test_delete_already_deleted

    show_summary
}

# Run main function
main "$@"

#!/usr/bin/env bash
# ==============================================================================
# SecureClaw - One-Command Installation Script
# ==============================================================================
# Usage:
#   curl -fsSL https://secureclaw.ai/install.sh | bash
#   Or: bash install.sh
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ==============================================================================
# Helper Functions
# ==============================================================================

print_header() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC}  🛡️  ${GREEN}SecureClaw Installation${NC}                                ${BLUE}║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_step() {
  echo -e "${BLUE}▶${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# ==============================================================================
# System Checks
# ==============================================================================

check_os() {
  print_step "Checking operating system..."

  OS="$(uname -s)"
  case "$OS" in
    Linux*)     OS_TYPE=Linux;;
    Darwin*)    OS_TYPE=Mac;;
    *)          OS_TYPE="UNKNOWN:$OS"
  esac

  if [[ "$OS_TYPE" == "UNKNOWN"* ]]; then
    print_error "Unsupported operating system: $OS"
    exit 1
  fi

  print_success "Operating system: $OS_TYPE"
}

check_node() {
  print_step "Checking Node.js..."

  if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    echo ""
    echo "Please install Node.js first:"
    echo "  • macOS: brew install node"
    echo "  • Linux: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "  • Or visit: https://nodejs.org"
    exit 1
  fi

  NODE_VERSION=$(node --version)
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1 | sed 's/v//')

  if [ "$NODE_MAJOR" -lt 18 ]; then
    print_error "Node.js version $NODE_VERSION is too old (need v18+)"
    echo "Please upgrade Node.js: https://nodejs.org"
    exit 1
  fi

  print_success "Node.js $NODE_VERSION"
}

check_pnpm() {
  print_step "Checking pnpm..."

  if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm not found, installing..."
    npm install -g pnpm
    print_success "pnpm installed"
  else
    PNPM_VERSION=$(pnpm --version)
    print_success "pnpm $PNPM_VERSION"
  fi
}

check_git() {
  print_step "Checking git..."

  if ! command -v git &> /dev/null; then
    print_error "git is not installed"
    echo "Please install git: https://git-scm.com"
    exit 1
  fi

  print_success "git $(git --version | awk '{print $3}')"
}

# ==============================================================================
# Installation
# ==============================================================================

detect_install_location() {
  print_step "Detecting installation location..."

  # Check if we're already in the openclaw directory
  if [[ -f "package.json" ]] && grep -q "secureclaw" package.json 2>/dev/null; then
    INSTALL_DIR="$(pwd)"
    print_success "Using current directory: $INSTALL_DIR"
    return
  fi

  # Check if openclaw exists in current directory
  if [[ -d "openclaw" ]]; then
    INSTALL_DIR="$(pwd)/openclaw"
    print_success "Using existing directory: $INSTALL_DIR"
    return
  fi

  # Default: install to current directory
  INSTALL_DIR="$(pwd)/openclaw"
  print_success "Will install to: $INSTALL_DIR"
}

install_dependencies() {
  print_step "Installing dependencies (this may take 2-3 minutes)..."

  cd "$INSTALL_DIR"

  if ! pnpm install --silent; then
    print_error "Failed to install dependencies"
    exit 1
  fi

  print_success "Dependencies installed"
}

build_project() {
  print_step "Building SecureClaw (this may take 1-2 minutes)..."

  cd "$INSTALL_DIR"

  if ! pnpm build > /tmp/secureclaw-build.log 2>&1; then
    print_error "Build failed. Log saved to /tmp/secureclaw-build.log"
    tail -20 /tmp/secureclaw-build.log
    exit 1
  fi

  print_success "Build complete"
}

# ==============================================================================
# Configuration
# ==============================================================================

setup_oauth() {
  print_step "Setting up OpenAI authentication..."

  echo ""
  echo "SecureClaw needs OpenAI access to work."
  echo ""
  echo "Choose authentication method:"
  echo "  1) OAuth (ChatGPT Pro account) [Recommended]"
  echo "  2) API Key (OpenAI API)"
  echo "  3) Skip for now"
  echo ""
  read -p "Enter choice (1-3): " auth_choice

  case "$auth_choice" in
    1)
      echo ""
      echo "Starting OAuth flow..."
      echo "A browser window will open. Log in with your ChatGPT Pro account."
      echo ""
      read -p "Press Enter to continue..."

      cd "$INSTALL_DIR"
      pnpm secureclaw setup-oauth
      ;;
    2)
      echo ""
      echo "Get your API key from: https://platform.openai.com/api-keys"
      echo ""
      read -p "Enter OpenAI API key: " api_key

      if [[ -n "$api_key" ]]; then
        mkdir -p ~/.secureclaw
        echo "{\"openai\": {\"apiKey\": \"$api_key\"}}" > ~/.secureclaw/models.json
        chmod 600 ~/.secureclaw/models.json
        print_success "API key saved"
      fi
      ;;
    3)
      print_warning "Skipping authentication (you can set it up later with: pnpm secureclaw setup-oauth)"
      ;;
  esac
}

setup_llm_judge() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  print_step "Setting up LLM Judge (optional security feature)..."

  echo ""
  echo "LLM Judge provides context-aware threat detection using AI."
  echo "It detects novel threats like AWS SSRF, obfuscated commands, etc."
  echo ""
  echo "Cost: ~\$1-3/month per user with caching"
  echo ""
  read -p "Enable LLM Judge? (y/N): " enable_llm

  if [[ "$enable_llm" =~ ^[Yy]$ ]]; then
    cd "$INSTALL_DIR"
    pnpm setup-llm-judge
  else
    print_warning "LLM Judge disabled (pattern-only mode)"
    echo "You can enable it later with: pnpm setup-llm-judge"
  fi
}

# ==============================================================================
# Health Check
# ==============================================================================

run_health_check() {
  print_step "Running health check..."

  cd "$INSTALL_DIR"

  # Check if build artifacts exist
  if [[ ! -f "dist/index.js" ]]; then
    print_error "Build artifacts not found"
    return 1
  fi

  # Check if config directory exists
  if [[ ! -d ~/.secureclaw ]]; then
    mkdir -p ~/.secureclaw
    chmod 700 ~/.secureclaw
  fi

  print_success "Health check passed"
}

# ==============================================================================
# Post-Install
# ==============================================================================

create_shell_alias() {
  print_step "Creating shell alias..."

  local shell_rc=""
  if [[ -n "$ZSH_VERSION" ]] || [[ "$SHELL" == *"zsh"* ]]; then
    shell_rc="$HOME/.zshrc"
  elif [[ -n "$BASH_VERSION" ]] || [[ "$SHELL" == *"bash"* ]]; then
    shell_rc="$HOME/.bashrc"
  fi

  if [[ -n "$shell_rc" ]]; then
    # Check if alias already exists
    if ! grep -q "alias secureclaw=" "$shell_rc" 2>/dev/null; then
      echo "" >> "$shell_rc"
      echo "# SecureClaw" >> "$shell_rc"
      echo "alias secureclaw='cd $INSTALL_DIR && pnpm secureclaw'" >> "$shell_rc"
      print_success "Shell alias added to $shell_rc"
    else
      print_success "Shell alias already exists"
    fi

    # Store shell_rc path for use in success message
    SHELL_RC_PATH="$shell_rc"
  fi
}

print_success_message() {
  echo ""
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║${NC}  ✅ ${GREEN}Installation Complete!${NC}                                    ${GREEN}║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "📍 Installation directory: $INSTALL_DIR"
  echo ""

  # Reload shell config instruction - CRITICAL!
  if [[ -n "$SHELL_RC_PATH" ]]; then
    echo -e "${YELLOW}⚠️  IMPORTANT: Reload your shell configuration first!${NC}"
    echo ""
    echo "   Run this command now:"
    echo -e "   ${GREEN}source $SHELL_RC_PATH${NC}"
    echo ""
    echo "   Or open a new terminal window"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
  fi

  echo "🚀 Start SecureClaw:"
  echo ""
  echo "   Option 1 - Interactive Terminal UI (recommended):"
  echo "   ${GREEN}secureclaw tui${NC}"
  echo ""
  echo "   Option 2 - Gateway Service (background):"
  echo "   secureclaw gateway"
  echo ""
  echo "   Option 3 - One-off message:"
  echo "   secureclaw agent --agent main -m \"Hello, SecureClaw!\""
  echo ""
  echo "   Without alias (works immediately):"
  echo "   cd $INSTALL_DIR && pnpm secureclaw tui"
  echo ""
  echo "📖 Documentation:"
  echo "   • Quick Start: $INSTALL_DIR/README.md"
  echo "   • LLM Judge: $INSTALL_DIR/QUICK-START-LLM-JUDGE.md"
  echo "   • Security Coach: $INSTALL_DIR/SECURITY-COACH-LLM-JUDGE.md"
  echo ""
  echo "🧪 Test it:"
  echo "   secureclaw agent --agent main -m \"Hello, SecureClaw!\""
  echo ""
  echo "❓ Need help?"
  echo "   • GitHub: https://github.com/anthropics/secureclaw"
  echo "   • Issues: https://github.com/anthropics/secureclaw/issues"
  echo ""
}

# ==============================================================================
# Main Installation Flow
# ==============================================================================

main() {
  print_header

  # System checks
  check_os
  check_node
  check_pnpm
  check_git

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Installation
  detect_install_location

  if [[ ! -d "$INSTALL_DIR" ]] || [[ ! -f "$INSTALL_DIR/package.json" ]]; then
    print_error "SecureClaw source code not found at $INSTALL_DIR"
    echo ""
    echo "Please clone the repository first:"
    echo "  git clone https://github.com/anthropics/secureclaw.git"
    echo "  cd secureclaw"
    echo "  bash install.sh"
    exit 1
  fi

  install_dependencies
  build_project

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Configuration
  setup_oauth
  setup_llm_judge

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Health check
  run_health_check

  # Post-install
  create_shell_alias

  # Success
  print_success_message
}

# Run installation
main "$@"

#!/bin/bash
set -e

if command -v gh &>/dev/null; then
  echo "gh CLI already installed: $(gh --version | head -1)"
  exit 0
fi

OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
  if ! command -v brew &>/dev/null; then
    echo "Homebrew가 필요합니다: https://brew.sh"
    exit 1
  fi
  brew install gh

elif [ "$OS" = "Linux" ]; then
  if command -v apt-get &>/dev/null; then
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      | sudo tee /etc/apt/sources.list.d/github-cli.list
    sudo apt-get update && sudo apt-get install -y gh
  elif command -v dnf &>/dev/null; then
    sudo dnf install -y 'dnf-command(config-manager)'
    sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
    sudo dnf install -y gh
  elif command -v yum &>/dev/null; then
    sudo yum-config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
    sudo yum install -y gh
  else
    echo "지원되지 않는 Linux 배포판입니다. 수동 설치: https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
    exit 1
  fi

else
  echo "지원되지 않는 OS입니다: $OS"
  echo "Windows는 'winget install GitHub.cli' 또는 'scoop install gh'를 사용하세요."
  exit 1
fi

echo ""
echo "✅ gh CLI 설치 완료: $(gh --version | head -1)"
echo ""
echo "다음 명령어로 GitHub 인증을 완료하세요:"
echo "  gh auth login"

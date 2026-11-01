# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-01

### Added
- **Real-Time Collaboration**: Multi-user editing synchronized via Socket.io WebSockets
- **Isolated Code Execution**: Secure Docker sandboxing for Python 3, JavaScript (Node.js 18), and C++ (g++)
- **Security Safeguards**:
  - Memory limit (128MB per execution)
  - CPU limit (0.5 cores)
  - Execution timeout (5-10s)
  - Network isolation (`none` network mode)
  - Non-root user execution (UID 1000)
  - Automatic container cleanup
- **Modern Developer Interface**:
  - Monaco Editor integration with VS Code dark theme
  - Syntax highlighting for Python, JS, and C++
  - Real-time room participant indicator
  - Collapsible execution output console
  - One-click room ID copying
- **Docker Orchestration**:
  - Automated image building scripts (`npm run build-images`)
  - Health check endpoint (`/api/health`)
  - Dockerode SDK container lifecycle management
- **Documentation**:
  - Comprehensive README with architecture diagrams and API specs
  - Visual screenshots for all features and language execution
  - Contribution guidelines and issue templates

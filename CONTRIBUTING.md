# Contributing to Real-Time Collaborative Code Editor

Thank you for your interest in contributing! We welcome contributions from the community.

## 🚀 Getting Started

### Prerequisites
- Node.js v16 or higher
- Docker Desktop installed and running
- Git

### Setup for Development

1. **Fork the repository**
   - Click the "Fork" button at the top right of this repository

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/Real-Time-Collaborative-Code-Sync-Execution-Engine.git
   cd Real-Time-Collaborative-Code-Sync-Execution-Engine
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Build Docker images**
   ```bash
   npm run build-images
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🔧 Making Changes

### Create a Branch
```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names:
- `feature/add-file-upload`
- `bugfix/fix-connection-timeout`
- `docs/update-readme`

### Code Style Guidelines
- **Indentation**: 2 spaces (no tabs)
- **Semicolons**: Use them consistently
- **Naming**: Use camelCase for variables and functions
- **Comments**: Add comments for complex logic
- **Console logs**: Remove debug logs before committing

### File Structure
```
client/       # Frontend code (HTML, CSS, JS)
server/       # Backend Node.js server
docker/       # Docker container definitions
scripts/      # Build and utility scripts
screenshots/  # Project screenshots
```

## ✅ Testing Your Changes

1. **Test all three languages**
   - Run Python code samples
   - Run JavaScript code samples
   - Run C++ code samples

2. **Test real-time collaboration**
   - Open two browser tabs
   - Join the same room
   - Verify code syncs between tabs

3. **Test error handling**
   - Try invalid code
   - Test timeout scenarios
   - Check memory limits

## 📝 Commit Guidelines

### Commit Message Format
```
type: brief description

- Detailed point 1
- Detailed point 2
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

**Examples:**
```
feat: add file upload support

- Add drag-and-drop file upload
- Support .py, .js, .cpp files
- Display uploaded filename in UI
```

```
fix: resolve WebSocket reconnection issue

- Add reconnection logic on disconnect
- Show connection status to user
- Handle edge case when server restarts
```

## 🔀 Submitting a Pull Request

1. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

2. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill in the PR template with:
     - What changes you made
     - Why you made them
     - How to test them
     - Screenshots (if UI changes)

4. **Wait for review**
   - Address any feedback
   - Make requested changes
   - Push updates to the same branch

## 🐛 Reporting Bugs

Found a bug? Please open an issue with:

### Bug Report Template
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows 11, macOS 14]
- Browser: [e.g., Chrome 120, Firefox 121]
- Node.js version: [e.g., 18.17.0]
- Docker version: [e.g., 24.0.6]
```

## 💡 Feature Requests

Have an idea? Open an issue with:

### Feature Request Template
```markdown
**Is your feature related to a problem?**
Describe the problem or use case.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you thought about.

**Additional context**
Any other context, mockups, or examples.
```

## 🎯 Good First Issues

Looking for where to start? Check issues labeled:
- `good first issue` - Great for newcomers
- `help wanted` - We need community help
- `enhancement` - New features to build

## 📚 Helpful Resources

- [Socket.io Documentation](https://socket.io/docs/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [Docker Documentation](https://docs.docker.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on what is best for the community

## ❓ Questions?

Feel free to:
- Open a discussion in the Issues tab
- Ask questions in your Pull Request
- Reach out to maintainers

---

**Thank you for contributing! 🚀**

Every contribution, no matter how small, helps make this project better.

// Global state
let socket;
let editor;
let currentRoomId = null;
let currentUsername = null;
let isRemoteChange = false;

// Language templates
const LANGUAGE_TEMPLATES = {
  python: '# Write your Python code here\nprint("Hello, World!")',
  javascript: '// Write your JavaScript code here\nconsole.log("Hello, World!");',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}'
};

// Initialize Monaco Editor
function initializeEditor() {
  console.log('Initializing Monaco Editor...');
  require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });

  require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(document.getElementById('editor'), {
      value: LANGUAGE_TEMPLATES.python,
      language: 'python',
      theme: 'vs-dark',
      fontSize: 14,
      lineNumbers: 'on',
      minimap: { enabled: true },
      automaticLayout: true,
      tabSize: 4,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      padding: { top: 16 }
    });

    // Listen for content changes
    editor.onDidChangeModelContent((event) => {
      if (!isRemoteChange && socket && socket.connected && currentRoomId) {
        const code = editor.getValue();
        socket.emit('code-change', {
          roomId: currentRoomId,
          code: code
        });
      }
    });

    console.log('✅ Monaco Editor initialized');
    logToConsole('Editor ready', 'success');
  }, function(err) {
    console.error('❌ Monaco Editor failed to load:', err);
    logToConsole('Error: Editor failed to load', 'error');
  });
}

// Initialize Socket.io connection
function initializeSocket() {
  console.log('Initializing Socket.io connection...');

  if (typeof io === 'undefined') {
    console.error('❌ Socket.io library not found!');
    logToConsole('CRITICAL ERROR: Socket.io not loaded. Please refresh.', 'error');
    return;
  }

  try {
    socket = io(window.location.origin);
    console.log('Socket.io connection initiated');

    socket.on('connect', () => {
      console.log('✅ Connected to server with socket ID:', socket.id);
      logToConsole('Connected to server', 'success');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      logToConsole('Disconnected from server', 'error');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      logToConsole('Connection error: ' + error.message, 'error');
    });

    // Sync code when joining room
    socket.on('sync-code', ({ code, language }) => {
      console.log('Syncing code from server...');
      isRemoteChange = true;
      editor.setValue(code);

      const languageSelect = document.getElementById('languageSelect');
      languageSelect.value = language;

      const monacoLanguage = language === 'cpp' ? 'cpp' : language;
      monaco.editor.setModelLanguage(editor.getModel(), monacoLanguage);

      isRemoteChange = false;
      logToConsole('Code synchronized', 'info');
    });

    // Update code from other users
    socket.on('code-update', ({ code }) => {
      isRemoteChange = true;
      const position = editor.getPosition();
      editor.setValue(code);
      editor.setPosition(position);
      isRemoteChange = false;
    });

    // Update language from other users
    socket.on('language-update', ({ language }) => {
      const languageSelect = document.getElementById('languageSelect');
      languageSelect.value = language;

      const monacoLanguage = language === 'cpp' ? 'cpp' : language;
      monaco.editor.setModelLanguage(editor.getModel(), monacoLanguage);
      logToConsole(`Language changed to ${language}`, 'info');
    });

    // User joined the room
    socket.on('user-joined', ({ users, message }) => {
      updateUserCount(users.length);
      logToConsole(message, 'info');
    });

    // User left the room
    socket.on('user-left', ({ users, message }) => {
      updateUserCount(users.length);
      logToConsole(message, 'info');
    });

  } catch (error) {
    console.error('Error initializing Socket.io:', error);
    logToConsole('Failed to initialize Socket.io: ' + error.message, 'error');
  }
}

// Join a room
function joinRoom(roomId, username) {
  if (!socket || !socket.connected) {
    logToConsole('Error: Not connected to server. Please wait and try again.', 'error');
    return;
  }

  currentRoomId = roomId || generateRoomId();
  currentUsername = username || 'Anonymous';

  socket.emit('join-room', {
    roomId: currentRoomId,
    username: currentUsername
  });

  document.getElementById('roomIdDisplay').textContent = currentRoomId;
  document.getElementById('joinModal').classList.add('hidden');

  logToConsole(`Joined room: ${currentRoomId} as ${currentUsername}`, 'success');
}

// Generate random room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Update user count display
function updateUserCount(count) {
  document.getElementById('userCount').textContent = count;
}

// Log message to console
function logToConsole(message, type = 'output') {
  const consoleContent = document.getElementById('consoleContent');
  const messageDiv = document.createElement('div');
  messageDiv.className = `console-message console-${type}`;
  messageDiv.textContent = message;
  consoleContent.appendChild(messageDiv);
  consoleContent.scrollTop = consoleContent.scrollHeight;
}

// Clear console
function clearConsole() {
  document.getElementById('consoleContent').innerHTML = '';
}

// Execute code
async function executeCode() {
  const code = editor.getValue();
  const language = document.getElementById('languageSelect').value;
  const runBtn = document.getElementById('runBtn');

  if (!code.trim()) {
    logToConsole('Error: No code to execute', 'error');
    return;
  }

  // Disable run button
  runBtn.disabled = true;
  runBtn.textContent = 'Running...';

  logToConsole(`Executing ${language} code...`, 'loading');

  try {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, language })
    });

    const result = await response.json();

    if (result.success) {
      if (result.stdout) {
        logToConsole(result.stdout, 'output');
      }
      logToConsole('✓ Execution completed successfully', 'success');
    } else {
      if (result.stderr) {
        logToConsole(result.stderr, 'error');
      }
      if (result.error) {
        logToConsole(`Error: ${result.error}`, 'error');
      }
    }
  } catch (error) {
    logToConsole(`Network error: ${error.message}`, 'error');
    console.error('Execution error:', error);
  } finally {
    // Re-enable run button
    runBtn.disabled = false;
    runBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>Run Code';
  }
}

// Handle language change
function handleLanguageChange() {
  const language = document.getElementById('languageSelect').value;

  // Update Monaco editor language
  const monacoLanguage = language === 'cpp' ? 'cpp' : language;
  monaco.editor.setModelLanguage(editor.getModel(), monacoLanguage);

  // Broadcast language change to other users
  if (socket && socket.connected && currentRoomId) {
    socket.emit('language-change', {
      roomId: currentRoomId,
      language: language
    });
  }

  logToConsole(`Language changed to ${language}`, 'info');
}

// Copy room ID to clipboard
function copyRoomId() {
  if (!currentRoomId) return;

  navigator.clipboard.writeText(currentRoomId).then(() => {
    logToConsole('Room ID copied to clipboard', 'success');
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded');

  // Initialize editor
  initializeEditor();

  // Initialize Socket.io
  initializeSocket();

  // Join room button
  document.getElementById('joinRoomBtn').addEventListener('click', () => {
    const username = document.getElementById('usernameInput').value.trim();
    const roomId = document.getElementById('roomIdInput').value.trim();

    if (!username) {
      alert('Please enter your name');
      return;
    }

    if (!editor) {
      alert('Editor is still loading. Please wait...');
      return;
    }

    joinRoom(roomId, username);
  });

  // Allow Enter key to join room
  document.getElementById('roomIdInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('joinRoomBtn').click();
    }
  });

  document.getElementById('usernameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('joinRoomBtn').click();
    }
  });

  // Run code button
  document.getElementById('runBtn').addEventListener('click', executeCode);

  // Language selector
  document.getElementById('languageSelect').addEventListener('change', handleLanguageChange);

  // Copy room ID button
  document.getElementById('copyRoomBtn').addEventListener('click', copyRoomId);

  // Clear console button
  document.getElementById('clearConsoleBtn').addEventListener('click', clearConsole);

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to run code
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeCode();
    }
  });

  // Focus username input
  setTimeout(() => {
    document.getElementById('usernameInput').focus();
  }, 500);
});

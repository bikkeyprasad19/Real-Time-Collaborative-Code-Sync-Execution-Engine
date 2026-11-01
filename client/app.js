// Global state
let socket;
let editor;
let currentRoomId = null;
let currentUsername = null;
let isRemoteChange = false;
let isEditorReady = false;
let isSocketReady = false;

// Language templates
const LANGUAGE_TEMPLATES = {
  python: '# Write your Python code here\nprint("Hello, World!")',
  javascript: '// Write your JavaScript code here\nconsole.log("Hello, World!");',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}'
};

// Initialize Monaco Editor
function initializeEditor() {
  require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });

  // Timeout if Monaco doesn't load in 10 seconds
  const timeout = setTimeout(() => {
    if (!isEditorReady) {
      console.error('❌ Monaco Editor failed to load (timeout)');
      logToConsole('Error: Code editor failed to load. Check your internet connection or try refreshing.', 'error');
      document.getElementById('joinRoomBtn').textContent = 'Editor Load Failed';
    }
  }, 10000);

  require(['vs/editor/editor.main'], function () {
    clearTimeout(timeout);

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
      if (!isRemoteChange && socket && currentRoomId) {
        const code = editor.getValue();
        socket.emit('code-change', {
          roomId: currentRoomId,
          code: code
        });
      }
    });

    console.log('✅ Monaco Editor initialized');
    isEditorReady = true;
    checkIfReady();
  }, function(err) {
    // Error callback
    clearTimeout(timeout);
    console.error('❌ Monaco Editor loading error:', err);
    logToConsole('Error: Code editor failed to load: ' + err, 'error');
    document.getElementById('joinRoomBtn').textContent = 'Editor Load Failed';
  });
}

// Check if everything is ready
function checkIfReady() {
  if (isEditorReady && isSocketReady) {
    console.log('✅ Application ready');
    document.getElementById('joinRoomBtn').disabled = false;
    document.getElementById('joinRoomBtn').textContent = 'Join Room';
  }
}

// Initialize Socket.io connection
function initializeSocket() {
  // Check if Socket.io is loaded
  if (typeof io === 'undefined') {
    console.error('❌ Socket.io not loaded');
    logToConsole('Error: Socket.io library failed to load. Please refresh the page.', 'error');
    document.getElementById('joinRoomBtn').textContent = 'Socket.io Failed';
    return;
  }

  socket = io(window.location.origin);

  // Timeout if Socket doesn't connect in 5 seconds
  const timeout = setTimeout(() => {
    if (!isSocketReady) {
      console.error('❌ Socket.io connection timeout');
      logToConsole('Error: Could not connect to server. Make sure the server is running.', 'error');
      document.getElementById('joinRoomBtn').textContent = 'Connection Failed';
    }
  }, 5000);

  socket.on('connect', () => {
    clearTimeout(timeout);
    console.log('✅ Connected to server');
    logToConsole('Connected to server', 'success');
    isSocketReady = true;
    checkIfReady();
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    logToConsole('Disconnected from server', 'error');
  });

  // Sync code when joining room
  socket.on('sync-code', ({ code, language }) => {
    isRemoteChange = true;
    editor.setValue(code);

    const languageSelect = document.getElementById('languageSelect');
    languageSelect.value = language;

    const monacoLanguage = language === 'cpp' ? 'cpp' : language;
    monaco.editor.setModelLanguage(editor.getModel(), monacoLanguage);

    isRemoteChange = false;
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

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    logToConsole('Connection error. Please check if the server is running.', 'error');
  });
}

// Join a room
function joinRoom(roomId, username) {
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
  if (socket && currentRoomId) {
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
  // Disable join button initially
  document.getElementById('joinRoomBtn').disabled = true;
  document.getElementById('joinRoomBtn').textContent = 'Loading...';

  initializeEditor();

  // Wait for Socket.io to be fully loaded - check multiple times if needed
  let socketCheckAttempts = 0;
  const maxAttempts = 50; // 5 seconds max

  const checkSocketIO = () => {
    socketCheckAttempts++;
    console.log(`Checking for Socket.io... (attempt ${socketCheckAttempts})`);

    if (typeof io !== 'undefined') {
      console.log('✅ Socket.io found, initializing connection...');
      initializeSocket();
    } else if (socketCheckAttempts < maxAttempts) {
      setTimeout(checkSocketIO, 100);
    } else {
      console.error('❌ Socket.io never loaded after 5 seconds');
      logToConsole('Error: Socket.io library failed to load. Please refresh the page.', 'error');
      document.getElementById('joinRoomBtn').textContent = 'Socket.io Failed';
    }
  };

  setTimeout(checkSocketIO, 100);

  // Show join modal
  setTimeout(() => {
    document.getElementById('usernameInput').focus();
  }, 100);

  // Join room button
  document.getElementById('joinRoomBtn').addEventListener('click', () => {
    console.log('Join Room button clicked');
    const username = document.getElementById('usernameInput').value.trim();
    const roomId = document.getElementById('roomIdInput').value.trim();

    console.log('Username:', username);
    console.log('Room ID:', roomId);
    console.log('Socket ready:', isSocketReady);
    console.log('Editor ready:', isEditorReady);

    if (!username) {
      alert('Please enter your name');
      return;
    }

    if (!isSocketReady || !isEditorReady) {
      alert('Application is still loading. Please wait a moment...');
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
});

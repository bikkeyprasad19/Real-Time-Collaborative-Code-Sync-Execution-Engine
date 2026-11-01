const Docker = require('dockerode');
const { v4: uuidv4 } = require('uuid');

const docker = new Docker();

// Language configurations
const LANGUAGE_CONFIGS = {
  python: {
    image: 'code-executor-python:latest',
    filename: 'main.py',
    timeout: 5000
  },
  javascript: {
    image: 'code-executor-node:latest',
    filename: 'main.js',
    timeout: 5000
  },
  cpp: {
    image: 'code-executor-cpp:latest',
    filename: 'main.cpp',
    timeout: 10000 // C++ needs more time for compilation
  }
};

// Resource limits
const RESOURCE_LIMITS = {
  Memory: 128 * 1024 * 1024, // 128MB
  NanoCpus: 500000000, // 0.5 CPU
  PidsLimit: 50
};

/**
 * Execute code in an isolated Docker container
 * @param {string} code - The code to execute
 * @param {string} language - The programming language (python, javascript, cpp)
 * @returns {Promise<Object>} - Execution result with stdout, stderr, and status
 */
async function executeCode(code, language) {
  const config = LANGUAGE_CONFIGS[language];

  if (!config) {
    return {
      success: false,
      error: `Unsupported language: ${language}. Supported languages: ${Object.keys(LANGUAGE_CONFIGS).join(', ')}`
    };
  }

  const containerId = `exec-${uuidv4()}`;
  let container = null;

  try {
    // Check if image exists
    try {
      await docker.getImage(config.image).inspect();
    } catch (error) {
      return {
        success: false,
        error: `Docker image '${config.image}' not found. Please run: npm run build-images`
      };
    }

    // Create container WITHOUT AutoRemove so we can get logs
    container = await docker.createContainer({
      Image: config.image,
      name: containerId,
      Cmd: [config.filename],
      Env: [`CODE=${Buffer.from(code).toString('base64')}`],
      HostConfig: {
        Memory: RESOURCE_LIMITS.Memory,
        NanoCpus: RESOURCE_LIMITS.NanoCpus,
        PidsLimit: RESOURCE_LIMITS.PidsLimit,
        NetworkMode: 'none', // Disable network access
        ReadonlyRootfs: false,
        AutoRemove: false // Disable auto-remove so we can get logs
      },
      AttachStdout: true,
      AttachStderr: true,
      Tty: false
    });

    // Start container with timeout
    await container.start();

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), config.timeout);
    });

    const executionPromise = new Promise(async (resolve, reject) => {
      try {
        // Wait for container to finish
        const result = await container.wait();

        // Get logs BEFORE removing container
        const logs = await container.logs({
          stdout: true,
          stderr: true,
          timestamps: false
        });

        const output = logs.toString('utf8');

        // Parse stdout and stderr
        const lines = output.split('\n');
        let stdout = '';
        let stderr = '';

        for (const line of lines) {
          if (line.startsWith('\u0001')) {
            // stdout stream
            stdout += line.substring(8) + '\n';
          } else if (line.startsWith('\u0002')) {
            // stderr stream
            stderr += line.substring(8) + '\n';
          } else if (line.trim()) {
            stdout += line + '\n';
          }
        }

        // Now remove the container manually
        try {
          await container.remove({ force: true });
        } catch (e) {
          console.log('Warning: Could not remove container:', e.message);
        }

        resolve({
          success: result.StatusCode === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: result.StatusCode
        });
      } catch (error) {
        reject(error);
      }
    });

    const result = await Promise.race([executionPromise, timeoutPromise]);

    return result;

  } catch (error) {
    // Clean up container if it exists
    if (container) {
      try {
        await container.remove({ force: true });
      } catch (e) {
        // Container might already be gone
      }
    }

    if (error.message === 'Execution timeout') {
      return {
        success: false,
        error: `Execution timed out after ${config.timeout / 1000} seconds`,
        stdout: '',
        stderr: 'Time limit exceeded'
      };
    }

    return {
      success: false,
      error: error.message,
      stdout: '',
      stderr: error.stack || error.message
    };
  }
}

module.exports = {
  executeCode
};

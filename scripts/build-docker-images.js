const { spawn } = require('child_process');
const path = require('path');

const images = [
  { name: 'code-executor-python', dir: 'docker/python' },
  { name: 'code-executor-node', dir: 'docker/node' },
  { name: 'code-executor-cpp', dir: 'docker/cpp' }
];

function buildImage(imageName, dockerDir) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔨 Building ${imageName}...`);

    const dockerPath = path.join(__dirname, '..', dockerDir);
    const args = ['build', '-t', imageName, dockerPath];

    const proc = spawn('docker', args, {
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${imageName} built successfully`);
        resolve();
      } else {
        reject(new Error(`Failed to build ${imageName}`));
      }
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

async function buildAll() {
  console.log('🐳 Building Docker images for code execution...\n');

  for (const image of images) {
    try {
      await buildImage(image.name, image.dir);
    } catch (error) {
      console.error(`❌ Error building ${image.name}:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n✨ All Docker images built successfully!\n');
}

buildAll();

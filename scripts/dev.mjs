import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = resolve(rootDir, 'frontend');
const apiProject = resolve(rootDir, 'backend', 'TrackMyCV.Api', 'TrackMyCV.Api.csproj');
const isWindows = process.platform === 'win32';
const args = new Set(process.argv.slice(2));

const apiUrl = process.env.VITE_API_URL || 'http://localhost:5228';
const frontendHost = process.env.VITE_HOST || '127.0.0.1';
const frontendPort = process.env.VITE_PORT || '5173';
const frontendUrl = `http://${frontendHost}:${frontendPort}`;

const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const dockerCommand = isWindows ? 'docker.exe' : 'docker';

const children = new Set();
let shuttingDown = false;

function prefixOutput(name, stream, chunk) {
  const lines = String(chunk).split(/\r?\n/);

  for (const line of lines) {
    if (line.trim().length > 0) {
      stream.write(`[${name}] ${line}\n`);
    }
  }
}

function runOnce(name, command, commandArgs, options = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, commandArgs, {
      cwd: rootDir,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    child.stdout.on('data', (chunk) => prefixOutput(name, process.stdout, chunk));
    child.stderr.on('data', (chunk) => prefixOutput(name, process.stderr, chunk));
    child.on('error', (error) => {
      if (options.optional) {
        console.warn(`[${name}] ${error.message}`);
        resolveRun(false);
        return;
      }

      rejectRun(error);
    });
    child.on('exit', (code) => {
      if (code === 0 || options.optional) {
        resolveRun(code === 0);
        return;
      }

      rejectRun(new Error(`${name} exited with code ${code}`));
    });
  });
}

function spawnLongRunning(name, command, commandArgs, options) {
  const child = spawn(command, commandArgs, {
    cwd: options.cwd,
    env: options.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });

  children.add(child);
  child.stdout.on('data', (chunk) => prefixOutput(name, process.stdout, chunk));
  child.stderr.on('data', (chunk) => prefixOutput(name, process.stderr, chunk));
  child.on('error', (error) => {
    console.error(`[${name}] ${error.message}`);
    shutdown(1);
  });
  child.on('exit', (code) => {
    children.delete(child);

    if (!shuttingDown) {
      console.log(`[${name}] process exited with code ${code}`);
      shutdown(code || 1);
    }
  });

  return child;
}

function killProcessTree(child) {
  if (!child.pid || child.killed) {
    return;
  }

  if (isWindows) {
    spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], {
      stdio: 'ignore',
      windowsHide: true
    });
    return;
  }

  child.kill('SIGTERM');
}

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log('\nStopping TrackMyCV dev processes...');

  for (const child of children) {
    killProcessTree(child);
  }

  setTimeout(() => process.exit(code), 500);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

if (args.has('--help') || args.has('-h')) {
  console.log('Usage: npm run dev [-- --skip-db]');
  console.log('');
  console.log('Starts SQL Server from docker-compose, ASP.NET Core API, and Vite frontend.');
  console.log('Use --skip-db if SQL Server is already running or Docker is not available.');
  process.exit(0);
}

if (!args.has('--skip-db')) {
  console.log('Starting SQL Server container from docker-compose...');
  const databaseStarted = await runOnce('db', dockerCommand, ['compose', 'up', '-d', 'sqlserver'], { optional: true });

  if (!databaseStarted) {
    console.warn('[db] Could not start Docker SQL Server automatically. Continuing anyway.');
  }
}

console.log('');
console.log('Starting TrackMyCV development stack...');
console.log(`API:      ${apiUrl}`);
console.log(`Frontend: ${frontendUrl}`);
console.log('Press Ctrl+C to stop everything.');
console.log('');

spawnLongRunning('api', 'dotnet', ['run', '--project', apiProject, '--launch-profile', 'http'], {
  cwd: rootDir,
  env: {
    ...process.env,
    ASPNETCORE_ENVIRONMENT: 'Development'
  }
});

spawnLongRunning('web', npmCommand, ['run', 'dev', '--', '--host', frontendHost, '--port', frontendPort], {
  cwd: frontendDir,
  env: {
    ...process.env,
    VITE_API_URL: apiUrl
  }
});

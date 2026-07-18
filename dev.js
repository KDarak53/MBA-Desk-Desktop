const { execSync, spawn } = require('child_process');
const { createServer } = require('vite');
const path = require('path');

async function main() {
  // 1. Start Vite dev server
  const vite = await createServer({
    configFile: path.resolve(__dirname, 'vite.config.ts'),
    server: { port: 5173, strictPort: true },
  });
  await vite.listen();
  console.log('[dev] Vite ready at http://localhost:5173');

  // 2. Compile Electron TypeScript
  console.log('[dev] Compiling electron/...');
  execSync('npx tsc -p tsconfig.electron.json', { stdio: 'inherit' });
  console.log('[dev] Electron compiled');

  // 3. Launch Electron
  process.env.NODE_ENV = 'development';
  const electron = require('electron');
  const proc = spawn(String(electron), ['.'], {
    stdio: 'inherit',
    env: { ...process.env },
  });

  proc.on('close', () => {
    vite.close();
    process.exit(0);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });

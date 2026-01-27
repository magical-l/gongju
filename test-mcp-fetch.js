const { spawn } = require('child_process');

const child = spawn('npx', ['@tokenizin/mcp-npx-fetch', '--help'], {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  console.log(`子进程退出，退出码 ${code}`);
});
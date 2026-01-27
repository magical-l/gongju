const { spawn } = require('child_process');

// 尝试运行mcp-npx-fetch并设置超时
const child = spawn('npx', ['mcp-npx-fetch', '--help'], {
  stdio: 'pipe',
  shell: true
});

let output = '';
let errorOutput = '';

child.stdout.on('data', (data) => {
  output += data.toString();
  console.log('stdout:', data.toString());
});

child.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.log('stderr:', data.toString());
});

child.on('close', (code) => {
  console.log(`子进程退出，退出码: ${code}`);
  console.log('输出:', output);
  console.log('错误输出:', errorOutput);
});

// 设置超时，5秒后杀死进程
setTimeout(() => {
  console.log('超时，杀死进程');
  child.kill();
}, 5000);
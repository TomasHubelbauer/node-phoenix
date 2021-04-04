import { exit } from './index.js';

const handle = global.setInterval(() => {
  console.log(process.pid, 'counted');
}, 1000);

// Stop the timer of this process once the child process takes over operations
exit.then(() => global.clearInterval(handle));

import fs from 'fs';
import child_process from 'child_process';

let quit;
export let exit = new Promise(resolve => quit = resolve);

/** @type {child_process.ChildProcess | undefined} */
let childProcess;

// Report being killed to demonstrate that only one child process ever exists
process.addListener('exit', () => console.log(process.pid, 'killed'));

// Allow this process' operations to start running once `exit` is initialized
// Do this asynchronously so that `exit` is initialized by the time they run
await import('./server.js');
await import('./timer.js');

// Do not watch for changes if this is a spawned child process not the initial
if (process.argv0 === 'node-phoenix') {
  console.log(process.pid, 'started (child)');
  return;
}

// Note that at this point the server and timer features of the app are running
console.log(process.pid, 'started (parent)');

// Watch for changes upon which set the process to passive and spawn a child
// Leave `persistent` as default `true` to keep the process alive to watch
// Set `recursive` to `true` to watch the whole subtree of this directory
fs.watch('.', { recursive: true }, (change, path) => {
  console.log(process.pid, 'noticed', change, 'of', path);

  // Use the same standard I/O streams to propagate the I/O of the child here
  const stdio = 'inherit';

  // Signal to the child process that it is a child process of this initial
  const argv0 = 'node-phoenix';

  // Resolve the exit promise to let this process' works to stop themselves
  if (childProcess === undefined) {
    quit();
  }
  // Kill the current child process as it will be replaced by a new one
  else {
    childProcess.kill();
  }

  // Spawn the configured replacement process to take over the operations
  // Note that the main process dying will kill all the spawned processes
  // Debug the spawned processes using the `ps | grep node` command
  childProcess = child_process.spawn('node', ['.'], { stdio, argv0 });
  console.log(process.pid, 'spawned', childProcess.pid);
});

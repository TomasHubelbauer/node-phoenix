import http from 'http';
import { exit } from './index.js';

const server = http
  .createServer((request, response) => {
    response.end(`${process.pid} served`);
  })
  .listen(1337)
  ;

exit.then(() => server.close());

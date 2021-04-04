# Node Phoenix

This repository demonstrates a Node program which is capable of "restarting"
itself when it detects a change to its source code. Sounds familiar? Yeah, there
are projects such as [Nodemon] and process managers such as [Forever] and [PM2]
which achieve the same thing already.

[Nodemon]: https://nodemon.io
[Forever]: https://github.com/foreversd/forever
[PM2]: https://pm2.keymetrics.io

The way these alternatives work is that an overseeing process takes care of
starting and restarting the Node process of the actual program. This is a fine
approach.

## Purpose

I was curious about achieving the same result without the help of a wrapper
process. This repository is a result of exploration of that curiosity.

## Operation

What I've come up with works like this: The program starts off as usual, for
example using the `node .` command in the terminal. It is assigned I/O streams
that read from and write to the terminal. This sample program I've written also
starts an HTTP server and runs some work on an interval for demonstration
purposes.

Once a change to the program's source files occurs, the program stops the tasks
like the server and the timer, it enters a sort of a passive mode, where it no
longer carries out its original purpose and instead it spawns a child process
which is the exact same program, but this process will load the new source code
so its functionality will reflect the latest source code.

To preserve the terminal standard I/O streams, the child process will inherit
them so the terminal experience will remain unchanged, as if the user were still
interacting with the original program.

The HTTP server and the interval timer now run in the child process and not in
the original process.

When another change happens, the original program replaces the current child
process with a new child process. This ensures the latest source code is yet
again reflected in the currently running program. The old child processes do not
linger around because the original program kills them each time it replaces them
with the new child process.

This can continue indefinitely and at any moment, there are at most 2 processes:
the original program process and the current child process, if any.

## Benefits

I could not think of any benefits this approach would have over process managers
except for satisfying my curiosity about whether it would work or not.

## Drawback

There are several drawbacks to this approach:

- The programmer needs to make sure all ongoing operations in the program listen
  to the program "quitting" at the first change. If they do not cease any of the
  operations, it will run in parallel in the original process and the child
  process. This can result in data corruption, crashes due to non-exclusive
  access to exclusive resources (such as sockets) etc.
- A crash of the original program brings the whole show to a halt. This one is
  arguable, it could be seen as a benefit ("fail fast, fail loud"), but is not
  practical and process managers have an opportunity to observe the crash and
  report it, restarting the process and having the benefit of both insight into
  the crashes and reliable, continuous operation.
- A crash of the child process does not result into a new child process being
  started. This is just something I have not developed yet, it's not a hard
  limitation unlike the other points in this list.

## To-Do

### Monitor child process crash and restart child process upon one

This is something feasible which would improve the realiability of this approach
(requiring "only" the original program to never crash), but I have not developed
the functionality yet.

### Start off with a child process from the get-go

This is not necessarily something I want to do, but it is something to be aware
of. Maybe I should add this to its own readme section. If the program were to
spawn a child process from the get-go and had the feature of detecting child
process crashes and restarting the child processes, it would greatly improve
both the usability and realiability of this approach. No longer would the user
need to make sure to kill their ongoing operations on the occurence of the first
change (the child process where these ongoing operations would run would just be
killed) and since the scope of the entry process would be limited only to the
child process management, the risk of the overseer process crashing would be
diminished. However, implementing this would essentially equal implementing a
process manager, turning this approach to the alternative it contrasts itself
with. I have already implemented something like this in [node-forever], too.

[node-forever]: https://github.com/TomasHubelbauer/node-forever

### Combine this proof of concept with `node-forever` into another PoC

[node-forever] ensures the program stays alive in the event of its associated
terminal closing and also that a newly started instance of the program takes
over the detached background instance so that the user can jump in and out of
development in the terminal but still has the program running in its latest
form.

[node-forever]: https://github.com/TomasHubelbauer/node-forever

This program ensures that the running version of the program always reflects
the latest source code.

Combining the two proof of concept projects could yield a library which when
used would give one's project the ability to run indefinitely, self-restart on
code changes and always keep being the version opened through the terminal, if
any, otherwise run detached in the background.

It could be a pretty sweet approach to local development, not requiring any tool
like Nodemon, just using a library.

```js
import immortal from 'https://…';

void async function() {
  // Make this process have the following properties:
  // - Detaches upon terminal closure without exitting for continuous operation,
  //   be it in the background or in the foreground
  // - Gets replaced by a new instance ran from the terminal when jumping in and
  //   out of development transparently, no extra steps by the user required
  // - Restarts itself on source code changes automatically making it so that
  //   the programmer never needs to restart themselves
  // - Makes it so that having the terminal open is entirely optional, reserved
  //   to when you want to see the program output, but otherwise not needed for
  //   the programs continuous operation off the latest source code
  if (await immortal()) {
    return;
  }

  // Do the program work here as usual
}()
```

# SRRX

**SRRX** is a lightweight, modern, and fully TypeScript-based library that wraps the official Microsoft SignalR JavaScript client and exposes all operations as **RxJS Observables**.
It converts SignalR’s Promise-based and callback-based API into a reactive, composable model.

## Installation

```bash
npm install srrx
```

## Usage

```ts
import { SRRX } from "srrx";

const hub = new SRRX({
  url: "/hub",
  autoReconnect: true,
});

// Start the connection
hub.start().subscribe(() => {
  console.log("Connected!");
});

// Listen for a server event
hub.on<string>("chat").subscribe(data => {
  console.log("message: ", data);
});

// Call a server method
hub.invoke<number>("join", "username")
  .subscribe(result => {
    console.log("Result:", result);
  });

// Pipe
hub
  .start()
  .pipe(
    concatMap(() => 
      hub.once<string>("notification")
    ),
    concatMap(data => 
      hub.stop()
        .pipe(
          map(() => data)
        )
    )
  )
  .subscribe(data => {
    console.log("Started, Notification, Stopped and Data:", data)
  })
```
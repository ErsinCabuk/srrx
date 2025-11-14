import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { Observable } from "rxjs";

export class SRRX {
  private readonly hubConnection: HubConnection

  constructor(options: SSRXOptions) {
    const hubConnectionBuilder = new HubConnectionBuilder()
      .withUrl(options.url)
      .configureLogging(options.logLevel ?? LogLevel.Information)

    if (options.autoReconnect) {
      hubConnectionBuilder.withAutomaticReconnect()
    }

    this.hubConnection = hubConnectionBuilder.build()
  }

  invoke<T>(methodName: string, ...args: any[]): Observable<T> {
    return promiseToObservable(
      this.hubConnection.invoke<T>(methodName, ...args)
    )
  }

  off(methodName: string): void {
    this.hubConnection.off(methodName)
  }

  on<T>(methodName: string): Observable<T> {
    return new Observable<T>(subscriber => {
      this.hubConnection.on(methodName, (argument: T) => {
        subscriber.next(argument)
      })

      return () => {
        this.hubConnection.off(methodName)
      }
    })
  }

  once<T>(methodName: string): Observable<T> {
    return new Observable<T>(subscriber => {
      this.hubConnection.on(methodName, (argument: T) => {
        subscriber.next(argument)
        subscriber.complete()
      })

      return () => {
        this.hubConnection.off(methodName)
      }
    })
  }

  send(methodName: string, ...args: any[]): Observable<void> {
    return promiseToObservable(
      this.hubConnection.send(methodName, ...args)
    )
  }

  start(): Observable<void> {
    return promiseToObservable(
      this.hubConnection.start()
    )
  }

  stop(): Observable<void> {
    return promiseToObservable(
      this.hubConnection.stop()
    )
  }

  stream<T>(methodName: string, ...args: any[]): Observable<T> {
    return new Observable<T>(subscriber => {
      const stream = this.hubConnection.stream<T>(methodName, ...args);

      const subscription = stream.subscribe({
        next: item => subscriber.next(item),
        error: error => subscriber.error(error),
        complete: () => subscriber.complete(),
      });

      return () => {
        subscription.dispose()
      }
    });
  }

  onClose(): Observable<Error | undefined> {
    return new Observable<Error | undefined>(subscriber => {
      this.hubConnection.onclose(error => {
        subscriber.next(error)
      })
    })
  }

  onReconnecting(): Observable<Error | undefined> {
    return new Observable<Error | undefined>(subscriber => {
      this.hubConnection.onreconnecting(error => {
        subscriber.next(error)
      })
    })
  }

  onReconnected(): Observable<string | undefined> {
    return new Observable<string | undefined>(subscriber => {
      this.hubConnection.onreconnected(connectionId => {
        subscriber.next(connectionId)
      })
    })
  }
}

export interface SSRXOptions {
  url: string
  logLevel?: LogLevel
  autoReconnect?: boolean
}

export function promiseToObservable<T>(promise: Promise<T>): Observable<T> {
  return new Observable<T>(subscriber => {
    promise
      .then(result => {
        subscriber.next(result)
      })
      .catch(error => {
        subscriber.error(error)
      })
      .finally(() => {
        subscriber.complete()
      })
  })
}

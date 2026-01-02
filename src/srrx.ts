import {
	type HubConnection,
	HubConnectionBuilder,
	HubConnectionState,
} from "@microsoft/signalr";
import { BehaviorSubject, finalize, from, Observable, tap } from "rxjs";
import type { SrrxConfig } from "./type";

class Srrx {
	private readonly hubConnection: HubConnection;
	private readonly state$ = new BehaviorSubject<HubConnectionState>(
		HubConnectionState.Disconnected,
	);

	constructor(private readonly config: SrrxConfig) {
		this.hubConnection = this.build();
		this.registerLifecycleEvents(); 
	}

	get state(): Observable<HubConnectionState> {
		return this.state$.asObservable();
	}

	start(): Observable<void> {
		this.state$.next(HubConnectionState.Connecting);
		return from(this.hubConnection.start()).pipe(
			tap(() => {
				this.state$.next(HubConnectionState.Connected);
			}),
			finalize(() => {
				if (this.hubConnection.state === HubConnectionState.Connected) return;
				this.state$.next(HubConnectionState.Disconnected);
			}),
		);
	}

	stop(): Observable<void> {
		return from(this.hubConnection.stop());
	}

	on<T>(methodName: string): Observable<T> {
		return new Observable<T>((subscriber) => {
			const handler = (data: T) => subscriber.next(data);

			try {
				this.hubConnection.on(methodName, handler);
			} catch (error) {
				subscriber.error(error);
			}

			return () => {
				this.hubConnection.off(methodName, handler);
			};
		});
	}

	send(methodName: string, ...args: unknown[]): Observable<void> {
		return from(this.hubConnection.send(methodName, ...args));
	}

	invoke<T>(methodName: string, ...args: unknown[]): Observable<T> {
		return from(this.hubConnection.invoke(methodName, ...args));
	}

	stream<T>(methodName: string, ...args: unknown[]): Observable<T> {
		return new Observable<T>((subscriber) => {
			const stream = this.hubConnection.stream<T>(methodName, ...args);

			const subscription = stream.subscribe({
				next: (value) => subscriber.next(value),
				error: (err) => subscriber.error(err),
				complete: () => subscriber.complete(),
			});

			return () => {
				subscription.dispose();
			};
		});
	}

	private build(): HubConnection {
		let builder = new HubConnectionBuilder().withUrl(
			this.config.url,
			this.config.connection ?? {},
		);

		if (this.config.autoReconnect) {
			const policy =
				typeof this.config.autoReconnect === "boolean"
					? undefined
					: this.config.autoReconnect;

			builder = policy
				? builder.withAutomaticReconnect(policy)
				: builder.withAutomaticReconnect();
		}

		return builder.build();
	}

	private registerLifecycleEvents() {
		this.hubConnection.onreconnecting(() =>
			this.state$.next(HubConnectionState.Reconnecting),
		);
		this.hubConnection.onreconnected(() =>
			this.state$.next(HubConnectionState.Connected),
		);
		this.hubConnection.onclose(() =>
			this.state$.next(HubConnectionState.Disconnected),
		);
	}
}

export { Srrx };

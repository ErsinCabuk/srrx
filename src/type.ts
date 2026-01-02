import type { IHttpConnectionOptions } from "@microsoft/signalr";

interface SrrxConfig {
	url: string;
	autoReconnect?: boolean | number[];
	connection?: IHttpConnectionOptions;
}

export type { SrrxConfig };

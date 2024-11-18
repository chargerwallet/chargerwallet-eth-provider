import type { CrossEventEmitter } from '@chargerwallet/cross-inpage-provider-core';
export type ConsoleLike = Pick<Console, 'log' | 'warn' | 'error' | 'debug' | 'info' | 'trace'>;
/**
 * Logs a stream disconnection error. Emits an 'error' if given an
 * EventEmitter that has listeners for the 'error' event.
 *
 * @param log - The logging API to use.
 * @param remoteLabel - The label of the disconnected stream.
 * @param error - The associated error to log.
 * @param emitter - The logging API to use.
 */
export declare function logStreamDisconnectWarning(log: ConsoleLike, remoteLabel: string, error: Error, emitter: CrossEventEmitter): void;
export declare const NOOP: () => undefined;
export declare const EMITTED_NOTIFICATIONS: string[];

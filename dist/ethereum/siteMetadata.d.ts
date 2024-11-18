import { JsBridgeBase } from '@chargerwallet/cross-inpage-provider-core';
import { ConsoleLike } from './utils';
/**
 * Sends site metadata over an RPC request.
 *
 * @param engine - The JSON RPC Engine to send metadata over.
 * @param log - The logging API to use.
 */
export default function sendSiteMetadata(engine: JsBridgeBase, log: ConsoleLike): Promise<void>;

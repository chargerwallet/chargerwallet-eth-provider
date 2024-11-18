"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEIP6963Provider = void 0;
const uuid_1 = require("uuid");
function registerEIP6963Provider({ uuid = (0, uuid_1.v4)(), name = 'ChargerWallet', rdns = 'com.chargerwallet.app.wallet', image, provider, }) {
    // EIP-6963: https://eips.ethereum.org/EIPS/eip-6963
    const info = {
        uuid,
        name,
        icon: image,
        rdns,
    };
    function announceProvider() {
        window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
            detail: Object.freeze({ info, provider: provider }),
        }));
    }
    window.addEventListener('eip6963:requestProvider', announceProvider);
    announceProvider();
}
exports.registerEIP6963Provider = registerEIP6963Provider;

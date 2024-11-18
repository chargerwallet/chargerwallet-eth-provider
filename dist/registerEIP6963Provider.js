import { v4 as uuidV4 } from 'uuid';
export function registerEIP6963Provider({ uuid = uuidV4(), name = 'ChargerWallet', rdns = 'com.chargerwallet.app.wallet', image, provider, }) {
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

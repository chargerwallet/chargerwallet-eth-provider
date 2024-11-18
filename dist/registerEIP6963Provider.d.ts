import type { ProviderEthereum } from './ProviderEthereum';
export declare function registerEIP6963Provider({ uuid, name, rdns, image, provider, }: {
    uuid?: string;
    name?: string;
    rdns?: string;
    image: string;
    provider: ProviderEthereum;
}): void;

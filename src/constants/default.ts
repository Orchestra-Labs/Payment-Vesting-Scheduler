import { Asset } from '@/sections';

export const rpcUrl = 'https://symphony-api.kleomedes.network';
export const defaultChainName = 'symphonytestnet';
export const walletPrefix = 'symphony1';
export const IBCPrefix = 'ibc/';
export const lesserExponentDefault = 0;
export const greaterExponentDefault = 6;
export const chainEndpoint = {
  symphonytestnet: {
    rpc: [' https://symphony-rpc.kleomedes.network'],
    rest: ['https://symphony-api.kleomedes.network'],
  },
};

export const vestingOrchestratorContractAddress =
  'symphony15nczwuqh0zcu6syeqsc4td6dphql7n2p7cgkl9raz97z5s3zdjrs95zpkl';
export const vestingContractCodeId = 14;

type AssetRegistry = {
  [key: string]: Asset;
};

export const localAssetRegistry: AssetRegistry = {
  uusd: {
    denom: 'uusd',
    amount: '10',
    isIbc: false,
    logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/symphonytestnet/images/husd.png',
    symbol: 'HUSD',
    exponent: 6,
  },
  uhkd: {
    denom: 'uhkd',
    amount: '1.282',
    isIbc: false,
    logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/symphonytestnet/images/hhkd.png',
    symbol: 'HHKD',
    exponent: 6,
  },
  note: {
    denom: 'note',
    amount: '1',
    isIbc: false,
    logo: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/symphonytestnet/images/mld.png',
    symbol: 'MLD',
    exponent: 6,
  },
};

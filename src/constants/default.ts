import { Asset } from '@/sections';

export const rpcUrl = 'https://symphony-rpc.cogwheel.zone/';
export const defaultChainName = 'symphony';
export const walletPrefix = 'symphony';
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
  'symphony1wug8sewp6cedgkmrmvhl3lf3tulagm9hnvy8p0rppz9yjw0g4wtqxy47yl';
export const vestingContractCodeId = 1;

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

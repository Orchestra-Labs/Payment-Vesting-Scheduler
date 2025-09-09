import { bech32 } from 'bech32';

export const isValidBech32Address = (
  address: string,
  expectedPrefix: string = 'symphony',
): boolean => {
  try {
    const decoded = bech32.decode(address);
    return decoded.prefix === expectedPrefix;
  } catch (error) {
    return false;
  }
};

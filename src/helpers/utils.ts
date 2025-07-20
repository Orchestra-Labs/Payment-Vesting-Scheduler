import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { walletPrefix } from '@/constants';

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs, { strict: false }));
};

export const stripNonNumerics = (value: string) => {
  return value.replace(/[^\d.]/g, '');
};

// Format the number with commas
export const formatNumberWithCommas = (value: string | number): string => {
  const stringValue = String(value);
  const [integerPart, decimalPart] = stringValue.split('.') || ['', ''];
  const formattedIntegerPart = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ',',
  );
  const formattedNumber =
    decimalPart !== undefined
      ? `${formattedIntegerPart}.${decimalPart}`
      : formattedIntegerPart;

  return formattedNumber;
};

export const getRegexForDecimals = (exponent: number) => {
  return new RegExp(`^\\d*\\.?\\d{0,${exponent}}$`);
};

export const hashToHumanReadable = (hashString: string) => {
  const prefix = hashString.startsWith(walletPrefix) ? walletPrefix : '';
  const remainingHash = prefix ? hashString.slice(prefix.length) : hashString;

  const first4 = remainingHash.slice(0, 4);
  const last4 = remainingHash.slice(-4);

  return `${prefix}${first4}...${last4}`;
};

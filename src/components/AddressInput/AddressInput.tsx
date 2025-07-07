import { Input } from '@/ui-kit';
import { useState, useCallback } from 'react';
import { bech32 } from 'bech32';
import clsx from 'clsx';
import { InputStatus } from '@/constants';

interface AddressInputProps {
  value: string;
  onChange: (value: string, status: InputStatus, message: string) => void;
  requiredPrefix?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChange,
  requiredPrefix = 'symphony',
  className = '',
  placeholder = '',
  disabled = false,
}) => {
  const [allowValidation, setAllowValidation] = useState(false);
  const validAddressLength = 47; // Typical Bech32 address length

  const validateAddress = useCallback(
    (address: string) => {
      if (address === '') {
        onChange(address, InputStatus.NEUTRAL, '');
        return false;
      }

      const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(address);
      if (!isAlphanumeric) {
        onChange(
          address,
          InputStatus.ERROR,
          'Address contains invalid characters',
        );
        return false;
      }

      try {
        if (requiredPrefix && !address.startsWith(requiredPrefix)) {
          onChange(
            address,
            InputStatus.ERROR,
            `Address must start with "${requiredPrefix}"`,
          );
          return false;
        }

        const decoded = bech32.decode(address);
        if (!decoded.prefix || decoded.words.length === 0) {
          onChange(address, InputStatus.ERROR, 'Invalid address format');
          return false;
        }

        onChange(address, InputStatus.SUCCESS, '');
        return true;
      } catch {
        onChange(address, InputStatus.ERROR, 'Invalid Bech32 encoding');
        return false;
      }
    },
    [onChange, requiredPrefix],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.trim();

    // Enable validation when address reaches valid length
    if (newValue.length >= validAddressLength && !allowValidation) {
      setAllowValidation(true);
    }

    // Validate if enabled, otherwise just pass the value with neutral status
    if (allowValidation) {
      validateAddress(newValue);
    } else {
      onChange(newValue, InputStatus.NEUTRAL, '');
    }
  };

  const handleBlur = () => {
    if (value.length > 0) {
      setAllowValidation(true);
      validateAddress(value);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedValue = e.clipboardData.getData('text').trim();
    setAllowValidation(true);
    validateAddress(pastedValue);
  };

  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      onPaste={handlePaste}
      placeholder={placeholder}
      disabled={disabled}
      className={clsx(
        'pl-2 py-1.5 text-sm bg-black text-white border border-gray-300',
        className,
      )}
    />
  );
};

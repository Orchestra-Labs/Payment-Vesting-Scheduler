import { Input } from '@/ui-kit';
import { cn, formatNumberWithCommas, stripNonNumerics } from '@/helpers';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

interface NumericInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  decimalPlaces?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  decimalPlaces = 0,
  min = 0,
  max,
  placeholder = '',
  className = '',
  disabled = false,
}) => {
  const [localInputValue, setLocalInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const prevValueRef = useRef<string>('');

  useEffect(() => {
    if (value !== null && !isNaN(value)) {
      const formattedNumber = formatNumberWithCommas(value);
      setLocalInputValue(formattedNumber);
    } else {
      setLocalInputValue('');
    }
  }, [value]);

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    const caretPosition = event.target.selectionStart || 0;

    // If input is empty, return null
    if (inputValue.trim() === '') {
      onChange(null);
      setLocalInputValue('');
      return;
    }

    // Remove commas and non-numeric characters
    const rawValue = stripNonNumerics(inputValue);

    // Split and truncate decimal places
    const [integerPart, decimalPart] = rawValue.split('.');
    let processedValue = rawValue;
    if (decimalPart && decimalPart.length > decimalPlaces) {
      processedValue = `${integerPart}.${decimalPart.slice(0, decimalPlaces)}`;
    }

    // Convert to number and apply constraints
    let numericValue = parseFloat(processedValue);
    if (isNaN(numericValue)) {
      onChange(null);
      setLocalInputValue('');
      return;
    }

    if (min !== undefined && numericValue < min) numericValue = min;
    if (max !== undefined && numericValue > max) numericValue = max;

    // Update parent component
    onChange(numericValue);

    // Format display value
    const formattedValue = formatNumberWithCommas(processedValue);
    setLocalInputValue(formattedValue);

    // Caret positioning logic
    const previousRawValue = stripNonNumerics(prevValueRef.current);
    setTimeout(() => {
      if (inputRef.current) {
        const characterWasAdded = rawValue.length > previousRawValue.length;
        let newCaretPosition = caretPosition;

        if (characterWasAdded && formattedValue.length - rawValue.length > 1) {
          newCaretPosition += 1;
        } else if (
          !characterWasAdded &&
          previousRawValue.length - rawValue.length > 1
        ) {
          newCaretPosition -= 1;
        }

        prevValueRef.current = processedValue;
        inputRef.current.setSelectionRange(newCaretPosition, newCaretPosition);
      }
    }, 0);
  };

  const handleBlur = () => {
    if (localInputValue.trim() === '') {
      onChange(null);
    } else {
      const numericValue = parseFloat(stripNonNumerics(localInputValue));
      if (!isNaN(numericValue)) {
        setLocalInputValue(formatNumberWithCommas(numericValue));
      }
    }
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={localInputValue}
      onChange={handleAmountChange}
      onBlur={handleBlur}
      disabled={disabled}
      className={cn(
        'pl-2 py-1.5 text-sm bg-black text-white border border-gray-300 placeholder-gray-400',
        className,
      )}
    />
  );
};

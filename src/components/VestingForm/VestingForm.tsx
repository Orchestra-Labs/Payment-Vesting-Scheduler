import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { Button } from '../Button';
import clsx from 'clsx';
import { NumericInput } from '../NumericInput/NumericInput';
import { AddressInput } from '../AddressInput';
import { InputStatus } from '@/constants';

const convertToSeconds = (years: number, months: number) => {
  return (years * 12 + months) * 30 * 24 * 60 * 60;
};

const DEFAULT_CLIFF = convertToSeconds(0, 6);
const DEFAULT_VESTING = convertToSeconds(0, 11);

export const VestingForm = () => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [cliffYears, setCliffYears] = useState<number | null>(null);
  const [cliffMonths, setCliffMonths] = useState<number | null>(null);
  const [vestingYears, setVestingYears] = useState<number | null>(null);
  const [vestingMonths, setVestingMonths] = useState<number | null>(null);
  const [output, setOutput] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [showJson, setShowJson] = useState(false);
  const [addressStatus, setAddressStatus] = useState<InputStatus>(
    InputStatus.NEUTRAL,
  );
  const [addressMessage, setAddressMessage] = useState('');
  const [showAddressMessage, setShowAddressMessage] = useState(false);

  const now = Math.floor(Date.now() / 1000);

  useEffect(() => {
    if (addressMessage) {
      setShowAddressMessage(true);
    } else {
      const timer = setTimeout(() => setShowAddressMessage(false), 300);
      return () => clearTimeout(timer);
    }
  }, [addressMessage]);

  const handleAddressChange = (
    value: string,
    status: InputStatus,
    message: string,
  ) => {
    setRecipient(value);
    setAddressStatus(status);
    setAddressMessage(message);
  };

  const handleSubmit = () => {
    const cliffY = cliffYears ?? 0;
    const cliffM = cliffMonths ?? 6;
    const vestingY = vestingYears ?? 0;
    const vestingM = vestingMonths ?? 11;

    const cliffOffset = convertToSeconds(cliffY, cliffM) || DEFAULT_CLIFF;
    const vestingOffset =
      convertToSeconds(vestingY, vestingM) || DEFAULT_VESTING;

    const entry = {
      recipient,
      entries: [
        {
          amount: amount ?? 0,
          denom: 'note',
          cliff: now + cliffOffset,
          vesting: now + vestingOffset,
        },
      ],
    };
    setOutput(JSON.stringify(entry, null, 2));
    setShowJson(true);
  };

  const handleJsonSubmit = () => {
    if (showJson) {
      setOutput('');
      setShowJson(false);
      return;
    }

    if (!jsonInput.trim()) {
      const defaultEntry = {
        recipient: '',
        entries: [
          {
            amount: 0,
            denom: 'note',
            cliff: now + DEFAULT_CLIFF,
            vesting: now + DEFAULT_VESTING,
          },
        ],
      };
      setOutput(JSON.stringify(defaultEntry, null, 2));
      setShowJson(true);
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      parsed.entries = parsed.entries.map((entry: any) => ({
        ...entry,
        cliff: entry.cliff ? parseInt(entry.cliff, 10) : now + DEFAULT_CLIFF,
        vesting: entry.vesting
          ? parseInt(entry.vesting, 10)
          : now + DEFAULT_VESTING,
      }));
      setOutput(JSON.stringify(parsed, null, 2));
      setShowJson(true);
    } catch {
      setOutput('Invalid JSON');
      setShowJson(true);
    }
  };

  return (
    <Card className="w-[425px] h-[500px] bg-black text-white overflow-hidden relative border border-gray-300">
      <CardHeader
        className={clsx(
          'transition-[padding-bottom] duration-500 ease-in-out',
          showJson ? 'pb-0' : 'pb-[1.5rem]',
        )}
      >
        <CardTitle>Payment Vesting Scheduler</CardTitle>
      </CardHeader>

      <div className="overflow-hidden">
        {showAddressMessage && (
          <p
            className={clsx(
              'text-xs px-4 transition-all duration-300 ease-in-out',
              addressMessage ? 'my-2 opacity-100' : 'my-0 h-0 opacity-0',
              addressStatus === InputStatus.ERROR
                ? 'text-error'
                : 'text-success',
            )}
          >
            {addressMessage}
          </p>
        )}
      </div>

      <CardContent className="h-full flex flex-col">
        <div
          className={clsx(
            'overflow-hidden transition-[max-height] duration-500 ease-in-out',
            showJson ? 'max-h-0' : 'max-h-[500px]',
          )}
        >
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <AddressInput
                value={recipient}
                onChange={handleAddressChange}
                requiredPrefix="symphony"
                placeholder="symphony1..."
                className="w-full"
              />
              <NumericInput
                placeholder="Amount (note)"
                value={amount}
                onChange={setAmount}
                decimalPlaces={6}
                min={0}
              />
            </div>

            <div className="space-y-1">
              <p className="text-md font-medium">Cliff:</p>
              <div className="grid grid-cols-2 gap-4">
                <NumericInput
                  placeholder="Months"
                  value={cliffMonths}
                  onChange={val =>
                    setCliffMonths(val !== null ? Math.min(val, 11) : null)
                  }
                  min={0}
                />
                <NumericInput
                  placeholder="Years"
                  value={cliffYears}
                  onChange={setCliffYears}
                  min={0}
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-md font-medium">Vesting:</p>
              <div className="grid grid-cols-2 gap-4">
                <NumericInput
                  placeholder="Months"
                  value={vestingMonths}
                  onChange={val =>
                    setVestingMonths(val !== null ? Math.min(val, 11) : null)
                  }
                  min={0}
                />
                <NumericInput
                  placeholder="Years"
                  value={vestingYears}
                  onChange={setVestingYears}
                  min={0}
                />
              </div>
            </div>

            <Button variant={'outline'} onClick={handleSubmit}>
              Generate Vesting JSON
            </Button>
            <textarea
              className="w-full h-32 bg-black p-2 rounded text-white border border-gray-300 placeholder-gray-400"
              placeholder="Paste JSON here to format/display"
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Button
            variant={'outline'}
            onClick={handleJsonSubmit}
            className="mt-2 px-4"
          >
            {showJson ? 'View Inputs' : 'Parse Submitted JSON'}
          </Button>
        </div>

        {output && showJson && (
          <div className="flex-1">
            <div className="h-[88%] overflow-y-auto my-4 bg-black text-white p-3 rounded hide-scrollbar border border-gray-300">
              <pre className="text-green-400 text-left whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import { VestingConfiguration } from '@orchestra-labs/symphonyjs/contracts/RewardsVestingOrchestrator.types';
import { useState } from 'react';

import {
  localAssetRegistry,
  vestingContractCodeId,
  vestingOrchestratorContractAddress,
} from '@/constants';
import { useToast } from '@/hooks';
import { useVestingContract } from '@/hooks/useVestingContract';

import { NumericInput } from '@/components';
import { Button } from '../Button';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { VestingRecipient } from '@/types';

export const VestingForm = () => {
  const [contractCodeId, setContractCodeId] = useState<number | null>(
    vestingContractCodeId,
  );
  const [cliffYears, setCliffYears] = useState<number | null>(null);
  const [cliffMonths, setCliffMonths] = useState<number | null>(null);
  const [durationDays, setDurationDays] = useState<number | null>(null);
  const [jsonInput, setJsonInput] = useState('');

  const { toast } = useToast();

  const { submitTx } = useVestingContract(vestingOrchestratorContractAddress);

  const handleSubmit = async () => {
    if (cliffYears === null || cliffMonths === null) {
      toast({
        variant: 'destructive',
        title: 'Invalid cliff date!',
        description: 'Please fill in all the required fields',
      });
      return;
    }
    if (durationDays === null) {
      toast({
        variant: 'destructive',
        title: 'Invalid duration!',
        description: 'Please fill in all the required fields',
      });
      return;
    }
    if (!jsonInput) {
      toast({
        variant: 'destructive',
        title: 'Invalid JSON input!',
        description: 'Please provide valid JSON input for vesting records',
      });
      return;
    }

    // Calculate the cliff date - ensure it's at least tomorrow
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow

    let cliffDate: Date;

    if (cliffYears === 0 && cliffMonths === 0) {
      // If both are 0, use tomorrow as the minimum cliff date
      cliffDate = tomorrow;
    } else {
      // Calculate the cliff date based on user input
      cliffDate = new Date();
      cliffDate.setFullYear(cliffDate.getFullYear() + cliffYears);
      cliffDate.setMonth(cliffDate.getMonth() + cliffMonths);
      cliffDate.setDate(1); // First day of the month
      cliffDate.setHours(0, 0, 0, 0); // Start of day

      // Ensure cliff date is at least tomorrow
      if (cliffDate.getTime() < tomorrow.getTime()) {
        cliffDate = tomorrow;
      }
    }

    const cliffOffset = cliffDate.getTime(); // Convert to milliseconds
    const epochTimeNanoSeconds = (cliffOffset * 1_000_000).toString(); // Convert to nanoseconds
    const durationInSeconds = durationDays * 24 * 60 * 60;

    const vestingRecipients = JSON.parse(jsonInput) as VestingRecipient[];

    await submitTx(
      {
        contract_code_id: contractCodeId,
        schedule: 'saturating_linear',
        start_time: epochTimeNanoSeconds,
        duration: durationInSeconds,
        title_prefix: 'Symphony Vesting',
        description_prefix: 'Vesting for Symphony',
        denom: localAssetRegistry.note.denom,
      } as VestingConfiguration,
      vestingRecipients,
    );
  };

  return (
    <Card className="w-[425px] h-[500px] bg-black text-white overflow-hidden relative border border-gray-300">
      <CardHeader className="transition-[padding-bottom] duration-500 ease-in-out">
        <CardTitle>Payment Vesting Scheduler</CardTitle>
      </CardHeader>

      <CardContent className="h-full flex flex-col">
        <div className="overflow-hidden transition-[max-height] duration-500 ease-in-out">
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <NumericInput
                placeholder="Contract code id"
                value={contractCodeId}
                onChange={setContractCodeId}
                decimalPlaces={0}
                min={0}
              />
              <NumericInput
                placeholder="Duration of vesting in days (after cliff)"
                value={durationDays}
                onChange={setDurationDays}
                decimalPlaces={0}
                min={1}
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

            <Button variant="outline" onClick={handleSubmit}>
              Create batch vesting schedules
            </Button>
            <textarea
              className="w-full h-32 bg-black p-2 rounded text-white border border-gray-300 placeholder-gray-400"
              placeholder="Paste JSON here to format/display"
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import { useChain } from '@cosmos-kit/react';
import { defaultChainName, localAssetRegistry } from '@/constants';
import { RewardsVestingOrchestratorClient } from '@orchestra-labs/symphonyjs/contracts/RewardsVestingOrchestrator.client';
import {
  VestingConfiguration,
  VestingRecord,
} from '@orchestra-labs/symphonyjs/contracts/RewardsVestingOrchestrator.types';
import { useToast } from '@/hooks/useToast';
import { hashToHumanReadable } from '@/helpers';
import { useCosmWasmSigningClient } from './useCosmWasmSigningClient';
import { Coin } from '@cosmjs/amino';
import { VestingRecipient } from '@/types';

export const useVestingContract = (contractAddress: string) => {
  const { address, isWalletConnected } = useChain(defaultChainName);
  const { getClient } = useCosmWasmSigningClient();
  const { toast } = useToast();

  const copyToClipboard = (txHash: string) => {
    navigator.clipboard.writeText(txHash);

    toast({
      title: 'Copied to clipboard!',
      description: `Transaction hash ${hashToHumanReadable(txHash)} has been copied.`,
    });
  };

  const submitTx = async (
    configuration: VestingConfiguration,
    recipients: VestingRecipient[],
  ) => {
    if (!configuration || recipients.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Tx Failed!',
        description: 'Please fill in all the required fields',
      });
      return;
    }

    if (!isWalletConnected || !address) {
      toast({
        variant: 'destructive',
        title: 'Tx Failed!',
        description: 'Please connect a wallet',
      });
      return;
    }

    const cosmWasmClient = await getClient();
    console.log('client', cosmWasmClient);

    const contractClient = new RewardsVestingOrchestratorClient(
      // @ts-expect-error "symphonyjs uses next version of cosmjs"
      cosmWasmClient,
      address,
      contractAddress,
    );

    const txToastProgress = toast({
      title: 'Tx in Progress',
      description: 'Waiting for transaction to be included in the block',
    });

    try {
      console.log('=== TRANSFORMING VESTING RECIPIENTS TO RECORDS ===');
      console.log('Original recipients:', recipients);

      // Transform VestingRecipient[] to VestingRecord[]
      const vestingRecords: VestingRecord[] = recipients.flatMap(recipient =>
        recipient.entries.map(entry => ({
          address: recipient.recipient,
          amount:
            typeof entry.amount === 'number'
              ? entry.amount.toString()
              : entry.amount,
        })),
      );

      console.log('Transformed vesting records:', vestingRecords);
      console.log('=== TRANSFORMATION COMPLETE ===');

      console.log('=== CALCULATING TOTAL AMOUNT ===');

      // Calculate total amount from the transformed records
      const totalAmount = vestingRecords.reduce((acc, record) => {
        try {
          console.log(`Processing record amount:`, record.amount);
          const amountBigInt = BigInt(record.amount);
          return acc + amountBigInt;
        } catch (error) {
          console.error(
            `Error converting amount to BigInt:`,
            record.amount,
            error,
          );
          throw new Error(`Invalid amount format: ${record.amount}`);
        }
      }, BigInt(0));

      console.log('Total amount calculated:', totalAmount.toString());
      console.log('=== TOTAL AMOUNT CALCULATION COMPLETE ===');

      const funds = [
        {
          denom: localAssetRegistry.note.denom,
          amount: totalAmount.toString(),
        },
      ] as Coin[];

      console.log('Funds being sent:', funds);

      const executeResult = await contractClient.batchVesting(
        {
          configuration,
          records: vestingRecords, // Use the transformed records
        },
        'auto',
        '',
        funds,
      );

      txToastProgress.dismiss();

      toast({
        title: 'Tx Successful!',
        description: `Transaction ${hashToHumanReadable(executeResult.transactionHash)} has been included in the block. Click to copy the hash.`,
        onClick: () => copyToClipboard(executeResult.transactionHash),
      });
    } catch (error) {
      console.error('Transaction failed with error:', error);
      txToastProgress.dismiss();
      toast({
        variant: 'destructive',
        title: 'Tx Failed!',
        description: `An error occurred while executing the transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  return {
    submitTx,
  };
};

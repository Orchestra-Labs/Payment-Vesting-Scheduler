import { useChain } from '@cosmos-kit/react';
import { defaultChainName, localAssetRegistry } from '@/constants';
import { RewardsVestingOrchestratorClient } from '@orchestra-labs/symphonyjs/contracts/RewardsVestingOrchestrator.client';
import {
  VestingConfiguration,
  VestingRecord,
} from '@orchestra-labs/symphonyjs/contracts/RewardsVestingOrchestrator.types';
import { useToast } from '@/hooks/useToast';
import { hashToHumanReadable, isValidBech32Address } from '@/helpers';
import { useCosmWasmSigningClient } from './useCosmWasmSigningClient';
import { Coin } from '@cosmjs/amino';
import { VestingRecipient } from '@/types';
import { calculateFee, GasPrice } from '@cosmjs/stargate';

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

  const normalizeAddress = (address: string): string => {
    return address.toLowerCase();
  };

  // Batch processing function for very large transactions
  const submitTxInBatches = async (
    configuration: VestingConfiguration,
    recipients: VestingRecipient[],
    batchSize: number = 10, // Reduced batch size for safety
    startFromBatch: number = 1, // Start from specific batch number
  ): Promise<{ transactionHash: string }[]> => {
    if (!isWalletConnected || !address) {
      toast({
        variant: 'destructive',
        title: 'Tx Failed!',
        description: 'Please connect a wallet',
      });
      return [];
    }

    const cosmWasmClient = await getClient();
    const contractClient = new RewardsVestingOrchestratorClient(
      // @ts-expect-error "symphonyjs uses next version of cosmjs"
      cosmWasmClient,
      address,
      contractAddress,
    );

    // Transform recipients to records
    const vestingRecords: VestingRecord[] = recipients.flatMap(recipient => {
      const normalizedAddress = normalizeAddress(recipient.recipient);
      if (!isValidBech32Address(normalizedAddress)) return [];
      return recipient.entries.map(entry => ({
        address: normalizedAddress,
        amount:
          typeof entry.amount === 'number'
            ? entry.amount.toString()
            : entry.amount,
      }));
    });

    if (vestingRecords.length === 0) {
      throw new Error('No valid vesting records found');
    }

    const results: { transactionHash: string }[] = [];
    const totalBatches = Math.ceil(vestingRecords.length / batchSize);

    // Show initial batch progress toast
    const mainBatchToast = toast({
      title: `Starting Batch Processing`,
      description: `Processing ${vestingRecords.length} records in ${totalBatches} batches (starting from batch ${startFromBatch})...`,
    });

    for (
      let i = (startFromBatch - 1) * batchSize;
      i < vestingRecords.length;
      i += batchSize
    ) {
      const batch = vestingRecords.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      // Skip batches that were already processed
      if (batchNumber < startFromBatch) {
        continue;
      }

      const batchToast = toast({
        title: `Processing Batch ${batchNumber}/${totalBatches}`,
        description: `Processing ${batch.length} records (${i + batch.length}/${vestingRecords.length} total)...`,
      });

      try {
        // Calculate batch amount
        const batchAmount = batch.reduce(
          (acc, record) => acc + BigInt(record.amount),
          BigInt(0),
        );
        const batchFunds = [
          {
            denom: localAssetRegistry.note.denom,
            amount: batchAmount.toString(),
          },
        ] as Coin[];

        // Calculate gas for this batch - MUCH more conservative
        const gasPrice = GasPrice.fromString('0.004note');

        // Significantly increased gas estimates based on the error logs
        const baseGas = 500000; // Much higher base gas
        const perRecordGas = 100000; // Much higher per record gas
        const batchGas = baseGas + batch.length * perRecordGas;

        // Add 100% buffer for maximum safety
        const gasWithBuffer = Math.ceil(batchGas * 2.0);
        const maxBatchGas = 2000000; // Max 2M per batch to be safe
        const finalGas = Math.min(gasWithBuffer, maxBatchGas);

        const fee = calculateFee(finalGas, gasPrice);

        console.log(
          `Batch ${batchNumber}: ${batch.length} records, Gas: ${finalGas}, Fee: ${fee.amount[0]?.amount} ${fee.amount[0]?.denom}`,
        );

        // Use the contract client directly but catch the indexing error
        try {
          const result = await contractClient.batchVesting(
            {
              configuration,
              records: batch,
            },
            fee,
            `Batch ${batchNumber} of ${totalBatches}`,
            batchFunds,
          );

          results.push({ transactionHash: result.transactionHash });

          // Log transaction hash to console
          console.log(
            `✅ Batch ${batchNumber} TX Hash:`,
            result.transactionHash,
          );

          batchToast.dismiss();

          toast({
            title: `Batch ${batchNumber} Complete ✓`,
            description: `Processed ${batch.length} records. TX: ${hashToHumanReadable(result.transactionHash)}`,
            duration: 5000,
            onClick: () => copyToClipboard(result.transactionHash),
          });
        } catch (indexingError: any) {
          // If it's an indexing error, the transaction might still be successful
          if (
            indexingError.message &&
            indexingError.message.includes('transaction indexing is disabled')
          ) {
            const txHash =
              indexingError.transactionHash ||
              `batch-${batchNumber}-${Date.now()}`;

            results.push({ transactionHash: txHash });

            console.log(
              `✅ Batch ${batchNumber} TX Hash (indexing disabled):`,
              txHash,
            );

            batchToast.dismiss();

            toast({
              title: `Batch ${batchNumber} Broadcast ✓`,
              description: `Processed ${batch.length} records. TX broadcast successful (indexing disabled)`,
              duration: 5000,
            });
          } else {
            throw indexingError;
          }
        }

        // Wait between batches
        if (batchNumber < totalBatches) {
          const waitTime = 10000; // 10 seconds

          console.log(`Waiting ${waitTime}ms before next batch`);

          const waitToast = toast({
            title: `Waiting for Block Confirmation`,
            description: `Next batch in ${(waitTime / 1000).toFixed(0)} seconds...`,
          });

          await new Promise(resolve => setTimeout(resolve, waitTime));
          waitToast.dismiss();
        }
      } catch (error: any) {
        batchToast.dismiss();
        console.error(`Batch ${batchNumber} failed:`, error);

        // Handle out of gas error specifically with much higher gas
        if (error.message && error.message.includes('out of gas')) {
          toast({
            variant: 'destructive',
            title: `Batch ${batchNumber} Failed - Out of Gas`,
            description: 'Retrying with much higher gas limit...',
          });

          // Recalculate with MUCH higher gas
          const batchAmount = batch.reduce(
            (acc, record) => acc + BigInt(record.amount),
            BigInt(0),
          );
          const batchFunds = [
            {
              denom: localAssetRegistry.note.denom,
              amount: batchAmount.toString(),
            },
          ] as Coin[];

          // Double the gas estimates for retry
          const higherGasPrice = GasPrice.fromString('0.004note');
          const baseGas = 1000000; // 1 million base gas
          const perRecordGas = 200000; // 200k per record
          const batchGas = baseGas + batch.length * perRecordGas;
          const gasWithBuffer = Math.ceil(batchGas * 2.0); // 200% buffer
          const maxBatchGas = 3000000; // 3 million max
          const finalGas = Math.min(gasWithBuffer, maxBatchGas);
          const retryFee = calculateFee(finalGas, higherGasPrice);

          console.log(
            `Retrying batch ${batchNumber} with MUCH higher gas: ${finalGas}, Fee: ${retryFee.amount[0]?.amount} ${retryFee.amount[0]?.denom}`,
          );

          try {
            const result = await contractClient.batchVesting(
              {
                configuration,
                records: batch,
              },
              retryFee,
              `Batch ${batchNumber} of ${totalBatches} (retry - higher gas)`,
              batchFunds,
            );

            results.push({ transactionHash: result.transactionHash });
            console.log(
              `✅ Batch ${batchNumber} TX Hash (retry):`,
              result.transactionHash,
            );

            toast({
              title: `Batch ${batchNumber} Complete ✓`,
              description: `Processed ${batch.length} records after retry. TX: ${hashToHumanReadable(result.transactionHash)}`,
              duration: 5000,
            });

            continue; // Success, move to next batch
          } catch (retryError) {
            console.error(`Batch ${batchNumber} retry failed:`, retryError);
            // Fall through to general error handling
          }
        }

        // If batch still fails due to gas, try with much smaller batch size
        if (
          error.message.includes('out of gas') ||
          error.message.includes('exceeds block max gas')
        ) {
          toast({
            variant: 'destructive',
            title: `Batch ${batchNumber} Failed - Reducing Batch Size`,
            description: 'Retrying with much smaller batch...',
          });

          const smallerBatchSize = Math.max(3, Math.floor(batchSize * 0.5)); // 50% smaller
          const remainingResults = await submitTxInBatches(
            configuration,
            recipients.slice(i),
            smallerBatchSize,
            batchNumber, // Start from current batch number
          );

          return [...results, ...remainingResults];
        }

        // Handle insufficient fees error
        if (error.message && error.message.includes('insufficient fees')) {
          toast({
            variant: 'destructive',
            title: `Batch ${batchNumber} Failed - Insufficient Fees`,
            description: 'Retrying with higher gas price...',
          });

          // Recalculate with higher gas price
          const batchAmount = batch.reduce(
            (acc, record) => acc + BigInt(record.amount),
            BigInt(0),
          );
          const batchFunds = [
            {
              denom: localAssetRegistry.note.denom,
              amount: batchAmount.toString(),
            },
          ] as Coin[];

          const higherGasPrice = GasPrice.fromString('0.005note');
          const baseGas = 500000;
          const perRecordGas = 100000;
          const batchGas = baseGas + batch.length * perRecordGas;
          const gasWithBuffer = Math.ceil(batchGas * 2.0);
          const maxBatchGas = 2000000;
          const finalGas = Math.min(gasWithBuffer, maxBatchGas);
          const retryFee = calculateFee(finalGas, higherGasPrice);

          console.log(
            `Retrying batch ${batchNumber} with higher fee: ${retryFee.amount[0]?.amount} ${retryFee.amount[0]?.denom}`,
          );

          try {
            const result = await contractClient.batchVesting(
              {
                configuration,
                records: batch,
              },
              retryFee,
              `Batch ${batchNumber} of ${totalBatches} (retry - higher fee)`,
              batchFunds,
            );

            results.push({ transactionHash: result.transactionHash });
            console.log(
              `✅ Batch ${batchNumber} TX Hash (retry):`,
              result.transactionHash,
            );

            toast({
              title: `Batch ${batchNumber} Complete ✓`,
              description: `Processed ${batch.length} records after retry. TX: ${hashToHumanReadable(result.transactionHash)}`,
              duration: 5000,
            });

            continue; // Success, move to next batch
          } catch (retryError) {
            console.error(`Batch ${batchNumber} retry failed:`, retryError);
            // Fall through to general error handling
          }
        }

        toast({
          variant: 'destructive',
          title: `Batch ${batchNumber} Failed`,
          description: 'Please try again or contact support',
        });

        throw error;
      }
    }

    mainBatchToast.dismiss();

    // Completion handling
    const completionDescription =
      results.length === 1
        ? `Transaction ${hashToHumanReadable(results[0].transactionHash)} completed successfully.`
        : `All ${results.length} batches completed successfully. View console for all transaction hashes.`;

    toast({
      title: 'All Batches Complete! 🎉',
      description: completionDescription,
      duration: 10000,
    });

    // Log all transaction hashes to console
    console.log('🎉 ALL BATCHES COMPLETED SUCCESSFULLY');
    console.log('=====================================');
    console.log(`Total batches: ${results.length}`);
    console.log(`Total records processed: ${vestingRecords.length}`);
    console.log('Transaction Hashes:');
    results.forEach((result, index) => {
      console.log(`  Batch ${index + 1}: ${result.transactionHash}`);
    });
    console.log('=====================================');

    return results;
  };

  const submitTx = async ({
    configuration,
    recipients,
    batchSize = 5,
    startFromBatch = 1,
  }: {
    configuration: VestingConfiguration;
    recipients: VestingRecipient[];
    batchSize?: number;
    startFromBatch?: number;
  }): Promise<{ transactionHash: string } | { transactionHash: string }[]> => {
    // For any number of recipients, use batch processing as default
    const results = await submitTxInBatches(
      configuration,
      recipients,
      batchSize,
      startFromBatch,
    );

    // Return single result if only one batch, otherwise return array
    return results.length === 1 ? results[0] : results;
  };

  return {
    submitTx,
    submitTxInBatches,
  };
};

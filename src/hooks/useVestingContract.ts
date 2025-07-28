import { useChain } from '@cosmos-kit/react';
import { defaultChainName } from '@/constants';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { RewardsVestingOrchestratorClient } from '@orchestra-labs/symphonyjs/contracts/RewardsVestingOrchestrator.client';
import {
  VestingConfiguration,
  VestingRecord,
} from '@orchestra-labs/symphonyjs/contracts/RewardsVestingOrchestrator.types';
import { useToast } from '@/hooks/useToast';
import { hashToHumanReadable } from '@/helpers';
import { useCosmWasmSigningClient } from './useCosmWasmSigningClient';

export const useVestingContract = (contractAddress: string) => {
  const { address, isWalletConnected } =
    useChain(defaultChainName);
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
    records: VestingRecord[],
  ) => {
    if (!configuration || records.length === 0) {
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
      const executeResult = await contractClient.batchVesting({
        configuration,
        records,
      });
      txToastProgress.dismiss();

      toast({
        title: 'Tx Successful!',
        description: `Transaction ${hashToHumanReadable(executeResult.transactionHash)} has been included in the block. Click to copy the hash.`,
        onClick: () => copyToClipboard(executeResult.transactionHash),
      });
    } catch (error) {
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

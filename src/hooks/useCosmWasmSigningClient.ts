import { defaultChainName } from "@/constants";
import { Chain } from "@chain-registry/types";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { useChain } from "@cosmos-kit/react";

function getGasFeeFromChain(chain: any): GasPrice {
    const gasValue = chain.fees?.fee_tokens[0]?.average_gas_price;
    const denom = chain.fees?.fee_tokens[0]?.denom;
    if (!gasValue || !denom) return GasPrice.fromString('0.025note');

    return GasPrice.fromString(gasValue.toString()+denom);
}

export const useCosmWasmSigningClient = () => {
    const {isWalletConnected, getRpcEndpoint, getOfflineSigner, chain} = useChain(defaultChainName);

    const getClient = async () => {
        if (!isWalletConnected) return undefined;

        const signingClient = await SigningCosmWasmClient.connectWithSigner(
          await getRpcEndpoint(),
          getOfflineSigner(),
          {
            gasPrice: getGasFeeFromChain(chain),
          }
        );

        return signingClient
    }

    return {
        getClient,
    }
}
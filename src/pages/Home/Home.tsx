import { Provider } from 'jotai';
import { MainSection } from '@/sections';
import { Button } from '@/ui-kit';
import { Wallet } from 'lucide-react';
import { useEffect } from 'react';
import { defaultChainName } from '@/constants';
import { useChain } from '@cosmos-kit/react';

export const Home = () => {
  const { isWalletConnected, connect } = useChain(defaultChainName);

  console.log('isWalletConnected', isWalletConnected);
  useEffect(() => {
    if (isWalletConnected) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
    }
  }, [isWalletConnected]);

  return (
    <Provider>
      <div>
        {isWalletConnected ? (
          <MainSection />
        ) : (
          <div className="h-screen justify-center flex items-center">
            <Button
              variant="outline"
              onClick={e => {
                e.preventDefault();
                connect();
              }}
            >
              <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
            </Button>
          </div>
        )}
      </div>
    </Provider>
  );
};

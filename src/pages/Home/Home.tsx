import { Provider } from 'jotai';
import { MainSection } from '@/sections';

export const Home = () => {
  return (
    <Provider>
      <MainSection />
    </Provider>
  );
};

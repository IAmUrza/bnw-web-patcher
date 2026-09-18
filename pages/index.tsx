import { NextPage } from 'next';
import { useCallback, useState } from 'react';
import Layout from '@/layout';
import MainPatcher from '@/components/MainPatcher';
import Attribution from '@/components/Attribution';

const HomePage: NextPage = () => {
  // Set by MainPatcher when every Hell Mode patch is selected.
  const [hellMode, setHellMode] = useState(false);

  // Stable reference, so MainPatcher's effect doesn't re-run every render.
  const handleHellModeChange = useCallback((active: boolean) => {
    setHellMode(active);
  }, []);

  return (
    <Layout>
      {/* Fixed red wash over the background image. Fading a layer's opacity
          rather than the gradient itself, because gradients don't
          interpolate - they would snap. */}
      <div className={hellMode ? 'hell-wash hell-wash-on' : 'hell-wash'} />

      <div className='plus-patcher-bg container'>
        <div>
          <p className='app-title'>
            {hellMode
              ? 'Final Fantasy VI: Brave New Hell'
              : 'Final Fantasy VI: Brave New World'}
            <span className='app-subtitle'>Web Patcher</span>
          </p>
        </div>
        <MainPatcher onHellModeChange={handleHellModeChange} />
        {/* row styling exists in above component*/}
        <Attribution />
      </div>
    </Layout>
  );
};
export default HomePage;

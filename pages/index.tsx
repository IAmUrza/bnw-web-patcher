import { NextPage } from 'next';
import Layout from '@/layout';
import MainPatcher from '@/components/MainPatcher';
import Attribution from '@/components/Attribution';

const HomePage: NextPage = () => {
  return (
    <Layout>
      <div className='plus-patcher-bg container'>
        <div>
          <p className='app-title'>
            Final Fantasy VI: Brave New World
            <span className='app-subtitle'>Web Patcher</span>
          </p>
        </div>
        <MainPatcher />
        {/* row styling exists in above component*/}
        <Attribution />
      </div>
    </Layout>
  );
};
export default HomePage;

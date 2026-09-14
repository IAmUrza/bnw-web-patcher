import { NextPage } from 'next';
import Layout from '@/layout';
import TitleScreen from "@/components/TitleScreen";

const Guides: NextPage = () => {
  return (
    <Layout>      
      <div className='guides-bg'>
        <p className='app-title'>
          Final Fantasy VI: Brave New World
          <span className='app-subtitle'>Documentation</span>
        </p>
        <TitleScreen />
        <p>All docs by the author of this romhack, Lightning Hunter</p>
        <ul className='guides-list'>
			<li>
				<a href="/items">
					Item List
				</a>
			</li>
			<li>
				<a href="/bestiary">
					Bestiary List
				</a>
			</li>
			<li>
				<a href="/rage">
					Rage List
				</a>
			</li>
			<li>
				<a href="/treasure">
					Treasure Checklist
				</a>
			</li>
			<li>
				<a href="/morph">
					Morph List
				</a>
			</li>
			<li>
				<a href="/blue-magic">
					Blue Magic List
				</a>
			</li>
			<li>
				<a href="/colosseum">
					Colosseum List
				</a>
			</li>
			<li>
				<a href="/walkthrough">
					Full Game Walkthrough
				</a>
			</li>
        </ul>
		<h2>
			<a target="_blank" href="FF6-ASC-Guides.zip" className='special-link'>
				Download all Guides (.docx) in a .zip file
			</a>
		</h2>
      </div>
    </Layout>
  );
};

export default Guides;

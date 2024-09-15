import React from 'react'
import HeaderBox from '@/components/HeaderBox'
import TotalBalancebox from '@/components/TotalBalancebox';
import RightSidebar from '@/components/RightSidebar';
import { getLoggedInUser } from '@/lib/actions/user.actions';

const Home = async () => {
  const loggedIn = await getLoggedInUser();
  // const firstName= loggedIn.

  return (
    <section  className="home" >
        <div className="home-content">
        <header className='home-header'>
           <HeaderBox 
           type="greeting" 
           title="Welcome" 
           user={loggedIn?.name || 'Guest'} 
           subtext="Access and manage your account and transactions efficiently"
           />
           <TotalBalancebox
             accounts={[]}
             totalBanks={1}
             totalCurrentBalance={1250.35}
           />
        </header>

        RECENT TRANSACTIONS

        </div>
        <RightSidebar
        user={loggedIn}
        transactions={[]}
        banks={[{currentBalance:123.50},{currentBalance:543.50}]}
        />
    </section>
  )
}
export default Home
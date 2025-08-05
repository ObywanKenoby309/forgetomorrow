import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';

import JobPostingsManager from '../components/business/JobPostingsManager';
import AITalentAssistant from '../components/business/AITalentAssistant';
import EnterpriseAnalytics from '../components/business/EnterpriseAnalytics';
import AccountManagerSupport from '../components/business/AccountManagerSupport';
import CandidateDiscovery from '../components/business/CandidateDiscovery';
import ComplianceSecurity from '../components/business/ComplianceSecurity';
import BrandVisibility from '../components/business/BrandVisibility';

export default function BusinessDashboard() {
  return (
    <>
      <Head>
        <title>ForgeTomorrow - Business Dashboard</title>
      </Head>

      <Header />

      <main className="max-w-7xl mx-auto p-6 min-h-[80vh] bg-[#ECEFF1] text-[#212121] space-y-8 pt-20">
        <h1 className="text-3xl font-bold text-[#FF7043] mb-6">Business Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <JobPostingsManager />
          <AITalentAssistant />
          <EnterpriseAnalytics />
          <AccountManagerSupport />
          <CandidateDiscovery />
          <ComplianceSecurity />
          <BrandVisibility />
        </div>
      </main>

      <Footer />
    </>
  );
}

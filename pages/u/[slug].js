// pages/u/[slug].js — ForgeTomorrow Public Portfolio (read-only, no siderails)
import PortfolioViewPage from '@/pages/profile/[slug]';
import { getServerSideProps as baseGetSSP } from '@/pages/profile/[slug]';

export async function getServerSideProps(context) {
  const result = await baseGetSSP(context);
  if (result.props) {
    result.props.isOwner = false;
    result.props.publicView = true;
  }
  return result;
}

export default PortfolioViewPage;
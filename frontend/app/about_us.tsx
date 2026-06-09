import { StaticPageScreen } from '@/components/shared/static-page-screen';
import { STATIC_PAGES } from '@/constants/static-pages';

export default function AboutUsScreen() {
  return <StaticPageScreen {...STATIC_PAGES.about_us} />;
}

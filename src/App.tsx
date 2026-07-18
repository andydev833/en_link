import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { usePartnerStore } from './store/partnerStore';

// Customer pages
import ProposePage from './pages/customer/ProposePage';
import ContactPage from './pages/customer/ContactPage';
import ThanksPage from './pages/customer/ThanksPage';

// Partner pages
import PartnerRegister from './pages/partner/Register';
import PartnerLogin from './pages/partner/Login';
import PartnerDashboard from './pages/partner/Dashboard';
import PartnerMaterials from './pages/partner/Materials';
import PartnerReferrals from './pages/partner/Referrals';
import PartnerPayment from './pages/partner/Payment';

// Admin pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminPartners from './pages/admin/Partners';
import AdminPartnerDetail from './pages/admin/PartnerDetail';
import AdminReferrals from './pages/admin/Referrals';
import AdminReferralDetail from './pages/admin/ReferralDetail';
import AdminRewards from './pages/admin/Rewards';
import AdminMenus from './pages/admin/Menus';
import AdminSettings from './pages/admin/Settings';
import AdminAnalytics from './pages/admin/Analytics';
import AdminLpContents from './pages/admin/LpContents';

// ============================================================
// 認証ガード
// ============================================================
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdminLoggedIn, adminSession } = useAuthStore();
  // Use session presence as fallback if persisted state not yet reflected
  if (!isAdminLoggedIn && !adminSession) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function PartnerGuard({ children }: { children: React.ReactNode }) {
  // authStore（GAS連携）とpartnerStore（ローカルフォールバック）の両方をチェック
  const { isPartnerLoggedIn: authLoggedIn } = useAuthStore();
  const { isPartnerLoggedIn: localLoggedIn } = usePartnerStore();
  if (!authLoggedIn && !localLoggedIn) return <Navigate to="/partner/login" replace />;
  return <>{children}</>;
}

// ============================================================
// App
// ============================================================
export default function App() {
  return (
    <BrowserRouter basename="/en_link">
      <Routes>
        {/* デフォルト */}
        <Route path="/" element={<Navigate to="/propose" replace />} />

        {/* 顧客向け */}
        <Route path="/propose" element={<ProposePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/contact/thanks" element={<ThanksPage />} />

        {/* 紹介者向け */}
        <Route path="/partner/register" element={<PartnerRegister />} />
        <Route path="/partner/login" element={<PartnerLogin />} />
        <Route path="/partner/dashboard" element={<PartnerGuard><PartnerDashboard /></PartnerGuard>} />
        <Route path="/partner/materials" element={<PartnerGuard><PartnerMaterials /></PartnerGuard>} />
        <Route path="/partner/referrals" element={<PartnerGuard><PartnerReferrals /></PartnerGuard>} />
        <Route path="/partner/payment" element={<PartnerGuard><PartnerPayment /></PartnerGuard>} />

        {/* 管理者向け */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        <Route path="/admin/partners" element={<AdminGuard><AdminPartners /></AdminGuard>} />
        <Route path="/admin/partners/:id" element={<AdminGuard><AdminPartnerDetail /></AdminGuard>} />
        <Route path="/admin/referrals" element={<AdminGuard><AdminReferrals /></AdminGuard>} />
        <Route path="/admin/referrals/:id" element={<AdminGuard><AdminReferralDetail /></AdminGuard>} />
        <Route path="/admin/rewards" element={<AdminGuard><AdminRewards /></AdminGuard>} />
        <Route path="/admin/menus" element={<AdminGuard><AdminMenus /></AdminGuard>} />
        <Route path="/admin/settings" element={<AdminGuard><AdminSettings /></AdminGuard>} />

        {/* MAX版追加ページ */}
        <Route path="/admin/analytics" element={<AdminGuard><AdminAnalytics /></AdminGuard>} />
        <Route path="/admin/lp-contents" element={<AdminGuard><AdminLpContents /></AdminGuard>} />

        {/* フォールバック */}
        <Route path="*" element={<Navigate to="/propose" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

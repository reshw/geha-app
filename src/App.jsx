import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/common/MainLayout';
import WeeklyList from './components/reservations/WeeklyList';
import PraisePage from './pages/PraisePage';
import KakaoCallback from './components/auth/KakaoCallback';
import SignupPage from './pages/SignupPage';
import SignupDemoPage from './pages/SignupDemoPage';
import JoinSpacePage from './pages/JoinSpacePage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ExpenseListPage from './pages/ExpenseListPage';
import ExpenseRequestPage from './pages/ExpenseRequestPage';
import MigrationPage from './pages/MigrationPage';

// 정산 페이지들
import SettlementPage from './pages/SettlementPage';
import SettlementSubmitPage from './pages/SettlementSubmitPage';

// 스페이스 관리 페이지들
import SpaceManagePage from './pages/SpaceManagePage';
import SpaceSettingsPage from './pages/SpaceSettingsPage';
import MemberManagePage from './pages/MemberManagePage';
import AlimtalkSettingsPage from './pages/AlimtalkSettingsPage';
import GuestPolicySettingsPage from './pages/GuestPolicySettingsPage';
import TransferManagerPage from './pages/TransferManagerPage';
import SuperAdminPage from './pages/SuperAdminPage';
import SlopesPage from './pages/SlopesPage';
import EmailTestPage from './pages/EmailTestPage';


function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* 하단 네비게이션이 있는 메인 페이지들 */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<WeeklyList />} />
            <Route path="/settlement" element={<SettlementPage />} />
            <Route path="/praise" element={<PraisePage />} />
            <Route path="/expenses" element={<ExpenseListPage />} />
            <Route path="/slopes" element={<SlopesPage />} />
          </Route>

          {/* 하단 네비게이션이 없는 독립 페이지들 */}
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signin" element={<SignupDemoPage />} />
          <Route path="/join" element={<JoinSpacePage />} />
          <Route path="/join/:code" element={<JoinSpacePage />} />
          <Route path="/expenses/request" element={<ExpenseRequestPage />} />
          <Route path="/settlement/submit" element={<SettlementSubmitPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/migration" element={<MigrationPage />} />
          
          {/* 스페이스 관리 */}
          <Route path="/space/manage" element={<SpaceManagePage />} />
          <Route path="/space/settings" element={<SpaceSettingsPage />} />
          <Route path="/space/members" element={<MemberManagePage />} />
          <Route path="/space/alimtalk" element={<AlimtalkSettingsPage />} />
          <Route path="/space/guestpolicy" element={<GuestPolicySettingsPage />} />
          <Route path="/space/transfer-manager" element={<TransferManagerPage />} />
          
          {/* 슈퍼 어드민 */}
          <Route path="/super-admin" element={<SuperAdminPage />} />

          {/* 이메일 테스트 */}
          <Route path="/email-test" element={<EmailTestPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WeeklyList from './components/reservations/WeeklyList';
import KakaoCallback from './components/auth/KakaoCallback';
import SignupPage from './pages/SignupPage';
import SignupDemoPage from './pages/SignupDemoPage';
import JoinSpacePage from './pages/JoinSpacePage';
import SpaceManagePage from './pages/SpaceManagePage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ExpenseListPage from './pages/ExpenseListPage';
import ExpenseRequestPage from './pages/ExpenseRequestPage';
import MigrationPage from './pages/MigrationPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<WeeklyList />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signin" element={<SignupDemoPage />} />
          <Route path="/join" element={<JoinSpacePage />} />
          <Route path="/join/:code" element={<JoinSpacePage />} />
          <Route path="/manage" element={<SpaceManagePage />} />
          <Route path="/expenses" element={<ExpenseListPage />} />
          <Route path="/expenses/request" element={<ExpenseRequestPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/migration" element={<MigrationPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
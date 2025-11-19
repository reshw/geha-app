import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WeeklyList from './components/reservations/WeeklyList';
import KakaoCallback from './components/auth/KakaoCallback';
import SignupPage from './pages/SignupPage';
import JoinSpacePage from './pages/JoinSpacePage';
import SpaceManagePage from './pages/SpaceManagePage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<WeeklyList />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/join" element={<JoinSpacePage />} />
          <Route path="/join/:code" element={<JoinSpacePage />} />
          <Route path="/manage" element={<SpaceManagePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
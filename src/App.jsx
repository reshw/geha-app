import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WeeklyList from './components/reservations/WeeklyList';
import KakaoCallback from './components/auth/KakaoCallback';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<WeeklyList />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

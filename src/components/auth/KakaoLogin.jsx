// src/components/auth/KakaoLogin.jsx

// ✅ named import 대응
export const KakaoLogin = () => {
  const handleLogin = () => {
    const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;

    // 현재 접속 중인 호스트로 리다이렉트 URI 동적 생성
    const currentOrigin = window.location.origin;
    const REDIRECT_URI = `${currentOrigin}/auth/kakao/callback`;

    // 현재 경로를 state로 전달 (초대 코드 유지)
    const currentPath = window.location.pathname;
    const state = encodeURIComponent(JSON.stringify({ from: currentPath }));

    console.log('🔑 카카오 로그인 리다이렉트 URI:', REDIRECT_URI);
    console.log('🔑 원래 경로 (state):', currentPath);

    const kakaoURL =
      `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&state=${state}`;

    window.location.href = kakaoURL;
  };

  return (
    <button
      onClick={handleLogin}
      className="flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FDD835]
                 text-black font-medium px-6 py-3 rounded-lg transition-colors w-full max-w-xs"
    >
      <span>카카오 로그인</span>
    </button>
  );
};

// ✅ default import도 기존대로 유지
export default KakaoLogin;

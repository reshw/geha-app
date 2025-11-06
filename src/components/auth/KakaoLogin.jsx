const KakaoLogin = () => {
  const handleLogin = () => {
    const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
    
    // 현재 접속 중인 호스트로 리다이렉트 URI 동적 생성
    const currentOrigin = window.location.origin; // http://111.111.111.111:5173
    const REDIRECT_URI = `${currentOrigin}/auth/kakao/callback`;
    
    console.log('🔑 카카오 로그인 리다이렉트 URI:', REDIRECT_URI);
    
    const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
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

export default KakaoLogin;

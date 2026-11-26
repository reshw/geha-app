import KakaoLogin from './KakaoLogin';

const LoginOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-3">라운지 예약 시스템</h2>
        <p className="text-gray-600 mb-8">
          예약 현황을 확인하고 예약하려면<br />
          카카오 로그인이 필요합니다
        </p>
        <div className="flex justify-center">
          <KakaoLogin />
        </div>
        <p className="mt-4 text-xs text-center text-gray-500 leading-relaxed">
          카카오로 로그인하면{' '}
          <a href="/terms" className="underline">이용약관</a>과{' '}
          <a href="/privacy" className="underline">개인정보처리방침</a>에
          <br />
          동의한 것으로 보며, 카카오 계정의 이름·전화번호가 회원 정보로 저장됩니다.
        </p>
      </div>
    </div>
  );
};

export default LoginOverlay;

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
      </div>
    </div>
  );
};

export default LoginOverlay;

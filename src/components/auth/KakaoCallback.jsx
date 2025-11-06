// src/components/auth/KakaoCallback.jsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/authService';
import Loading from '../common/Loading';

const KakaoCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // React 18(개발모드) 중복 실행 및 새로고침/HMR 대비 이중 가드
  const once = useRef(false);

  useEffect(() => {
    (async () => {
      // 1) 동일 마운트에서의 2회 실행 차단
      if (once.current) return;
      once.current = true;

      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const stateStr = url.searchParams.get('state');

      // state로 원래 보던 경로 복원 (redirectUri에 쿼리 붙이지 마세요)
      const from = (() => {
        try {
          return JSON.parse(decodeURIComponent(stateStr || ''))?.from || '/';
        } catch {
          return '/';
        }
      })();

      // 2) 새로고침/HMR로 같은 code 재사용 차단
      if (code && sessionStorage.getItem(`kakao_code_used_${code}`) === '1') {
        navigate(from, { replace: true });
        return;
      }

      try {
        if (!code) throw new Error('인가 코드(code)가 없습니다.');

        // 코드 → 토큰 → 유저정보
        const userInfo = await authService.getKakaoUserInfo(code);

        // 최초 사용자면 등록
        const exists = await authService.checkUserExists(userInfo.id);
        if (!exists) await authService.registerUser(userInfo);

        // 앱 세션에 로그인
        await login(userInfo);

        // 3) 재사용 금지 플래그 남기고, URL에서 ?code 제거하며 이동
        if (code) sessionStorage.setItem(`kakao_code_used_${code}`, '1');
        navigate(from, { replace: true });
      } catch (e) {
        console.error('로그인 실패:', e);
        alert(`로그인에 실패했습니다.\n${e?.message ?? ''}`);

        // 실패해도 같은 code로 재시도되지 않게 플래그 남김
        if (code) sessionStorage.setItem(`kakao_code_used_${code}`, '1');
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading />
    </div>
  );
};

export default KakaoCallback;

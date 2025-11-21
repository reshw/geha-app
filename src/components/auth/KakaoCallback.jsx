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
      if (once.current) return;
      once.current = true;

      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const stateStr = url.searchParams.get('state');

      const from = (() => {
        try {
          return JSON.parse(decodeURIComponent(stateStr || ''))?.from || '/';
        } catch {
          return '/';
        }
      })();

      if (code && sessionStorage.getItem(`kakao_code_used_${code}`) === '1') {
        navigate(from, { replace: true });
        return;
      }

      try {
        if (!code) throw new Error('인가 코드(code)가 없습니다.');

        const userInfo = await authService.getKakaoUserInfo(code);
        console.log('✅ 카카오 유저 정보 받음:', userInfo);

        const exists = await authService.checkUserExists(userInfo.id);
        console.log('🔍 사용자 존재 여부:', exists);

        if (!exists) {
          console.log('🆕 미등록 사용자 - 회원가입 페이지로 이동, from:', from);
          if (code) sessionStorage.setItem(`kakao_code_used_${code}`, '1');

          navigate('/signup', {
            replace: true,
            state: {
              kakaoUserInfo: userInfo,
              from
            }
          });
          return;
        }

        console.log('👤 기존 사용자 - 로그인 처리');

        // ✅ 기존 유저도 카카오 최신값(4개 필드 포함)으로 merge 업데이트
        await authService.updateUserProfile(userInfo.id, {
          displayName: userInfo.displayName,
          profileImage: userInfo.profileImage,
          birthyear: userInfo.birthyear || '',
          gender: userInfo.gender || '',
          phoneNumber: userInfo.phoneNumber || '',
          email: userInfo.email || ''
        });

        await login(userInfo);

        if (code) sessionStorage.setItem(`kakao_code_used_${code}`, '1');
        navigate(from, { replace: true });
      } catch (e) {
        console.error('로그인 실패:', e);
        alert(`로그인에 실패했습니다.\n${e?.message ?? ''}`);

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

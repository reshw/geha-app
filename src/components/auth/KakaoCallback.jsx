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

        // ✅ 기존 유저 데이터 조회
        const userData = await authService.getUserData(userInfo.id);

        // ✅ fullTag 없으면 → 닉네임 설정 페이지로 (기존 사용자 마이그레이션)
        if (!userData.fullTag) {
          console.log('🔄 기존 사용자 마이그레이션 필요 - 닉네임 설정 페이지로');
          if (code) sessionStorage.setItem(`kakao_code_used_${code}`, '1');

          navigate('/signup', {
            replace: true,
            state: {
              kakaoUserInfo: {
                ...userInfo,
                // 기존 프로필 정보 유지
                profileImage: userData.profileImage || userInfo.profileImage,
                birthyear: userData.birthyear || userInfo.birthyear,
                gender: userData.gender || userInfo.gender,
                phoneNumber: userData.phoneNumber || userInfo.phoneNumber
              },
              from,
              isMigration: true  // 마이그레이션 플래그
            }
          });
          return;
        }

        // ✅ fullTag 있으면 정상 로그인 - 카카오 최신값으로 merge 업데이트
        await authService.updateUserProfile(userInfo.id, {
          realName: userInfo.realName || '',         // 카카오 실명 (참고용)
          kakaoNickname: userInfo.kakaoNickname || '', // 카카오 닉네임 (레거시)
          profileImage: userInfo.profileImage,
          email: userInfo.email || ''
          // 참고: displayName은 사용자 지정 별명이므로 재로그인 시 덮어쓰지 않음
          // 참고: birthyear, gender, phoneNumber는 카카오에서 다시 받지 않으므로 업데이트 안 함
        });

        await login({ ...userInfo, fullTag: userData.fullTag });

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
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

        // ✅ 미등록 사용자: 가입 폼 없이 카카오 값(실명·전화번호 등)으로 자동 가입
        if (!exists) {
          console.log('🆕 신규 사용자 - 카카오 정보로 자동 가입');
          const registered = await authService.registerFromKakao(userInfo);

          await login({ ...userInfo, ...registered });

          if (code) sessionStorage.setItem(`kakao_code_used_${code}`, '1');
          navigate(from, { replace: true });
          return;
        }

        console.log('👤 기존 사용자 - 로그인 처리');

        // ✅ 기존 유저 데이터 조회
        const userData = await authService.getUserData(userInfo.id);

        // ✅ fullTag 없으면(구 닉네임 체계) → 기존 별명/카카오 닉네임으로 자동 부여
        let fullTag = userData.fullTag;
        if (!fullTag) {
          console.log('🔄 기존 사용자 마이그레이션 - 닉네임#태그 자동 부여');
          ({ fullTag } = await authService.assignFullTagToExistingUser(
            userInfo.id,
            userData,
            userInfo
          ));
        }

        // ✅ 카카오 최신값으로 merge 업데이트
        const profileUpdates = {
          realName: userInfo.realName || '',         // 카카오 실명 (참고용)
          kakaoNickname: userInfo.kakaoNickname || '', // 카카오 닉네임 (레거시)
          profileImage: userInfo.profileImage,
          email: userInfo.email || ''
          // 참고: displayName은 사용자 지정 별명이므로 재로그인 시 덮어쓰지 않음
        };
        // 비어 있는 항목만 카카오 값으로 채움 (사용자가 직접 고친 값은 유지)
        const kakaoPhone = authService.normalizeKakaoPhone(userInfo.phoneNumber);
        if (!userData.phoneNumber && kakaoPhone) profileUpdates.phoneNumber = kakaoPhone;
        if (!userData.birthyear && userInfo.birthyear) profileUpdates.birthyear = userInfo.birthyear;
        if (!userData.gender && userInfo.gender) profileUpdates.gender = userInfo.gender;

        await authService.updateUserProfile(userInfo.id, profileUpdates);

        await login({ ...userInfo, fullTag });

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
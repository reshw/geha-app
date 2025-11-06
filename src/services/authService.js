// src/services/authService.js
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * .env 예시 (Vite 규칙: 반드시 VITE_ 프리픽스)
 * 
 * VITE_KAKAO_REST_API_KEY=카카오_REST_API_KEY
 * VITE_KAKAO_REDIRECT_URI=http://localhost:5173/auth/callback
 * # (앱에서 'Client Secret 사용'을 켰다면 필수)
 * VITE_KAKAO_CLIENT_SECRET=카카오_CLIENT_SECRET
 */

class AuthService {
  KAUTH_BASE = 'https://kauth.kakao.com';
  KAPI_BASE = 'https://kapi.kakao.com';

  // ----- 내부 유틸 -----
  _requireEnv(key, msg) {
    const val = import.meta.env[key];
    if (!val) {
      throw new Error(msg || `환경변수 ${key} 가 설정되어 있지 않습니다.`);
    }
    return val;
  }

  async _postForm(url, params) {
    const body = params instanceof URLSearchParams ? params.toString() : new URLSearchParams(params).toString();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    return res;
  }

  async _assertOk(res, label) {
    if (!res.ok) {
      let text = '';
      try { text = await res.text(); } catch {}
      throw new Error(`${label} 실패(${res.status}). ${text || ''}`.trim());
    }
  }

  // ----- 1) 카카오 코드 → 토큰 → 사용자 정보 (프런트에서 직접 교환) -----
  async getKakaoUserInfo(code) {
    if (!code) {
      throw new Error('인가 코드(code)가 없습니다. 콜백 URL/redirectUri를 확인해주세요.');
    }

    const REST_API_KEY = this._requireEnv(
      'VITE_KAKAO_REST_API_KEY',
      '환경변수 VITE_KAKAO_REST_API_KEY 가 필요합니다.'
    );
    
    // 현재 호스트로 리다이렉트 URI 동적 생성
    const currentOrigin = window.location.origin;
    const REDIRECT_URI = `${currentOrigin}/auth/kakao/callback`;
    
    const CLIENT_SECRET = import.meta.env.VITE_KAKAO_CLIENT_SECRET; // 선택

    console.log('🔑 토큰 교환용 리다이렉트 URI:', REDIRECT_URI);

    // 1) 코드 → 토큰 교환
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: REST_API_KEY,
      redirect_uri: REDIRECT_URI,
      code
    });
    if (CLIENT_SECRET) tokenParams.append('client_secret', CLIENT_SECRET);

    const tokenRes = await this._postForm(`${this.KAUTH_BASE}/oauth/token`, tokenParams);
    await this._assertOk(tokenRes, '토큰 교환');
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson?.access_token;
    if (!accessToken) {
      throw new Error('토큰 교환은 성공했으나 access_token이 없습니다.');
    }

    // 2) 토큰으로 사용자 정보 조회
    return await this.getKakaoUserInfoFromAccessToken(accessToken);
  }

  // ----- 2) 이미 받은 access_token 으로 사용자 정보 조회 (JS SDK 사용 시) -----
  async getKakaoUserInfoFromAccessToken(accessToken) {
    if (!accessToken) {
      throw new Error('access_token 이 없습니다.');
    }
    const meRes = await fetch(`${this.KAPI_BASE}/v2/user/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    await this._assertOk(meRes, '카카오 사용자 정보 조회');
    const data = await meRes.json();

    const id = data?.id;
    if (!id) {
      throw new Error('카카오 응답에 사용자 ID가 없습니다.');
    }

    return {
      id: String(id),
      email: data?.kakao_account?.email ?? '',
      displayName: data?.kakao_account?.profile?.nickname ?? '사용자',
      phoneNumber: data?.kakao_account?.phone_number ?? '',
      profileImage: data?.kakao_account?.profile?.profile_image_url ?? '',
      kakaoRaw: data, // 디버깅이 필요 없으면 제거하셔도 됩니다.
    };
  }

  // ----- 3) Firestore: 사용자 존재 여부 -----
  async checkUserExists(userId) {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists();
  }

  // ----- 4) Firestore: 사용자 최초 등록 -----
  async registerUser(userData) {
    // userData는 getKakaoUserInfo(...)의 반환 객체 형태를 기대합니다.
    await setDoc(doc(db, 'users', userData.id), {
      displayName: userData.displayName ?? '',
      email: userData.email ?? '',
      phoneNumber: userData.phoneNumber ?? '',
      profileImage: userData.profileImage ?? '',
      createdAt: new Date().toISOString()
    }, { merge: true });
  }

  // ----- 5) Firestore: 사용자 + spaceAccess 묶음 조회 -----
  async getUserData(userId) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;

    const accessRef = collection(db, `users/${userId}/spaceAccess`);
    const accessSnap = await getDocs(accessRef);

    const spaceAccess = [];
    accessSnap.forEach((d) => {
      const v = d.data();
      spaceAccess.push({
        spaceId: d.id,
        userType: v?.userType ?? '',
        order: v?.order ?? 0
      });
    });

    return {
      id: userId,
      ...userSnap.data(),
      spaceAccess
    };
  }

  // ----- 6) Firestore: 프로필 다건 조회 -----
  async getUserProfiles(userIds) {
    try {
      const profiles = {};
      await Promise.all(
        (userIds ?? []).map(async (uid) => {
          try {
            const s = await getDoc(doc(db, 'users', uid));
            if (s.exists()) {
              const d = s.data();
              profiles[uid] = {
                displayName: d?.displayName ?? '',
                profileImage: d?.profileImage ?? ''
              };
            }
          } catch (e) {
            console.warn(`[AuthService] 프로필 조회 실패: ${uid}`, e.message);
          }
        })
      );
      return profiles;
    } catch (error) {
      console.warn('[AuthService] getUserProfiles 전체 실패:', error.message);
      return {};
    }
  }
}

export default new AuthService();

// src/services/authService.js
import { doc, getDoc, setDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

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

  // ----- 1) 카카오 코드 → 토큰 → 사용자 정보 -----
  async getKakaoUserInfo(code) {
    if (!code) {
      throw new Error('인가 코드(code)가 없습니다. 콜백 URL/redirectUri를 확인해주세요.');
    }

    const REST_API_KEY = this._requireEnv(
      'VITE_KAKAO_REST_API_KEY',
      '환경변수 VITE_KAKAO_REST_API_KEY 가 필요합니다.'
    );
    
    const currentOrigin = window.location.origin;
    const REDIRECT_URI = `${currentOrigin}/auth/kakao/callback`;
    
    const CLIENT_SECRET = import.meta.env.VITE_KAKAO_CLIENT_SECRET;

    console.log('🔑 토큰 교환용 리다이렉트 URI:', REDIRECT_URI);

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

    return await this.getKakaoUserInfoFromAccessToken(accessToken);
  }

  // ----- 2) access_token으로 사용자 정보 조회 -----
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

    const account = data?.kakao_account || {};
    const profile = account?.profile || {};

    // ✅ 카카오 실명/기본정보
    const name = account?.name || '';
    const nickname = profile?.nickname || '';
    const gender = account?.gender || '';        // "male" | "female" (없을 수 있음)
    const birthyear = account?.birthyear || '';  // "1990" (없을 수 있음)
    const phone_number = account?.phone_number || ''; // "+82 10-1234-5678" 등

    return {
      id: String(id),
      email: account?.email ?? '',
      // ✅ displayName = 실명, nickname = 카카오닉네임
      displayName: name || nickname || '사용자',  // 실명 우선
      nickname,                                    // 카카오 닉네임 별도 보관
      gender,
      birthyear,
      phoneNumber: phone_number,
      profileImage: profile?.profile_image_url ?? '',
      kakaoRaw: data,
    };
  }

  // ----- 3) Firestore: 사용자 존재 여부 -----
  async checkUserExists(userId) {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists();
  }

  // ----- 4) Firestore: 사용자 최초 등록 (확장된 필드 지원) -----
  async registerUser(userData) {
    const userDoc = {
      id: userData.id,
      displayName: userData.displayName ?? '',  // 실명
      nickname: userData.nickname ?? '',         // ✅ 카카오 닉네임 추가
      email: userData.email ?? '',
      phoneNumber: userData.phoneNumber ?? '',
      profileImage: userData.profileImage ?? '',
      provider: userData.provider ?? 'kakao',
      createdAt: Timestamp.now()  // Firebase Timestamp 사용
    };

    // 선택적 필드들 (회원가입 폼에서 입력받은 정보)
    if (userData.birthyear) {
      userDoc.birthyear = userData.birthyear;
    }
    if (userData.gender) {
      userDoc.gender = userData.gender;
    }

    await setDoc(doc(db, 'users', userData.id), userDoc, { merge: true });
  }

  // ----- 4-1) Firestore: 사용자 프로필 정보 업데이트 (재로그인 시) -----
  async updateUserProfile(userId, profileData) {
    const updates = {};
    
    if (profileData.displayName !== undefined) {
      updates.displayName = profileData.displayName;  // 실명
    }
    if (profileData.nickname !== undefined) {  // ✅ 카카오 닉네임 업데이트 추가
      updates.nickname = profileData.nickname;
    }
    if (profileData.profileImage !== undefined) {
      updates.profileImage = profileData.profileImage;
    }
    if (profileData.birthyear !== undefined) {
      updates.birthyear = profileData.birthyear;
    }
    if (profileData.gender !== undefined) {
      updates.gender = profileData.gender;
    }
    if (profileData.phoneNumber !== undefined) {
      updates.phoneNumber = profileData.phoneNumber;
    }
    if (profileData.email !== undefined) {
      updates.email = profileData.email;
    }
    
    if (Object.keys(updates).length > 0) {
      await setDoc(doc(db, 'users', userId), updates, { merge: true });
    }
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
            // userId를 문자열로 변환 (Firebase doc()는 문자열 필요)
            const userIdStr = String(uid);
            const s = await getDoc(doc(db, 'users', userIdStr));
            if (s.exists()) {
              const d = s.data();
              profiles[userIdStr] = {
                displayName: d?.displayName ?? '',
                profileImage: d?.profileImage ?? ''
              };
            }
          } catch (e) {
            console.warn(`[AuthService] 프로필 조회 실패: ${uid}`, e.message || e);
          }
        })
      );
      return profiles;
    } catch (error) {
      console.warn('[AuthService] getUserProfiles 전체 실패:', error.message || error);
      return {};
    }
  }
}

export default new AuthService();
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

    console.log('🔑 토큰 교환용 리다이렉트 URI:', REDIRECT_URI);

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: REST_API_KEY,
      redirect_uri: REDIRECT_URI,
      code
    });

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
      realName: name || '',                        // ✅ 카카오 실명 (참고용, 변경 불가)
      kakaoNickname: nickname || '',               // 카카오 닉네임 (참고용)
      gender,
      birthyear,
      phoneNumber: phone_number,
      profileImage: profile?.profile_image_url ?? '',
      kakaoRaw: data,
    };
  }

  // ----- 3) Firestore: 사용자 존재 여부 -----
  async checkUserExists(userId) {
    // ✅ userId를 반드시 string으로 통일
    const userIdString = String(userId);
    const snap = await getDoc(doc(db, 'users', userIdString));
    return snap.exists();
  }

  // ----- 3-1) 닉네임#태그 중복 체크 -----
  async checkFullTagExists(fullTag) {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    for (const doc of snapshot.docs) {
      if (doc.data().fullTag === fullTag) {
        return true;
      }
    }
    return false;
  }

  // ----- 3-2) 사용 가능한 discriminator 생성 -----
  async generateDiscriminator(displayName) {
    const maxAttempts = 100; // 최대 100번 시도
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    // 이미 사용 중인 태그 수집
    const usedTags = new Set();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.displayName === displayName && data.displayTag) {
        usedTags.add(data.displayTag);
      }
    });

    // 0001-9999 범위에서 사용 가능한 태그 찾기
    for (let i = 0; i < maxAttempts; i++) {
      const tag = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
      if (!usedTags.has(tag)) {
        return tag;
      }
    }

    // 랜덤으로 못 찾으면 순차 검색
    for (let i = 1; i <= 9999; i++) {
      const tag = String(i).padStart(4, '0');
      if (!usedTags.has(tag)) {
        return tag;
      }
    }

    throw new Error('사용 가능한 태그가 없습니다. (별명이 너무 많이 사용되었습니다)');
  }

  // ----- 4) Firestore: 사용자 최초 등록 (확장된 필드 지원) -----
  async registerUser(userData) {
    // ✅ userId를 반드시 string으로 통일
    const userId = String(userData.id);

    // displayName과 discriminator로 fullTag 생성
    const displayName = userData.displayName || 'User';
    const displayTag = userData.displayTag || await this.generateDiscriminator(displayName);
    const fullTag = `${displayName}#${displayTag}`;

    const userDoc = {
      id: userId,  // ✅ string으로 변환된 id 저장
      displayName,                     // 사용자 지정 별명 (변경 가능!) - 메인!
      displayTag,                      // discriminator (#0001-#9999)
      fullTag,                         // unique 식별자 (displayName#1234)
      realName: userData.realName ?? '',        // 카카오 실명 (참고용, 변경 불가)
      nickname: userData.kakaoNickname ?? '',   // 카카오 닉네임 (레거시)
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

    await setDoc(doc(db, 'users', userId), userDoc, { merge: true });

    return { ...userDoc, fullTag }; // fullTag 반환
  }

  // ----- 4-0) 카카오 값 → 앱 규격 변환 -----

  // "+82 10-1234-5678" → "01012345678". 형식이 맞지 않으면 ''.
  normalizeKakaoPhone(raw) {
    if (!raw) return '';
    let digits = String(raw).replace(/[^0-9]/g, '');
    if (digits.startsWith('82')) digits = `0${digits.slice(2)}`;
    return /^01[0-9]{8,9}$/.test(digits) ? digits : '';
  }

  // 닉네임 규칙(2~12자, 한글/영문/숫자/_)에 맞게 정리. 쓸 수 없으면 fallback.
  sanitizeDisplayName(...candidates) {
    for (const c of candidates) {
      const cleaned = String(c ?? '').replace(/[^가-힣a-zA-Z0-9_]/g, '').slice(0, 12);
      if (cleaned.length >= 2) return cleaned;
    }
    return '게스트';
  }

  // ----- 4-0-1) 카카오 로그인 최초 1회: 가입 폼 없이 카카오 값으로 자동 가입 -----
  async registerFromKakao(kakaoUserInfo) {
    const displayName = this.sanitizeDisplayName(
      kakaoUserInfo.kakaoNickname,
      kakaoUserInfo.realName
    );

    return this.registerUser({
      id: kakaoUserInfo.id,
      displayName,
      realName: kakaoUserInfo.realName || '',
      kakaoNickname: kakaoUserInfo.kakaoNickname || '',
      profileImage: kakaoUserInfo.profileImage || '',
      email: kakaoUserInfo.email || '',
      provider: 'kakao',
      birthyear: kakaoUserInfo.birthyear || '',
      gender: kakaoUserInfo.gender || '',
      phoneNumber: this.normalizeKakaoPhone(kakaoUserInfo.phoneNumber)
    });
  }

  // ----- 4-0-2) 닉네임#태그가 없는 기존 사용자: 기존 값을 살려 자동 부여 -----
  async assignFullTagToExistingUser(userId, userData, kakaoUserInfo) {
    const displayName = this.sanitizeDisplayName(
      userData.displayName,
      userData.nickname,
      kakaoUserInfo.kakaoNickname,
      userData.realName
    );
    const displayTag = await this.generateDiscriminator(displayName);
    const fullTag = `${displayName}#${displayTag}`;

    await this.updateUserProfile(userId, { displayName, displayTag, fullTag });
    return { displayName, displayTag, fullTag };
  }

  // ----- 4-1) Firestore: 사용자 프로필 정보 업데이트 (재로그인 시) -----
  async updateUserProfile(userId, profileData) {
    // ✅ userId를 반드시 string으로 통일
    const userIdString = String(userId);

    const updates = {};

    if (profileData.displayName !== undefined) {
      updates.displayName = profileData.displayName;  // 사용자 지정 별명 (변경 가능)
    }
    if (profileData.displayTag !== undefined) {
      updates.displayTag = profileData.displayTag;  // discriminator
    }
    if (profileData.fullTag !== undefined) {
      updates.fullTag = profileData.fullTag;  // displayName#1234
    }
    if (profileData.realName !== undefined) {
      updates.realName = profileData.realName;  // 카카오 실명 (참고용)
    }
    if (profileData.nickname !== undefined) {
      updates.nickname = profileData.nickname;  // 카카오 닉네임 (레거시)
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
      await setDoc(doc(db, 'users', userIdString), updates, { merge: true });
    }
  }

  // ----- 5) Firestore: 사용자 + spaceAccess 묶음 조회 -----
  async getUserData(userId) {
    // ✅ userId를 반드시 string으로 통일
    const userIdString = String(userId);

    const userRef = doc(db, 'users', userIdString);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;

    const accessRef = collection(db, `users/${userIdString}/spaceAccess`);
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
      id: userIdString,  // ✅ string으로 변환된 id 반환
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
                profileImage: d?.profileImage ?? '',
                gender: d?.gender ?? ''
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

  // ----- 7) Firestore: 스페이스 멤버 목록 조회 -----
  async getSpaceMembers(spaceId) {
    try {
      console.log('📋 [AuthService] 스페이스 멤버 조회:', spaceId);

      const assignedUsersRef = collection(db, `spaces/${spaceId}/assignedUsers`);
      const snapshot = await getDocs(assignedUsersRef);

      const memberList = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        memberList.push({
          userId: docSnap.id,
          displayName: data.displayName || '이름 없음',
          email: data.email || '',
          userType: data.userType || 'guest',
          profileImage: data.profileImage || '',
          joinedAt: data.joinedAt,
          status: data.status || 'active'
        });
      });

      console.log('✅ [AuthService] 멤버 조회 완료:', memberList.length, '명');
      return memberList;
    } catch (error) {
      console.error('❌ [AuthService] getSpaceMembers 실패:', error);
      return [];
    }
  }
}

export default new AuthService();
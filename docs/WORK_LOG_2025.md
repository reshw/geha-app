# 작업 로그 2025

## 2025-02-21: 사용자 스키마 개편 - displayName 시스템

### 🎯 목표
카카오 로그인 기반 실명제에서 **Blizzard/Riot 스타일 닉네임#태그 시스템**으로 전환
- 사용자 지정 별명(displayName) + 4자리 태그(discriminator)
- 중복 닉네임 허용
- 카카오 실명은 참고용으로만 저장

### ✅ 완료된 작업

#### 1. 스키마 재설계
**기존 구조:**
```javascript
{
  nickname: "카카오닉네임",      // 카카오에서 받아온 값
  displayName: "실명",           // 카카오 실명
}
```

**신규 구조:**
```javascript
{
  displayName: "나유",           // 사용자 지정 별명 (메인, 변경 가능!) ⭐
  displayTag: "3196",           // discriminator (#0001-#9999)
  fullTag: "나유#3196",          // 유니크 식별자
  realName: "홍길동",            // 카카오 실명 (참고용, 변경 불가)
  kakaoNickname: "길동이",       // 카카오 닉네임 (레거시)
}
```

#### 2. authService.js 수정
**파일:** `src/services/authService.js`

**추가된 메서드:**
- `generateDiscriminator(displayName)` - 랜덤 4자리 태그 생성 (충돌 회피)
- `checkFullTagExists(fullTag)` - fullTag 중복 체크

**수정된 메서드:**
- `getKakaoUserInfoFromAccessToken()`:
  ```javascript
  return {
    id: String(id),
    realName: name || '',              // 카카오 실명
    kakaoNickname: nickname || '',     // 카카오 닉네임
    gender, birthyear, phoneNumber,
    // ...
  };
  ```

- `registerUser(userData)`:
  ```javascript
  const userDoc = {
    displayName,              // 사용자 지정 별명 (메인!)
    displayTag,               // #0001-#9999
    fullTag,                  // displayName#1234
    realName: userData.realName ?? '',
    nickname: userData.kakaoNickname ?? '',
    // ...
  };
  ```

- `updateUserProfile()`: displayName, displayTag, fullTag, realName 업데이트 지원

#### 3. SignupPage.jsx 수정
**파일:** `src/pages/SignupPage.jsx`

**변경 사항:**
- 모든 `nickname` → `displayName`으로 변경
- `nicknamePreview` → `displayNamePreview`
- handleSubmit 수정:
  ```javascript
  const fullUserData = {
    id: kakaoUserInfo.id,
    displayName: formData.displayName.trim(),  // 사용자 지정 별명
    realName: kakaoUserInfo.realName || '',    // 카카오 실명
    kakaoNickname: kakaoUserInfo.kakaoNickname || '',
    // ...
  };
  ```

#### 4. ProfilePage.jsx 수정
**파일:** `src/pages/ProfilePage.jsx`

**변경 사항:**
- 전체적으로 `nickname` → `displayName` 변환
- 닉네임 변경 시 새 태그 생성:
  ```javascript
  if (isChangingNickname && formData.displayName !== user.displayName) {
    const displayTag = await authService.generateDiscriminator(formData.displayName);
    const fullTag = `${formData.displayName}#${displayTag}`;
    updateData.displayName = formData.displayName;
    updateData.displayTag = displayTag;
    updateData.fullTag = fullTag;
  }
  ```

#### 5. KakaoCallback.jsx 수정
**파일:** `src/components/auth/KakaoCallback.jsx`

**핵심 수정:**
- 재로그인 시 사용자 지정 displayName 보호 (덮어쓰기 방지!)
- 카카오 데이터는 realName, kakaoNickname만 업데이트:
  ```javascript
  await authService.updateUserProfile(userInfo.id, {
    realName: userInfo.realName || '',
    kakaoNickname: userInfo.kakaoNickname || '',
    profileImage: userInfo.profileImage,
    email: userInfo.email || ''
    // displayName은 보호! 사용자가 변경했을 수 있음
  });
  ```

- 기존 유저 마이그레이션 로직 유지 (fullTag 없으면 회원가입 페이지로)

#### 6. 기타 컴포넌트 검증
**검증 완료:**
- `GlobalHeader.jsx` - ✅ `user.displayName` 사용 중
- `TierNameEditor.jsx` - ✅ `user.displayName || user.name`
- `PermissionMatrixEditor.jsx` - ✅ `user.displayName || user.name`
- `CarpoolCreatePage.jsx` - ✅ `user.displayName`
- 정산/지출/바텐더 페이지들 - ✅ 모두 `user.displayName` 사용

**주의사항:**
- `PraiseCard.jsx`, `praiseService.js`의 `nickname` 필드는 **건드리지 않음**
- 이유: 주간 익명 닉네임 시스템 ("빨간늑대" 등)과 별개 필드임

### 📋 마이그레이션 시나리오

1. **신규 사용자:**
   - 카카오 로그인 → 회원가입 페이지
   - displayName 입력 → 자동 태그 생성 → fullTag 저장

2. **기존 사용자 (fullTag 없음):**
   - 카카오 로그인 → fullTag 체크
   - fullTag 없으면 → 회원가입 페이지 (isMigration: true)
   - 기존 프로필 정보 유지하면서 displayName만 설정

3. **기존 사용자 (fullTag 있음):**
   - 정상 로그인
   - realName, kakaoNickname만 업데이트
   - displayName, birthyear, gender, phoneNumber 보호

### 🔍 테스트 필요 사항

- [ ] 신규 회원가입 플로우 테스트
- [ ] 기존 유저 마이그레이션 테스트
- [ ] 프로필 수정 (displayName 변경) 테스트
- [ ] 재로그인 시 displayName 보존 확인
- [ ] fullTag 중복 체크 동작 확인
- [ ] 태그 생성 로직 (랜덤 → 순차 fallback) 테스트

### 🐛 알려진 이슈
없음 (현재까지)

### 📝 다음 작업 예정
- [ ] 실제 테스트 환경에서 회원가입/로그인 테스트
- [ ] displayName 검색 기능 필요 시 구현
- [ ] fullTag 표시 UI 개선 필요 여부 검토
- [ ] 기존 사용자 대량 마이그레이션 스크립트 (필요시)

### 💡 참고사항

**주요 파일 위치:**
- 인증 서비스: `src/services/authService.js`
- 회원가입: `src/pages/SignupPage.jsx`
- 프로필 수정: `src/pages/ProfilePage.jsx`
- 카카오 콜백: `src/components/auth/KakaoCallback.jsx`

**Firestore 컬렉션:**
- `users/{userId}` - 사용자 정보 (displayName, fullTag 등)
- `users/{userId}/spaceAccess/{spaceId}` - 스페이스 접근 권한

**로컬 스토리지:**
- `userData` - 로그인 정보 캐시

---
*작업 완료: 2025-02-21 (금) 밤*
*다음 세션에서 테스트 및 검증 필요*

---

## 2025-02-22: Reserve displayName 동적 연동 계획 수립

### 🎯 문제 정의
- **현재 상황**: reserves 컬렉션에 `name` 필드 스냅샷 저장
- **문제점**: 사용자가 displayName 변경 시 과거 예약에 반영 안 됨
- **추가 문제**: DB만 보면 userId만 보여서 CS 작업 어려움

### ✅ 계획 수립 완료

**계획 파일**: `C:\Users\seoka\.claude\plans\shimmying-bouncing-russell.md`

**핵심 결정사항**:
1. ✅ **displayName 동적 연동** - 프로필에서 실시간 조회
2. ✅ **type 필드는 스냅샷 유지** - 당시 등급(guest/shareholder/manager) 기록
3. ✅ **추가 비용 없음** - 이미 프로필 배치 로드 중
4. ✅ **슈퍼어드민 CS 페이지 추가** - DB 직접 보기 대신 UI 제공

### 📋 구현 계획 (5 Phases)

#### Phase 1-2: displayName 동적 연동 (3-4일)
- 8개 컴포넌트 표시 로직 변경
- 예약 생성 시 name 필드 제거
- 프로필 우선, name fallback 패턴 적용

#### Phase 3-4: 탈퇴 유저 처리 (1일)
- 탈퇴 시 예약에 최종 name 스냅샷
- fallback 메시지 처리

#### Phase 5: 슈퍼어드민 CS 페이지 (2-3일)
- SuperAdminPage에 "예약 관리" 탭 추가
- 모든 스페이스 예약 조회/검색/수정/취소
- userId → displayName 자동 변환
- 통계 요약 대시보드

### 🚀 내일 작업 시작 방법

**명령어**:
```
C:\Users\seoka\.claude\plans\shimmying-bouncing-russell.md 읽고 Phase 1부터 시작해줘
```

또는:
```
예약 displayName 동적 연동 작업 시작. 계획 파일 읽고 Phase 1부터 구현해.
```

### 📁 주요 파일 위치

**계획 파일**:
- `C:\Users\seoka\.claude\plans\shimmying-bouncing-russell.md` (상세 구현 계획)

**작업 대상** (Phase 1-2):
- `src/components/reservations/WeeklyList.jsx`
- `src/components/reservations/ReservationDetailModal.jsx`
- `src/components/reservations/ReservationManageModal.jsx`
- `src/components/reservations/ReservationEditModal.jsx`
- `src/services/reservationService.js`

**신규 생성** (Phase 5):
- `src/services/reserveAdminService.js`
- `src/components/admin/ReserveManagementTab.jsx`
- `src/components/admin/ReserveDetailModal.jsx`
- `src/components/admin/ReserveEditModal.jsx`
- `src/components/admin/ReserveCancelModal.jsx`

---
*계획 수립: 2025-02-21 (금) 밤*
*예상 소요: 5-8일*
*다음 세션: Phase 1 구현 시작*

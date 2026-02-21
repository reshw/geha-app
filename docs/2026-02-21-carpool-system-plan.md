# 카풀 시스템 구현 계획

**작성일**: 2026-02-21
**타입**: 기능 추가 (슈퍼앱 전환)
**우선순위**: 높음

---

## 📋 목차

- [개요](#개요)
- [배경 및 목표](#배경-및-목표)
- [기술 설계](#기술-설계)
- [구현 단계](#구현-단계)
- [데이터 구조](#데이터-구조)
- [UI/UX 설계](#uiux-설계)
- [테스트 계획](#테스트-계획)
- [롤백 계획](#롤백-계획)

---

## 개요

loungeap 프로젝트를 **단일 기능(시즌방 geha)**에서 **멀티앱 슈퍼앱**으로 확장합니다.

### 핵심 변경사항
1. **앱 전환 시스템**: "시즌방" ↔ "카풀" 앱 전환 메뉴 추가
2. **카풀 매칭 시스템**: 스키장 카풀 제공/요청 등록 및 매칭
3. **확장 가능한 구조**: 향후 다른 앱(장비 관리, 중고 거래 등) 추가 용이

---

## 배경 및 목표

### 문제 인식

**현재 상황:**
- 1,500명 규모의 카카오톡 카풀방 운영
- 텍스트 도배로 정보 찾기 어려움
- 노쇼 리스크 및 신뢰 문제
- 정보 휘발 (과거 이력 추적 불가)

**목표:**
- 구조화된 카풀 정보 제공 (날짜/장소/장비 필터링)
- geha 평판 시스템을 활용한 신뢰도 표시
- 카카오톡 오픈프로필 연동 (직거래 존중)
- 모든 보더가 공유하는 광역 카풀 시장 구축

### 슬로건
> "보더에 의한, 보더를 위한 스노우 문화 지원 앱"

### 핵심 철학
- **수익 창출 목적 없음**: 결제 기능 없이 매칭만 지원
- **신뢰 기반 운영**: geha 칭찬 시스템을 카풀에도 활용
- **직거래 존중**: 앱은 브릿지 역할만 (카카오톡으로 연결)

---

## 기술 설계

### Phase 1: 앱 전환 인프라

#### 1.1 Zustand Store 확장

**파일**: `src/store/useStore.js`

**추가 상태:**
```javascript
{
  // 앱 관리
  currentApp: 'geha', // 'geha' | 'carpool'
  setCurrentApp: (appId) => { ... },

  // 카풀 관련
  selectedResort: null,
  resorts: [],
  setResorts: (resorts) => { ... },
  setSelectedResort: (resort) => { ... }
}
```

#### 1.2 앱 정의 파일

**신규 파일**: `src/config/apps.js`

```javascript
import { Home, Car } from 'lucide-react';

export const AVAILABLE_APPS = {
  geha: {
    id: 'geha',
    name: '시즌방',
    icon: Home,
    description: '스키장 시즌권 공유 관리',
    contextType: 'space'
  },
  carpool: {
    id: 'carpool',
    name: '카풀',
    icon: Car,
    description: '스키장 카풀 매칭',
    contextType: 'resort'
  }
};
```

#### 1.3 AppSwitcher 컴포넌트

**신규 파일**: `src/components/common/AppSwitcher.jsx`

**기능:**
- 현재 앱 아이콘 + 이름 표시
- 클릭 시 드롭다운 메뉴 (세로 배치)
- 앱 선택 시 상태 변경 + localStorage 저장

**참고 패턴**: `SpaceDropdown.jsx`

#### 1.4 GlobalHeader 개선

**파일**: `src/components/common/GlobalHeader.jsx`

**변경:**
```jsx
<div className="flex items-center gap-3">
  <AppSwitcher currentApp={currentApp} onSwitch={handleAppSwitch} />
  {currentApp === 'geha' ? (
    <SpaceDropdown ... />
  ) : (
    <ResortDropdown ... />
  )}
</div>
```

### Phase 2: 카풀 데이터 레이어

#### 2.1 Firestore 컬렉션

**새 컬렉션**: `/carpool_posts/{postId}`

```javascript
{
  type: 'offer' | 'request',
  resortId: 'phoenix' | 'vivaldi',
  resortName: string,
  departureDate: Timestamp,
  departureTime: string, // 'HH:MM'
  departureLocation: string,
  destination: string,
  direction: 'toResort' | 'fromResort' | 'roundTrip',
  cost: number,
  hasEquipment: boolean,
  kakaoId: string, // 오픈프로필 URL
  memo: string,
  status: 'recruiting' | 'waiting_payment' | 'confirmed' | 'completed' | 'canceled',
  userId: string,
  userName: string,
  userProfileImage: string,
  gehaReputation: { totalPraises: number },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**새 컬렉션**: `/carpool_resorts/{resortId}`

```javascript
{
  id: 'phoenix',
  name: '휘닉스파크',
  distance: 150, // km
  recommendedCost: 15000, // 원
  popularDepartures: ['강남', '잠실', '홍대'],
  active: true,
  order: number
}
```

**초기 데이터:**
- 휘닉스파크 (phoenix)
- 대명비발디 (vivaldi)

#### 2.2 서비스 레이어

**신규 파일**: `src/services/carpoolService.js`

**주요 메서드:**
- `getCarpoolPosts(resortId, filters)` - 필터링 조회
- `createCarpoolPost(postData)` - 포스트 생성
- `updateCarpoolPost(postId, updates)` - 수정
- `cancelCarpoolPost(postId, userId)` - 취소
- `getMyCarpoolPosts(userId)` - 내 포스트
- `enrichWithReputation(posts)` - geha 평판 추가

**패턴 참고**: `reservationService.js`

**신규 파일**: `src/services/resortService.js`

**주요 메서드:**
- `getUserResorts(userId)` - 사용자 스키장 목록
- `updateResortOrder(userId, resorts)` - 순서 변경
- `addResortToUser(userId, resortId)` - 스키장 추가
- `getAllResorts()` - 전체 스키장

**패턴 참고**: `spaceService.js`

#### 2.3 보안 규칙

**파일**: `firestore.rules`

```javascript
match /carpool_posts/{postId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated()
                && request.resource.data.userId == request.auth.uid;
  allow update: if resource.data.userId == request.auth.uid;
  allow delete: if false; // Soft Delete 권장
}

match /carpool_resorts/{resortId} {
  allow read: if true;
  allow write: if isSuperAdmin();
}

match /users/{userId}/resortAccess/{resortId} {
  allow read, write: if isUser(userId);
}
```

### Phase 3: 카풀 UI 기본 구현

#### 3.1 ResortDropdown

**신규 파일**: `src/components/carpool/ResortDropdown.jsx`

**기능:**
- `SpaceDropdown.jsx`와 동일한 구조
- 드래그&드롭 순서 변경
- 스키장 추가 버튼

#### 3.2 CarpoolListPage

**신규 파일**: `src/pages/CarpoolListPage.jsx`

**구조:**
```jsx
- CarpoolFilters (끈끈이 상단 고정)
- CarpoolCard 목록 (space-y-4)
- FloatingButton (+ 카풀 등록)
- CarpoolCreateModal
- CarpoolDetailModal
```

**참고**: `WeeklyList.jsx`

#### 3.3 CarpoolCard

**신규 파일**: `src/components/carpool/CarpoolCard.jsx`

**디자인:**
```
┌────────────────────────────────────┐
│ [제공/요청 배지]      [상태 배지]    │
│                                    │
│ 📅 2026-02-25  07:00              │
│ 📍 강남 → 휘닉스파크              │
│ 💰 15,000원                        │
│ 📦 장비 가능                       │
│                                    │
│ ─────────────────────────────────  │
│ 👤 홍길동   칭찬 15회   [상세보기] │
└────────────────────────────────────┘
```

**색상:**
- 제공: 초록색 테두리
- 요청: 파란색 테두리

#### 3.4 CarpoolCreateModal

**신규 파일**: `src/components/carpool/CarpoolCreateModal.jsx`

**폼 필드:**
1. 타입 (제공/요청) - 라디오 버튼
2. 날짜 - date picker
3. 시간 - time picker
4. 출발지 - 프리셋 버튼 + 직접입력
5. 방향 - 가는 길/오는 길/왕복
6. 비용 - 숫자 입력
7. 장비 - 체크박스
8. 카톡ID - URL 입력 (필수)
9. 메모 - textarea (선택)

**참고**: `ReservationModal.jsx`

### Phase 4: 필터링 + 상세 기능

#### 4.1 CarpoolFilters

**신규 파일**: `src/components/carpool/CarpoolFilters.jsx`

**필터:**
- 타입 (전체/제공/요청)
- 날짜
- 출발지
- 장비 여부

**스타일**: sticky top-0

#### 4.2 CarpoolDetailModal

**신규 파일**: `src/components/carpool/CarpoolDetailModal.jsx`

**기능:**
- 포스트 전체 정보
- 카카오톡 연결 버튼
- geha 평판 (칭찬 횟수)
- 수정/취소 (본인만)

#### 4.3 geha 평판 연동

```javascript
// carpoolService.js
async enrichWithReputation(posts) {
  const userIds = [...new Set(posts.map(p => p.userId))];
  const reputations = await Promise.all(
    userIds.map(async userId => {
      const praises = await praiseService.getUserPraises(userId);
      return { userId, totalPraises: praises.length };
    })
  );

  return posts.map(post => ({
    ...post,
    gehaReputation: reputations.find(r => r.userId === post.userId)
  }));
}
```

### Phase 5: 최적화 (선택)

- Zustand 캐싱 (30초 TTL)
- 실시간 업데이트 (Firestore onSnapshot)
- 비용 가이드 자동 계산
- 통계 페이지

---

## 구현 단계

### Phase 1: 앱 전환 인프라 (1-2일) ✅ 완료
- [x] Zustand 확장
- [x] apps.js 생성
- [x] AppSwitcher 컴포넌트
- [x] GlobalHeader 개선
- [x] UI 간결화 (아이콘 버튼)
- [x] 테스트: 앱 전환 동작 확인

### Phase 2: 카풀 데이터 레이어 (2-3일) ✅ 완료
- [x] Firestore 컬렉션 설계
- [x] 초기 데이터 생성 스크립트
- [x] ResortService 개발
- [x] CarpoolService 개발
- [x] 보안 규칙 추가
- [x] 초기 스키장 데이터 생성 (node 스크립트 실행)

### Phase 3: 카풀 UI 기본 (3-4일)
- [ ] ResortDropdown
- [ ] CarpoolListPage
- [ ] CarpoolCard
- [ ] CarpoolCreateModal
- [ ] 라우팅 통합
- [ ] 테스트: 등록/조회 확인

### Phase 4: 필터링 + 상세 (2-3일)
- [ ] CarpoolFilters
- [ ] CarpoolDetailModal
- [ ] geha 평판 연동
- [ ] 테스트: 필터링 정확성

### Phase 5: 최적화 (2-3일, 선택)
- [ ] 캐싱 시스템
- [ ] 비용 가이드
- [ ] 통계 페이지

**총 예상 기간**: 10-15일

---

## 데이터 구조

### Firestore 인덱스

**필수 복합 인덱스:**
```
Collection: carpool_posts
- resortId ASC, departureDate ASC, status ASC
- userId ASC, createdAt DESC
- status ASC, departureDate ASC
```

### 사용자 스키장 관리

**양방향 관리 (geha의 spaceAccess 패턴 재사용):**

```
/users/{userId}/resortAccess/{resortId}
  - resortId, resortName
  - order (드롭다운 순서)
  - lastVisited, favorited
  - status: 'active'
```

**초기 설정:**
- 최초 카풀 앱 진입 시 샘플 스키장 2개 자동 추가
- 사용자가 직접 추가/제거/순서 변경 가능

---

## UI/UX 설계

### 카풀 양식 참고

**카풀 제공:**
```
1. 출발날짜: 11/27 (금)
2. 출발시간: 오전 7시 00분
3. 출발장소: 서울(강남) → 휘팍
4. 카풀비용: 편도 1.5만원
5. 장비가능: 가능
6. 카톡ID: [오픈프로필 링크]
```

**카풀 요청:**
```
1. 출발요청날짜: 11/27 (금)
2. 출발요청시간: 오전 7시 00분
3. 출발요청장소: 서울(강남) → 휘팍
4. 카풀비용: 편도 1.5만원
5. 장비유무: 장비 + 가방
6. 카톡ID: [오픈프로필 링크]
```

### 비용 가이드

**기준:**
- 서울 기준: 편도 1.5만원 (약 150km)
- 10km당 1천원
- 톨게이트 비용 제외

**예시:**
- 부산 → 휘닉스파크: 380km = 38,000원
- 대전 → 휘닉스파크: 200km = 20,000원

### 상태 관리

**카풀 진행 상태:**
1. `recruiting` - 모집 중
2. `waiting_payment` - 입금 대기
3. `confirmed` - 확정
4. `completed` - 완료
5. `canceled` - 취소

---

## 테스트 계획

### 기능 테스트

**Phase 1:**
- [x] 앱 전환 후 새로고침 → 마지막 앱 복원
- [x] 기존 geha 기능 무결성

**Phase 2:**
- [ ] Firestore CRUD 동작
- [ ] 보안 규칙 검증
- [ ] 필터링 정확성

**Phase 3:**
- [ ] 카풀 등록/조회
- [ ] 모달 동작
- [ ] 반응형 UI

**Phase 4:**
- [ ] 필터 조합 테스트
- [ ] 평판 정보 표시
- [ ] 상태 변경

### 성능 테스트

- [ ] Firestore 쿼리 속도
- [ ] 리렌더링 최적화
- [ ] 번들 사이즈

### 보안 테스트

- [ ] Firestore Rules Simulator
- [ ] 다른 사용자 데이터 접근 차단 확인
- [ ] 권한 없는 작업 차단 확인

---

## 롤백 계획

### 기능 플래그

```javascript
// config/apps.js
export const AVAILABLE_APPS = {
  carpool: {
    ...
    enabled: false, // false로 설정 시 앱 숨김
  }
};
```

### 데이터 격리

- 카풀 데이터는 별도 컬렉션
- geha 기능에 영향 없음
- 롤백 시 `carpool_posts`, `carpool_resorts`만 비활성화

### 점진적 롤아웃

1. 슈퍼어드민만 테스트
2. 특정 스페이스 사용자 활성화
3. 전체 사용자 오픈

---

## 참고 자료

### 휘닉스파크 카풀방 공지 (원본)

```
<카풀요청>
1.출발요청날짜: 11/27 (금)
2.출발요청시간: 오전 7시 00분
3.출발요청장소: 서울(강남)->휘팍 or 휘팍 -> 서울(강남)
4.카풀비용: 편도 0만원
5.장비유무: 장비 or 장비 + 가방
6.카톡ID :

<카풀 비용 가이드>
서울시청기준 : 편도 1.5만원 (약 150km)
각 도시의 시청 기준으로 하여 10km당 1천원씩 요금 산정

<노쇼 방지>
1. 카풀비 사전입금
2. 1일전 취소: 전액 환불
3. 당일 취소: 50% 환불
4. 출발 1시간 내 취소: 미환불
5. 제공자 노쇼: 위약금(카풀 비용) 부과
```

---

## 신규 파일 목록

### 설정
- `src/config/apps.js`

### 서비스
- `src/services/carpoolService.js`
- `src/services/resortService.js`

### 컴포넌트
- `src/components/common/AppSwitcher.jsx`
- `src/components/carpool/ResortDropdown.jsx`
- `src/components/carpool/CarpoolCard.jsx`
- `src/components/carpool/CarpoolCreateModal.jsx`
- `src/components/carpool/CarpoolDetailModal.jsx`
- `src/components/carpool/CarpoolFilters.jsx`

### 페이지
- `src/pages/CarpoolListPage.jsx`

### 스크립트
- `scripts/initCarpoolResorts.js`

---

**작성자**: Claude Sonnet 4.5
**검토자**: -
**승인일**: -

**관련 문서**: [기술 현황](./TECH_OVERVIEW.md)

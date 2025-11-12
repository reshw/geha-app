# 게하 앱 디자인 업데이트 가이드

## 📦 수정된 파일 (5개)
1. `index.html` - Pretendard 폰트 추가, viewport-fit
2. `src/index.css` - 다크모드 CSS 변수, Pretendard 폰트
3. `src/services/reservationService.js` - 3주 범위 쿼리
4. `src/hooks/useReservations.js` - currentWeekStart 파라미터
5. `src/components/reservations/WeeklyList.jsx` - 새로운 디자인 적용

## 🎨 주요 디자인 개선사항

### 1. Pretendard 폰트
- 한글 최적화 폰트 적용
- CDN으로 빠른 로딩

### 2. 다크모드 지원
- CSS 변수로 라이트/다크 자동 전환
- 시스템 설정 자동 감지

```css
/* 다크 모드 (기본) */
--bg: #0b0f14
--surface: #10151f
--text: #eef2ff

/* 라이트 모드 */
--bg: #f6f8fb
--surface: #ffffff
--text: #0b1020
```

### 3. details/summary 카드
- 접고 펼치는 인터랙션
- 오늘 날짜는 기본으로 열림
- 부드러운 애니메이션

### 4. Sticky 헤더
- blur 효과 (backdrop-filter)
- 반투명 배경
- 스크롤해도 상단 고정

### 5. 플로팅 버튼
- 우측 하단 고정
- 그림자 효과
- Safe-area 지원 (아이폰 노치 대응)

### 6. 주간 네비게이션
- 칩 스타일 버튼
- 날짜 범위 표시 (2025.11.10 ~ 11.16)
- 한 줄 배치, 작은 화면에서 wrap

### 7. 예약 상태 배지
- "예약 없음" (회색)
- "여유" (초록색, 0-2명)
- "예약 많음" (주황색, 3명 이상)

### 8. Safe-area 지원
- iOS 노치/다이나믹 아일랜드 대응
- env(safe-area-inset-*) 활용

## 🚀 Git 커밋 방법

```bash
# 1. 프로젝트 폴더로 이동
cd "C:\Users\seoka\OneDrive\web\251106 geha1806"

# 2. 수정된 5개 파일 복사
# - index.html
# - src/index.css
# - src/services/reservationService.js
# - src/hooks/useReservations.js
# - src/components/reservations/WeeklyList.jsx

# 3. Git 커밋
git add index.html src/index.css src/services/reservationService.js src/hooks/useReservations.js src/components/reservations/WeeklyList.jsx
git commit -m "디자인 개선: 다크모드, Pretendard 폰트, details 카드 UI"
git push

# 4. Netlify 자동 배포 확인 (1~2분)
```

## 🎯 테스트 확인사항
1. ✅ 다크모드 / 라이트모드 자동 전환
2. ✅ Pretendard 폰트 적용
3. ✅ details 카드 접기/펼치기
4. ✅ 오늘 날짜 기본 열림
5. ✅ Sticky 헤더 스크롤시 고정
6. ✅ 플로팅 버튼 우측 하단
7. ✅ 3주 범위만 로딩 (성능 개선)
8. ✅ Safe-area 적용 (iOS)

## 📱 모바일 최적화
- max-width: 720px
- 터치 친화적 버튼 크기
- 부드러운 스크롤
- 아이폰 노치 대응

## 🎨 색상 시스템
```
Brand: #2563eb (파란색)
Success: #16a34a (초록색)
Warning: #d97706 (주황색)
Muted: #97a3b6 (회색)
Radius: 14px (둥근 모서리)
```

## 💡 다음 개선 사항
- [ ] 스켈레톤 로딩
- [ ] 에러 바운더리
- [ ] 오프라인 지원
- [ ] PWA 설정

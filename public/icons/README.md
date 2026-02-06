# PWA 아이콘

## ⚠️ 임시 아이콘 사용 중

현재 모든 아이콘은 `vite.svg`를 복사한 임시 파일입니다.
실제 배포 전에 아래 크기의 PNG 아이콘으로 교체해야 합니다.

## 필요한 아이콘 크기

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png (Android)
- icon-384x384.png
- icon-512x512.png (Android)
- apple-touch-icon.png (180x180, iOS)

## 아이콘 생성 방법

### 옵션 1: 온라인 도구 사용
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### 옵션 2: 로고 파일 제공
로고 이미지(최소 512x512 PNG)를 제공하면 자동으로 모든 크기 생성 가능합니다.

## 아이콘 디자인 가이드

- **배경**: 단색 배경 권장 (투명 배경은 일부 플랫폼에서 검은색으로 표시됨)
- **여백**: 아이콘 주변에 10-20% 여백 권장
- **형식**: PNG (투명도 지원)
- **색상**: manifest.json의 theme_color (#3b82f6)와 조화

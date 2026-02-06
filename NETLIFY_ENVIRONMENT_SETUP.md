# Netlify UI 환경 변수 설정

## 필수 설정

Netlify Dashboard → Site Settings → Environment Variables 에서 다음만 설정하세요.

### Build 섹션 (전역)
```
NODE_VERSION=18
```

### 함수별 설정

#### send-email
```
RESEND_API_KEY=[API_KEY]
```

#### send-alimtalk
```
NHN_API_URL=https://api-alimtalk.cloud.toast.com
NHN_APPKEY=[APPKEY]
NHN_SECRET_KEY=[SECRET_KEY]
NHN_SENDER_KEY=[SENDER_KEY]
NHN_PLUS_FRIEND_ID=@jh308
NHN_TEMPLATE_GUEST_CONFIRM=JH8636
```

#### send-alimtalk-proxy
```
NHN_API_URL=https://api-alimtalk.cloud.toast.com
NHN_APPKEY=[APPKEY]
NHN_SECRET_KEY=[SECRET_KEY]
NHN_SENDER_KEY=[SENDER_KEY]
```

#### process-praise
```
OPENAI_API_KEY=[API_KEY]
```

#### send-praise-notification
```
RESEND_API_KEY=[API_KEY]
```

#### send-notification
```
RESEND_API_KEY=[API_KEY]
```

#### send-push-notification
```
(환경 변수 설정 안 함 - Firebase는 파일에서 읽음)
```

## 주의사항

- ⚠️ 이 환경 변수들은 빌드 타임에 config.json으로 변환됨
- ⚠️ config.json은 .gitignore에 있어서 GitHub에 올라가지 않음
- ⚠️ API 키는 Netlify의 보안 저장소에만 저장됨
- ⚠️ 함수 실행 시 config.json에서 읽음 (환경 변수로 전달 안 함)

## 결과

- ✅ 각 함수의 환경 변수 크기 < 1KB (4KB 제한 해결)
- ✅ GitHub에 민감 정보 안 올라감
- ✅ 웹에 API 키 노출 안 됨
- ✅ 확장 가능한 구조

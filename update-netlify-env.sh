#!/bin/bash

# Netlify 환경변수 업데이트 스크립트
# 사용법: ./update-netlify-env.sh

echo "🔄 Netlify 환경변수 업데이트 중..."

# 카카오 REST API 키 업데이트
netlify env:set VITE_KAKAO_REST_API_KEY "fb4c3570627bc4d6ec959a2333bbe80d"

echo "✅ 환경변수 업데이트 완료!"
echo ""
echo "📝 다음 단계:"
echo "1. Netlify 대시보드에서 확인: https://app.netlify.com"
echo "2. 사이트 재배포: netlify deploy --prod"

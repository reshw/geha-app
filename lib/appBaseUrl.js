// 서버리스 함수에서 앱 자신의 공개 URL이 필요할 때 사용.
// 우선순위: APP_BASE_URL(수동 지정, 커스텀 도메인 권장) → Vercel 프로덕션 도메인 → Vercel 배포 URL
export function getAppBaseUrl() {
  const explicit = process.env.APP_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, '');

  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (host) return `https://${host}`;

  throw new Error('APP_BASE_URL 환경변수가 설정되지 않았습니다.');
}

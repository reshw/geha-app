// utils/nicknameUtils.js

/**
 * 주차별 일관된 랜덤 닉네임 생성
 * 같은 주에는 항상 같은 닉네임, 다음 주가 되면 자동으로 변경
 */
export function getWeeklyNickname(userId) {
  if (!userId) return '👻익명';

  const animals = [
    '🐰토끼', '🦊여우', '🐻곰', '🐼팬더', '🐯호랑이',
    '🐶강아지', '🐱고양이', '🐹햄스터', '🦁사자', '🐸개구리',
    '🐵원숭이', '🐨코알라', '🦝너구리', '🐺늑대', '🦔고슴도치'
  ];

  // 현재 연도와 주차 계산
  const today = new Date();
  const year = today.getFullYear();
  const weekNumber = getWeekNumber(today);

  // userId + 연도 + 주차를 조합해서 해시 생성
  const seed = `${userId}_${year}_${weekNumber}`;
  const hashValue = simpleHash(seed);

  // 동물과 번호 선택
  const animalIndex = hashValue % animals.length;
  const number = hashValue % 100;

  return `${animals[animalIndex]}${number}`;
}

/**
 * 동물 이모지만 반환 (재미 요소용)
 */
export function getWeeklyAnimalEmoji(userId) {
  if (!userId) return '👻';

  const animalEmojis = [
    '🐰', '🦊', '🐻', '🐼', '🐯',
    '🐶', '🐱', '🐹', '🦁', '🐸',
    '🐵', '🐨', '🦝', '🐺', '🦔'
  ];

  const today = new Date();
  const year = today.getFullYear();
  const weekNumber = getWeekNumber(today);

  const seed = `${userId}_${year}_${weekNumber}`;
  const hashValue = simpleHash(seed);

  const animalIndex = hashValue % animalEmojis.length;

  return animalEmojis[animalIndex];
}

/**
 * ISO 8601 주차 계산
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * 간단한 해시 함수 (SHA-256 대신 사용)
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
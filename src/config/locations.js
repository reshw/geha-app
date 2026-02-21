// config/locations.js

/**
 * 카풀 출발지/목적지 권역 및 장소 정보
 */

export const LOCATION_REGIONS = {
  // 서울 권역
  gangnam: {
    id: 'gangnam',
    name: '강남권',
    emoji: '🏙️',
    color: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    locations: ['강남', '서초', '역삼', '삼성', '잠실', '송파', '선릉']
  },
  gangseo: {
    id: 'gangseo',
    name: '강서권',
    emoji: '✈️',
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    locations: ['마곡', '김포공항', '목동', '여의도', '영등포', '양천']
  },
  seobuk: {
    id: 'seobuk',
    name: '서북권',
    emoji: '🎨',
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    locations: ['홍대', '신촌', '마포', '연남', '상수', '합정']
  },
  dosim: {
    id: 'dosim',
    name: '도심권',
    emoji: '🏛️',
    color: 'from-gray-600 to-gray-800',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    locations: ['종로', '광화문', '용산', '이태원', '명동', '시청']
  },
  gangdong: {
    id: 'gangdong',
    name: '강동권',
    emoji: '🌳',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    locations: ['강동', '천호', '길동', '광진', '구의']
  },
  gangbuk: {
    id: 'gangbuk',
    name: '강북권',
    emoji: '⛰️',
    color: 'from-indigo-500 to-blue-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    locations: ['노원', '도봉', '수유', '강북', '성북']
  },
  dongbuk: {
    id: 'dongbuk',
    name: '동북권',
    emoji: '🏘️',
    color: 'from-teal-500 to-cyan-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    locations: ['왕십리', '중랑', '면목', '성동', '건대']
  },

  // 경기 권역
  gyeonggi_south: {
    id: 'gyeonggi_south',
    name: '경기 남부',
    emoji: '🚇',
    color: 'from-violet-500 to-purple-700',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    locations: ['분당', '수원', '용인', '평촌', '안양', '성남', '판교']
  },
  gyeonggi_north: {
    id: 'gyeonggi_north',
    name: '경기 북부',
    emoji: '🏔️',
    color: 'from-slate-500 to-gray-700',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    locations: ['의정부', '양주', '동두천', '구리', '남양주']
  },
  gyeonggi_west: {
    id: 'gyeonggi_west',
    name: '경기 서부',
    emoji: '🌊',
    color: 'from-sky-500 to-blue-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    locations: ['부천', '김포', '인천', '시흥', '광명']
  }
};

// 전체 권역 배열 (순서대로)
export const REGION_ORDER = [
  'gangnam',
  'gangseo',
  'seobuk',
  'dosim',
  'gangdong',
  'gangbuk',
  'dongbuk',
  'gyeonggi_south',
  'gyeonggi_north',
  'gyeonggi_west'
];

// 장소 -> 권역 매핑 (빠른 검색용)
export const LOCATION_TO_REGION = {};
Object.entries(LOCATION_REGIONS).forEach(([regionId, region]) => {
  region.locations.forEach(location => {
    LOCATION_TO_REGION[location] = regionId;
  });
});

// 권역별 대표 장소 (자주 사용)
export const POPULAR_LOCATIONS = [
  '강남', '홍대', '마곡', '분당', '수원', '잠실', '여의도', '인천'
];

/**
 * 장소로 권역 찾기
 */
export const getRegionByLocation = (location) => {
  const regionId = LOCATION_TO_REGION[location];
  return regionId ? LOCATION_REGIONS[regionId] : null;
};

/**
 * 권역으로 장소 목록 가져오기
 */
export const getLocationsByRegion = (regionId) => {
  return LOCATION_REGIONS[regionId]?.locations || [];
};

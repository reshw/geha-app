// components/carpool/CarpoolFilters.jsx
import { useState } from 'react';
import { Filter, X } from 'lucide-react';

/**
 * 카풀 필터 바
 *
 * - 타입 필터 (전체/제공/요청)
 * - 날짜 필터
 * - 출발지 필터
 * - 장비 필터
 */
const CarpoolFilters = ({ filters, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTypeChange = (type) => {
    onFilterChange({ ...filters, type: type === filters.type ? null : type });
  };

  const handleDateChange = (e) => {
    onFilterChange({ ...filters, date: e.target.value || null });
  };

  const handleLocationChange = (e) => {
    onFilterChange({ ...filters, departureLocation: e.target.value || null });
  };

  const handleEquipmentChange = (value) => {
    onFilterChange({ ...filters, hasEquipment: value === filters.hasEquipment ? null : value });
  };

  const clearFilters = () => {
    onFilterChange({
      type: null,
      date: null,
      departureLocation: null,
      hasEquipment: null
    });
  };

  const hasActiveFilters = filters.type || filters.date || filters.departureLocation || filters.hasEquipment !== null;

  return (
    <div className="px-4 py-3">
      {/* 타입 필터 (항상 표시) */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-gray-600">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-semibold">필터:</span>
        </div>

        {/* 타입 칩 */}
        <button
          onClick={() => handleTypeChange(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
            filters.type === null
              ? 'bg-gray-700 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => handleTypeChange('offer')}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
            filters.type === 'offer'
              ? 'bg-green-600 text-white'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          제공
        </button>
        <button
          onClick={() => handleTypeChange('request')}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
            filters.type === 'request'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          요청
        </button>

        {/* 상세 필터 토글 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-auto px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-semibold text-gray-700 transition-colors"
        >
          {isExpanded ? '접기' : '상세 필터'}
        </button>

        {/* 초기화 버튼 */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-full text-sm font-semibold text-red-700 transition-colors flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            초기화
          </button>
        )}
      </div>

      {/* 상세 필터 (펼침) */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          {/* 날짜 필터 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 min-w-[60px]">
              날짜:
            </label>
            <input
              type="date"
              value={filters.date || ''}
              onChange={handleDateChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* 출발지 필터 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 min-w-[60px]">
              출발지:
            </label>
            <input
              type="text"
              value={filters.departureLocation || ''}
              onChange={handleLocationChange}
              placeholder="예: 강남, 잠실, 홍대"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* 장비 필터 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 min-w-[60px]">
              장비:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleEquipmentChange(true)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  filters.hasEquipment === true
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                장비 가능만
              </button>
              <button
                onClick={() => handleEquipmentChange(false)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  filters.hasEquipment === false
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                장비 불가만
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarpoolFilters;

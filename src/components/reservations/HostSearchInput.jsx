import { useState, useEffect } from 'react';
import { Search, X, User } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import authService from '../../services/authService';

const HostSearchInput = ({ spaceId, onSelect, selectedHost }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [shareholders, setShareholders] = useState([]);
  const [filteredHosts, setFilteredHosts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userProfiles, setUserProfiles] = useState({}); // userId -> {displayName, profileImage}

  // 주주 목록 로드
  useEffect(() => {
    const loadShareholders = async () => {
      if (!spaceId) return;

      try {
        console.log('🔍 주주 목록 로드 시작:', spaceId);

        // spaces/{spaceId}/assignedUsers에서 shareholder 이상만 가져오기
        const usersRef = collection(db, `spaces/${spaceId}/assignedUsers`);
        const snapshot = await getDocs(usersRef);

        const hosts = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const userType = data.userType || '';

          // shareholder, manager, vice-manager만 초대자 가능
          if (['shareholder', 'manager', 'vice-manager'].includes(userType)) {
            hosts.push({
              id: doc.id,
              displayName: data.displayName || '이름없음',
              userType: data.userType
            });
          }
        });

        console.log('✅ 주주 목록:', hosts);
        setShareholders(hosts);

        // users 컬렉션에서 프로필 정보 가져오기
        const userIds = hosts.map(h => h.id);
        if (userIds.length > 0) {
          const profiles = await authService.getUserProfiles(userIds);
          setUserProfiles(profiles);
        }
      } catch (error) {
        console.error('❌ 주주 목록 로드 실패:', error);
      }
    };

    loadShareholders();
  }, [spaceId]);

  // 검색어에 따라 필터링
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHosts([]);
      setShowDropdown(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = shareholders.filter(host =>
      host.displayName.toLowerCase().includes(query)
    );
    
    setFilteredHosts(filtered);
    setShowDropdown(true);
  }, [searchQuery, shareholders]);

  const handleSelect = (host) => {
    onSelect(host);
    setSearchQuery(host.displayName);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSelect(null);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        초대자 선택 <span className="text-red-500">*</span>
      </label>
      
      {/* 선택된 초대자 표시 */}
      {selectedHost ? (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border-2 border-blue-500 rounded-lg">
          {(() => {
            const userProfile = userProfiles[selectedHost.id];
            const profileImage = userProfile?.profileImage || '';
            const displayName = userProfile?.displayName || selectedHost.displayName;

            return (
              <>
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {displayName[0]}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{displayName}</div>
                  <div className="text-xs text-gray-500">주주</div>
                </div>
                <button
                  onClick={handleClear}
                  className="p-2 hover:bg-blue-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </>
            );
          })()}
        </div>
      ) : (
        <>
          {/* 검색 입력 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowDropdown(true)}
              placeholder="초대해주신 주주님 이름을 검색하세요"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 검색 결과 드롭다운 */}
          {showDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredHosts.length > 0 ? (
                filteredHosts.map((host) => {
                  const userProfile = userProfiles[host.id];
                  const profileImage = userProfile?.profileImage || '';
                  const displayName = userProfile?.displayName || host.displayName;

                  return (
                    <button
                      key={host.id}
                      onClick={() => handleSelect(host)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                    >
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                          {displayName[0]}
                        </div>
                      )}
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">{displayName}</div>
                        <div className="text-xs text-gray-500">주주</div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-gray-500 mt-1">
            초대해주신 주주님의 이름을 검색하여 선택해주세요
          </p>
        </>
      )}
    </div>
  );
};

export default HostSearchInput;
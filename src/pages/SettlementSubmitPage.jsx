// src/pages/SettlementSubmitPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Plus,
  Trash2,
  Users,
  DollarSign,
  User,
  Check,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import settlementService from '../services/settlementService';
import authService from '../services/authService';
import LoginOverlay from '../components/auth/LoginOverlay';

const SettlementSubmitPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { selectedSpace } = useStore();
  const [searchParams] = useSearchParams();

  // 수정 모드 판단
  const receiptId = searchParams.get('receiptId');
  const weekId = searchParams.get('weekId');
  const isEditMode = !!receiptId && !!weekId;

  const [loading, setLoading] = useState(false);
  const [loadingReceipt, setLoadingReceipt] = useState(isEditMode);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  
  // 멤버 목록
  const [members, setMembers] = useState([]);
  const [userProfiles, setUserProfiles] = useState({}); // userId -> {displayName, profileImage}

  // 귀속일 (기본: 오늘)
  const [belongsToDate, setBelongsToDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const [targetWeekSettlement, setTargetWeekSettlement] = useState(null);
  const [isTargetWeekSettled, setIsTargetWeekSettled] = useState(false);

  // 납부자 (기본: 본인)
  const [paidBy, setPaidBy] = useState('');
  const [paidByName, setPaidByName] = useState('');
  const [paidBySearchQuery, setPaidBySearchQuery] = useState('');
  const [showPaidByDropdown, setShowPaidByDropdown] = useState(false);
  
  // 메모
  const [memo, setMemo] = useState('');
  
  // 항목 목록
  const [items, setItems] = useState([
    {
      id: Date.now(),
      itemName: '',
      amount: '',
      splitAmong: [], // [userId, ...]
      searchQuery: '',
      showSearchDropdown: false,
      expanded: true, // 접기/펼치기 상태
    }
  ]);

  useEffect(() => {
    if (selectedSpace) {
      loadMembers();
    }
  }, [selectedSpace]);

  // 귀속일 변경 시 해당 주차 정산 상태 확인
  useEffect(() => {
    if (selectedSpace && belongsToDate && !isEditMode) {
      checkTargetWeekSettlement();
    }
  }, [selectedSpace, belongsToDate, isEditMode]);

  useEffect(() => {
    if (user && !isEditMode) {
      setPaidBy(user.id);
      setPaidByName(user.displayName);

      // 초기 항목에 본인을 분담자로 자동 추가
      setItems(prevItems => {
        // 첫 번째 항목이 비어있고 분담자가 없으면 본인 추가
        if (prevItems.length === 1 && prevItems[0].splitAmong.length === 0) {
          return [{
            ...prevItems[0],
            splitAmong: [user.id]
          }];
        }
        return prevItems;
      });
    }
  }, [user, isEditMode]);

  // 수정 모드일 때 기존 영수증 데이터 로드
  useEffect(() => {
    if (isEditMode && selectedSpace && receiptId && weekId) {
      loadReceipt();
    }
  }, [isEditMode, selectedSpace, receiptId, weekId]);

  const loadReceipt = async () => {
    try {
      setLoadingReceipt(true);
      const receipt = await settlementService.getReceipt(selectedSpace.id, weekId, receiptId);

      // 기존 데이터 설정
      setPaidBy(receipt.paidBy);
      setPaidByName(receipt.paidByName);
      setMemo(receipt.memo || '');
      setExistingImageUrl(receipt.imageUrl);
      setImagePreview(receipt.imageUrl);

      // 항목 데이터 복원
      const loadedItems = receipt.items.map((item, index) => ({
        id: Date.now() + index,
        itemName: item.itemName,
        amount: item.amount.toString(),
        splitAmong: item.splitAmong,
        searchQuery: '',
        showSearchDropdown: false,
        expanded: true,
      }));
      setItems(loadedItems);

    } catch (error) {
      console.error('영수증 로드 실패:', error);
      alert('영수증을 불러오는데 실패했습니다.');
      navigate('/settlement');
    } finally {
      setLoadingReceipt(false);
    }
  };

  const loadMembers = async () => {
    if (!selectedSpace) return;

    try {
      const spaceMembers = await settlementService.getSpaceMembers(selectedSpace.id);
      setMembers(spaceMembers);

      // users 컬렉션에서 프로필 정보 가져오기
      const userIds = spaceMembers.map(m => m.userId);
      if (userIds.length > 0) {
        const profiles = await authService.getUserProfiles(userIds);
        setUserProfiles(profiles);
      }
    } catch (error) {
      console.error('멤버 로드 실패:', error);
    }
  };

  // 귀속일에 해당하는 주차의 정산 상태 확인
  const checkTargetWeekSettlement = async () => {
    if (!selectedSpace || !belongsToDate) return;

    try {
      const targetDate = new Date(belongsToDate);
      const settlement = await settlementService.getSettlementByDate(selectedSpace.id, targetDate);

      setTargetWeekSettlement(settlement);
      setIsTargetWeekSettled(settlement?.status === 'settled');
    } catch (error) {
      console.error('주차 정산 상태 확인 실패:', error);
      setTargetWeekSettlement(null);
      setIsTargetWeekSettled(false);
    }
  };

  // 이미지 선택
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Cloudinary 이미지 업로드
  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('이미지 업로드 실패');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary 업로드 실패:', error);
      throw error;
    }
  };

  // 항목 추가
  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        itemName: '',
        amount: '',
        splitAmong: user?.id ? [user.id] : [], // 새 항목에도 본인 자동 추가
        searchQuery: '',
        showSearchDropdown: false,
        expanded: true,
      }
    ]);
  };

  // 항목 접기/펼치기 토글
  const toggleItemExpanded = (itemId) => {
    setItems(items.map(item =>
      item.id === itemId ? { ...item, expanded: !item.expanded } : item
    ));
  };

  // 항목 삭제
  const removeItem = (itemId) => {
    if (items.length === 1) {
      alert('최소 1개의 항목이 필요합니다.');
      return;
    }
    setItems(items.filter(item => item.id !== itemId));
  };

  // 항목 업데이트
  const updateItem = (itemId, field, value) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  // 검색어로 멤버 필터링
  const getFilteredMembers = (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item || !item.searchQuery.trim()) return [];

    const query = item.searchQuery.toLowerCase();
    return members.filter(member =>
      member.displayName.toLowerCase().includes(query)
    );
  };

  // 분담자 추가
  const addMemberToSplit = (itemId, member) => {
    const item = items.find(i => i.id === itemId);

    // 이미 선택된 멤버인지 확인
    if (item.splitAmong.includes(member.userId)) {
      return;
    }

    setItems(items.map(i =>
      i.id === itemId
        ? {
            ...i,
            splitAmong: [...i.splitAmong, member.userId],
            searchQuery: '',
            showSearchDropdown: false,
          }
        : i
    ));
  };

  // 분담자 제거
  const removeMemberFromSplit = (itemId, userId) => {
    const item = items.find(i => i.id === itemId);
    updateItem(itemId, 'splitAmong', item.splitAmong.filter(id => id !== userId));
  };

  // 검색 입력 처리
  const handleSearchChange = (itemId, value) => {
    setItems(items.map(item =>
      item.id === itemId
        ? {
            ...item,
            searchQuery: value,
            showSearchDropdown: value.trim() !== '',
          }
        : item
    ));
  };

  // 납부자 검색 필터링
  const getFilteredPaidByMembers = () => {
    if (!paidBySearchQuery.trim()) return [];

    const query = paidBySearchQuery.toLowerCase();
    return members.filter(member =>
      member.displayName.toLowerCase().includes(query)
    );
  };

  // 납부자 변경
  const changePaidBy = (userId, userName) => {
    setPaidBy(userId);
    setPaidByName(userName);
    setPaidBySearchQuery('');
    setShowPaidByDropdown(false);
  };

  // 제출 유효성 검사
  const validateForm = () => {
    if (!imageFile && !existingImageUrl) {
      alert('영수증 사진을 첨부해주세요.');
      return false;
    }

    for (const item of items) {
      if (!item.itemName.trim()) {
        alert('항목명을 입력해주세요.');
        return false;
      }
      if (!item.amount || item.amount <= 0) {
        alert('금액을 입력해주세요.');
        return false;
      }
      if (item.splitAmong.length === 0) {
        alert(`"${item.itemName}" 항목의 분담자를 선택해주세요.`);
        return false;
      }
    }

    return true;
  };

  // 제출/수정
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // 이미지 처리 (새로운 이미지가 있으면 업로드, 없으면 기존 URL 사용)
      let imageUrl = existingImageUrl;
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImageToCloudinary(imageFile);
        setUploading(false);
      }

      // 영수증 데이터 준비
      const receiptData = {
        paidBy,
        paidByName,
        memo,
        imageUrl,
        belongsToDate,  // 귀속일 추가
        items: items.map(item => ({
          itemName: item.itemName,
          amount: parseInt(item.amount),
          splitAmong: item.splitAmong,
        })),
      };

      if (isEditMode) {
        // 수정 모드
        await settlementService.updateReceipt(selectedSpace.id, weekId, receiptId, receiptData);
        alert('영수증이 수정되었습니다! ✏️');
      } else {
        // 제출 모드
        receiptData.submittedBy = user.id;
        receiptData.submittedByName = user.displayName;
        await settlementService.submitReceipt(selectedSpace.id, receiptData);
        alert('영수증이 제출되었습니다! 🎉');
      }

      navigate('/settlement');

    } catch (error) {
      console.error(isEditMode ? '영수증 수정 실패:' : '영수증 제출 실패:', error);
      alert(isEditMode ? '영수증 수정에 실패했습니다. 다시 시도해주세요.' : '영수증 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString('ko-KR');
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);
  };

  if (!isLoggedIn) {
    return <LoginOverlay />;
  }

  if (!selectedSpace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-2xl mb-4">🏠</div>
          <p className="text-gray-600 mb-2">스페이스를 불러오는 중...</p>
          <p className="text-sm text-gray-500">예약 페이지에서 스페이스를 먼저 선택해주세요</p>
        </div>
      </div>
    );
  }

  if (loadingReceipt) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">영수증을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/settlement')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {isEditMode ? '영수증 수정' : '영수증 제출'}
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 귀속일 선택 */}
        {!isEditMode && (
          <div className="bg-white rounded-xl p-4 shadow-sm" data-tour="belongs-date-section">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              귀속일
            </h3>
            <input
              type="date"
              value={belongsToDate}
              onChange={(e) => setBelongsToDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-tour="belongs-date-input"
            />
            {isTargetWeekSettled && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  ⚠️ 해당 주차 정산이 마감되어 이번 주 정산에 추가됩니다.
                  <br />
                  <span className="text-xs text-amber-600 mt-1 block">
                    귀속일은 {belongsToDate}로 기록되지만, 정산은 이번 주차에 포함됩니다.
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* 영수증 사진 */}
        <div className="bg-white rounded-xl p-4 shadow-sm receipt-image-upload">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            영수증 사진
          </h3>
          
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="영수증 미리보기" 
                className="w-full rounded-lg border border-gray-200"
              />
              <button
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <label className="block w-full p-8 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:bg-gray-50 transition-colors">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">클릭하여 사진 선택</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* 납부자 선택 */}
        <div className="bg-white rounded-xl p-4 shadow-sm paid-by-section">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            돈 낸 사람
          </h3>

          {/* 선택된 납부자 표시 */}
          {paidBy && paidByName && (
            <div className="mb-2">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium">
                {userProfiles[paidBy]?.profileImage ? (
                  <img
                    src={userProfiles[paidBy].profileImage}
                    alt={paidByName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    {paidByName[0]}
                  </div>
                )}
                <span>{paidByName}</span>
              </div>
            </div>
          )}

          {/* 검색 입력 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={paidBySearchQuery}
              onChange={(e) => {
                setPaidBySearchQuery(e.target.value);
                setShowPaidByDropdown(e.target.value.trim() !== '');
              }}
              onFocus={() => paidBySearchQuery && setShowPaidByDropdown(true)}
              placeholder="이름으로 검색하여 선택"
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* 검색 결과 드롭다운 */}
            {showPaidByDropdown && paidBySearchQuery && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {(() => {
                  const filteredMembers = getFilteredPaidByMembers();
                  return filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => {
                      const userProfile = userProfiles[member.userId];
                      const displayName = userProfile?.displayName || member.displayName;
                      const profileImage = userProfile?.profileImage || '';
                      const isSelected = paidBy === member.userId;

                      return (
                        <button
                          key={member.userId}
                          onClick={() => changePaidBy(member.userId, displayName)}
                          className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {profileImage ? (
                            <img
                              src={profileImage}
                              alt={displayName}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {displayName[0]}
                            </div>
                          )}
                          <span className="font-medium flex-1">{displayName}</span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      검색 결과가 없습니다
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* 메모 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          
          <h3 className="font-bold text-gray-900 mb-3">사용처</h3>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예: 산밑에집, 노랑통닭, 태양반점 ..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 항목 목록 */}
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
              {/* 헤더 (항상 표시) */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => toggleItemExpanded(item.id)}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  <h3 className="font-bold text-gray-900">항목 {index + 1}</h3>
                  {!item.expanded && item.itemName && (
                    <span className="text-sm text-gray-600">
                      • {item.itemName}
                      {item.amount && ` • ${formatCurrency(parseInt(item.amount))}원`}
                    </span>
                  )}
                  {item.expanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 ml-auto" />
                  )}
                </button>
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 text-red-600 transition-colors ml-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* 펼쳐진 내용 */}
              {item.expanded && (
                <div className="space-y-3">

                  {/* 항목명 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      항목명
                    </label>
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                      placeholder="예: 양념치킨 2마리"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 금액 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      금액
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                    </div>
                  </div>

                  {/* 분담자 선택 */}
                  <div className="item-split-section">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      분담자 선택
                    </label>

                    {/* 선택된 멤버들 표시 */}
                    {item.splitAmong.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {item.splitAmong.map((userId) => {
                          const member = members.find(m => m.userId === userId);
                          const userProfile = userProfiles[userId];
                          if (!member) return null;

                          const displayName = userProfile?.displayName || member.displayName;
                          const profileImage = userProfile?.profileImage || '';

                          return (
                            <div
                              key={userId}
                              className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-medium"
                            >
                              {profileImage ? (
                                <img
                                  src={profileImage}
                                  alt={displayName}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                  {displayName[0]}
                                </div>
                              )}
                              <span>{displayName}</span>
                              <button
                                onClick={() => removeMemberFromSplit(item.id, userId)}
                                className="hover:bg-blue-200 rounded-full p-0.5"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 검색 입력 */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={item.searchQuery}
                        onChange={(e) => handleSearchChange(item.id, e.target.value)}
                        onFocus={() => item.searchQuery && updateItem(item.id, 'showSearchDropdown', true)}
                        placeholder="이름으로 검색하여 추가"
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      {/* 검색 결과 드롭다운 */}
                      {item.showSearchDropdown && item.searchQuery && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {(() => {
                            const filteredMembers = getFilteredMembers(item.id);
                            return filteredMembers.length > 0 ? (
                              filteredMembers.map((member) => {
                                const isAlreadySelected = item.splitAmong.includes(member.userId);
                                const userProfile = userProfiles[member.userId];
                                const displayName = userProfile?.displayName || member.displayName;
                                const profileImage = userProfile?.profileImage || '';

                                return (
                                  <button
                                    key={member.userId}
                                    onClick={() => addMemberToSplit(item.id, member)}
                                    disabled={isAlreadySelected}
                                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                                      isAlreadySelected
                                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                        : 'hover:bg-blue-50'
                                    }`}
                                  >
                                    {profileImage ? (
                                      <img
                                        src={profileImage}
                                        alt={displayName}
                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                        {displayName[0]}
                                      </div>
                                    )}
                                    <span className="font-medium flex-1">{displayName}</span>
                                    {isAlreadySelected && (
                                      <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    )}
                                  </button>
                                );
                              })
                            ) : (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                검색 결과가 없습니다
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* 1/n 계산 표시 */}
                    {item.amount && item.splitAmong.length > 0 && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-lg text-center">
                        <p className="text-sm text-blue-800">
                          <span className="font-bold">1인당 {formatCurrency(Math.floor(parseInt(item.amount) / item.splitAmong.length))}원</span>
                          <span className="text-xs ml-1">({item.splitAmong.length}명 분담)</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* 항목 추가 버튼 */}
          <button
            onClick={addItem}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">항목 추가</span>
          </button>
        </div>

        {/* 총액 표시 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium">총 금액</span>
            <span className="text-2xl font-bold">{formatCurrency(getTotalAmount())}원</span>
          </div>
        </div>
      </div>

      {/* 하단 제출 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <button
          onClick={handleSubmit}
          disabled={loading || uploading}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {loading || uploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>{uploading ? '이미지 업로드 중...' : (isEditMode ? '수정 중...' : '제출 중...')}</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>{isEditMode ? '수정하기' : '제출하기'}</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};

export default SettlementSubmitPage;
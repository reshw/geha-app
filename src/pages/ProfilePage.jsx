// src/pages/ProfilePage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Hash, X, ChevronLeft, Save } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    displayName: '',
    profileImage: '',
    birthyear: '',
    gender: '',
    phoneNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [displayNamePreview, setDisplayNamePreview] = useState('');
  const [isChangingNickname, setIsChangingNickname] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // 현재 사용자 정보로 초기화
    setFormData({
      displayName: user.displayName || '',
      profileImage: user.profileImage || '',
      birthyear: user.birthyear || '',
      gender: user.gender || '',
      phoneNumber: user.phoneNumber || ''
    });
  }, [user, navigate]);

  // 닉네임 미리보기
  useEffect(() => {
    if (isChangingNickname && formData.displayName.trim() && formData.displayName !== user?.displayName) {
      const randomTag = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
      setDisplayNamePreview(`${formData.displayName}#${randomTag}`);
    } else {
      setDisplayNamePreview('');
    }
  }, [formData.displayName, isChangingNickname, user?.displayName]);

  const validateForm = () => {
    const newErrors = {};

    // 닉네임 검증 (변경하는 경우에만)
    if (isChangingNickname) {
      if (!formData.displayName.trim()) {
        newErrors.displayName = '닉네임을 입력해주세요';
      } else if (formData.displayName.length < 2) {
        newErrors.displayName = '닉네임은 2자 이상이어야 합니다';
      } else if (formData.displayName.length > 12) {
        newErrors.displayName = '닉네임은 12자 이하여야 합니다';
      } else if (!/^[가-힣a-zA-Z0-9_]+$/.test(formData.displayName)) {
        newErrors.displayName = '한글, 영문, 숫자, _ 만 사용 가능합니다';
      }
    }

    // 전화번호 검증 (선택)
    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      const phoneClean = formData.phoneNumber.replace(/[^0-9]/g, '');
      if (!/^01[0-9]{8,9}$/.test(phoneClean)) {
        newErrors.phoneNumber = '올바른 휴대폰 번호를 입력해주세요';
      }
    }

    // 출생년도 검증 (선택)
    if (formData.birthyear && formData.birthyear.trim()) {
      if (!/^\d{4}$/.test(formData.birthyear)) {
        newErrors.birthyear = '4자리 숫자로 입력해주세요';
      } else {
        const year = parseInt(formData.birthyear);
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear) {
          newErrors.birthyear = '올바른 출생년도를 입력해주세요';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const phoneClean = formData.phoneNumber ? formData.phoneNumber.replace(/[^0-9]/g, '') : '';

      const updateData = {
        profileImage: formData.profileImage,
        birthyear: formData.birthyear || '',
        gender: formData.gender || '',
        phoneNumber: phoneClean
      };

      // 닉네임 변경하는 경우
      if (isChangingNickname && formData.displayName !== user.displayName) {
        const displayTag = await authService.generateDiscriminator(formData.displayName);
        const fullTag = `${formData.displayName}#${displayTag}`;

        updateData.displayName = formData.displayName;
        updateData.displayTag = displayTag;
        updateData.fullTag = fullTag;
      }

      await authService.updateUserProfile(user.id, updateData);

      // 로컬 상태 업데이트
      updateUser({ ...user, ...updateData });

      alert('프로필이 업데이트되었습니다!');
      setIsChangingNickname(false);
      navigate(-1);
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      alert(`프로필 업데이트에 실패했습니다.\n${error?.message ?? ''}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-teal-600 via-teal-600 to-cyan-700 shadow-xl">
        <div className="w-full max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/20 rounded-xl transition-all active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-6 h-6" />
              내 프로필
            </h1>
            <div className="w-10" />
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 프로필 사진 */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 ring-4 ring-teal-100">
                  {formData.profileImage ? (
                    <img
                      src={formData.profileImage}
                      alt="프로필"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <User className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-teal-600 rounded-full text-white hover:bg-teal-700 transition-colors shadow-lg"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">클릭하여 프로필 사진 변경</p>
            </div>

            {/* 닉네임 섹션 */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border-2 border-teal-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-teal-600" />
                  <span className="font-bold text-gray-900">닉네임</span>
                </div>
                {!isChangingNickname && (
                  <button
                    type="button"
                    onClick={() => setIsChangingNickname(true)}
                    className="text-sm text-teal-600 hover:text-teal-700 font-semibold"
                  >
                    변경
                  </button>
                )}
              </div>

              {isChangingNickname ? (
                <>
                  <div className="relative mb-2">
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      placeholder="2-12자 (한글, 영문, 숫자, _)"
                      maxLength={12}
                      className={`w-full px-4 py-3 pr-10 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                        errors.displayName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formData.displayName && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, displayName: user.displayName }));
                          setIsChangingNickname(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                  {displayNamePreview && !errors.displayName && (
                    <p className="text-sm text-teal-600 flex items-center gap-1">
                      <span>✓</span> 예상 태그: <span className="font-mono font-bold">{displayNamePreview}</span>
                    </p>
                  )}
                  {errors.displayName && (
                    <p className="text-red-500 text-sm">{errors.displayName}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ 닉네임 변경 시 새로운 태그(#1234)가 부여됩니다
                  </p>
                </>
              ) : (
                <div className="font-mono text-lg font-bold text-gray-900">
                  {user.fullTag || `${user.displayName}#????`}
                </div>
              )}
            </div>

            {/* 선택 정보 */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                추가 정보 (선택)
              </h3>

              {/* 출생년도 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  출생년도
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="birthyear"
                    value={formData.birthyear}
                    onChange={handleChange}
                    placeholder="예: 1990"
                    maxLength={4}
                    className={`w-full px-3 py-2.5 pr-9 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.birthyear ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formData.birthyear && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, birthyear: '' }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
                {errors.birthyear && (
                  <p className="text-red-500 text-sm mt-1">{errors.birthyear}</p>
                )}
              </div>

              {/* 성별 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  성별
                </label>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center justify-center py-3 px-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.gender === 'male'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="font-medium">남성</span>
                  </label>

                  <label className={`flex-1 flex items-center justify-center py-3 px-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.gender === 'female'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="font-medium">여성</span>
                  </label>
                </div>
              </div>

              {/* 전화번호 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="010-1234-5678"
                    maxLength={13}
                    className={`w-full px-3 py-2.5 pr-9 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formData.phoneNumber && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, phoneNumber: '' }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
                )}
              </div>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  저장하기
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

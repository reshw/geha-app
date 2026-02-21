// src/pages/SignupPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, User, Hash } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';

const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const fileInputRef = useRef(null);

  // 카카오에서 받아온 기본 정보
  const kakaoUserInfo = location.state?.kakaoUserInfo;
  const from = location.state?.from || '/';
  const isMigration = location.state?.isMigration || false; // 기존 사용자 마이그레이션 여부

  const [formData, setFormData] = useState({
    displayName: '',
    profileImage: '',
    birthyear: '',
    gender: '',
    phoneNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false
  });
  const [displayNamePreview, setDisplayNamePreview] = useState('');

  useEffect(() => {
    // 카카오 정보 없이 직접 접근하면 로그인 페이지로
    if (!kakaoUserInfo) {
      navigate('/', { replace: true });
    }
  }, [kakaoUserInfo, navigate]);

  // 카카오 기본 정보 세팅
  useEffect(() => {
    if (!kakaoUserInfo) return;

    setFormData(prev => ({
      ...prev,
      profileImage: kakaoUserInfo.profileImage || ''
    }));
  }, [kakaoUserInfo]);

  // 닉네임 미리보기 (discriminator 포함)
  useEffect(() => {
    if (formData.displayName.trim()) {
      const randomTag = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
      setDisplayNamePreview(`${formData.displayName}#${randomTag}`);
    } else {
      setDisplayNamePreview('');
    }
  }, [formData.displayName]);

  const validateForm = () => {
    const newErrors = {};

    // 닉네임 검증 (필수)
    if (!formData.displayName.trim()) {
      newErrors.displayName = '닉네임을 입력해주세요';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = '닉네임은 2자 이상이어야 합니다';
    } else if (formData.displayName.length > 12) {
      newErrors.displayName = '닉네임은 12자 이하여야 합니다';
    } else if (!/^[가-힣a-zA-Z0-9_]+$/.test(formData.displayName)) {
      newErrors.displayName = '한글, 영문, 숫자, _ 만 사용 가능합니다';
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

    // 약관 동의 검증
    if (!agreements.terms) {
      newErrors.agreements = '서비스 이용약관에 동의해주세요';
    }
    if (!agreements.privacy) {
      newErrors.agreements = '개인정보 처리방침에 동의해주세요';
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

    // 이미지 파일만 허용
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다');
      return;
    }

    // 5MB 제한
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

  const handleAgreementChange = (key) => {
    setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
    if (errors.agreements) {
      setErrors(prev => ({ ...prev, agreements: '' }));
    }
  };

  const handleAllAgreements = (checked) => {
    setAgreements({
      terms: checked,
      privacy: checked
    });
    if (checked && errors.agreements) {
      setErrors(prev => ({ ...prev, agreements: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const phoneClean = formData.phoneNumber ? formData.phoneNumber.replace(/[^0-9]/g, '') : '';

      const fullUserData = {
        id: kakaoUserInfo.id,
        displayName: formData.displayName.trim(),  // 사용자 지정 별명 (메인!)
        realName: kakaoUserInfo.realName || '',    // 카카오 실명 (참고용, 변경 불가)
        kakaoNickname: kakaoUserInfo.kakaoNickname || '', // 카카오 닉네임 (레거시)
        profileImage: formData.profileImage || kakaoUserInfo.profileImage || '',
        email: kakaoUserInfo.email || '',
        provider: 'kakao',
        // 선택 정보
        birthyear: formData.birthyear || '',
        gender: formData.gender || '',
        phoneNumber: phoneClean
      };

      const result = await authService.registerUser(fullUserData);

      // fullTag 포함하여 로그인
      await login({ ...kakaoUserInfo, ...result });

      console.log('✅ 회원가입 완료:', result.fullTag);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('회원가입 실패:', error);
      alert(`회원가입에 실패했습니다.\n${error?.message ?? ''}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!kakaoUserInfo) {
    return null;
  }

  const allAgreed = agreements.terms && agreements.privacy;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          {isMigration ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
                <Hash className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">닉네임 설정</h1>
              <p className="text-gray-600">새로운 닉네임 시스템으로 업그레이드!</p>
              <p className="text-sm text-gray-500 mt-1">닉네임#태그 방식으로 변경되었습니다</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">프로필 설정</h1>
              <p className="text-gray-600">닉네임과 프로필을 설정해주세요</p>
            </>
          )}
        </div>

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

          {/* 닉네임 입력 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              닉네임 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="2-12자 (한글, 영문, 숫자, _)"
                maxLength={12}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                  errors.displayName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {displayNamePreview && !errors.displayName && (
              <p className="text-sm text-teal-600 mt-2 flex items-center gap-1">
                <span>✓</span> 예상 태그: <span className="font-mono font-bold">{displayNamePreview}</span>
              </p>
            )}
            {errors.displayName && (
              <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              태그(#1234)는 자동으로 생성됩니다. 같은 닉네임 사용 가능!
            </p>
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
              <input
                type="text"
                name="birthyear"
                value={formData.birthyear}
                onChange={handleChange}
                placeholder="예: 1990"
                maxLength={4}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.birthyear ? 'border-red-500' : 'border-gray-300'
                }`}
              />
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
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="010-1234-5678"
                maxLength={13}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
              )}
            </div>
          </div>

          {/* 약관 동의 */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              약관 동의 <span className="text-red-500">*</span>
            </h3>

            {/* 전체 동의 */}
            <label className="flex items-center p-4 bg-gray-50 rounded-xl mb-3 cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={allAgreed}
                onChange={(e) => handleAllAgreements(e.target.checked)}
                className="w-5 h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
              />
              <span className="ml-3 font-semibold text-gray-900">전체 동의</span>
            </label>

            {/* 개별 동의 */}
            <div className="space-y-3 pl-2">
              <label className="flex items-start cursor-pointer group">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={agreements.terms}
                    onChange={() => handleAgreementChange('terms')}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <span className="text-sm text-gray-700">[필수] 서비스 이용약관</span>
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-600 hover:underline ml-2"
                  >
                    보기
                  </a>
                </div>
              </label>

              <label className="flex items-start cursor-pointer group">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={agreements.privacy}
                    onChange={() => handleAgreementChange('privacy')}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <span className="text-sm text-gray-700">[필수] 개인정보 처리방침</span>
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-600 hover:underline ml-2"
                  >
                    보기
                  </a>
                </div>
              </label>
            </div>

            {errors.agreements && (
              <p className="text-red-500 text-sm mt-2">{errors.agreements}</p>
            )}
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                처리 중...
              </span>
            ) : (
              '시작하기'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;

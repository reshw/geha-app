// src/pages/SignupPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';

const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // 카카오에서 받아온 기본 정보
  const kakaoUserInfo = location.state?.kakaoUserInfo;
  const from = location.state?.from || '/';

  console.log('📝 SignupPage - location.state:', location.state);
  console.log('📝 SignupPage - kakaoUserInfo:', kakaoUserInfo);

  const [formData, setFormData] = useState({
    birthyear: '',
    gender: '',
    phoneNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    personalInfo: false
  });

  useEffect(() => {
    // 카카오 정보 없이 직접 접근하면 로그인 페이지로
    if (!kakaoUserInfo) {
      console.log('❌ kakaoUserInfo 없음 - 로그인 페이지로 리다이렉트');
      navigate('/', { replace: true });
    }
  }, [kakaoUserInfo, navigate]);

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // ✅ 카카오 값이 있으면 초기 세팅(있을 때만)
  useEffect(() => {
    if (!kakaoUserInfo) return;

    // phone normalize: "+82 10-1234-5678" -> "01012345678"
    const normalizePhone = (raw) => {
      if (!raw) return '';
      const digits = raw.replace(/[^0-9]/g, '');
      if (digits.startsWith('82')) return '0' + digits.slice(2);
      return digits;
    };

    setFormData(prev => ({
      ...prev,
      birthyear: kakaoUserInfo.birthyear || prev.birthyear,
      gender: kakaoUserInfo.gender || prev.gender,
      phoneNumber: kakaoUserInfo.phoneNumber
        ? formatPhoneNumber(normalizePhone(kakaoUserInfo.phoneNumber))
        : prev.phoneNumber
    }));
  }, [kakaoUserInfo]);

  const validateForm = () => {
    const newErrors = {};

    // 출생년도 검증 (없으면 직접 입력 필수)
    if (!formData.birthyear) {
      newErrors.birthyear = '출생년도를 입력해주세요';
    } else if (!/^\d{4}$/.test(formData.birthyear)) {
      newErrors.birthyear = '4자리 숫자로 입력해주세요';
    } else {
      const year = parseInt(formData.birthyear);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear) {
        newErrors.birthyear = '올바른 출생년도를 입력해주세요';
      }
    }

    // 성별 검증 (없으면 직접 입력 필수)
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요';
    }

    // 전화번호 검증 (없으면 직접 입력 필수)
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = '전화번호를 입력해주세요';
    } else {
      const phoneClean = formData.phoneNumber.replace(/[^0-9]/g, '');
      if (!/^01[0-9]{8,9}$/.test(phoneClean)) {
        newErrors.phoneNumber = '올바른 휴대폰 번호를 입력해주세요';
      }
    }

    // 약관 동의 검증
    if (!agreements.terms) {
      newErrors.agreements = '서비스 이용약관에 동의해주세요';
    }
    if (!agreements.privacy) {
      newErrors.agreements = '개인정보 처리방침에 동의해주세요';
    }
    if (!agreements.personalInfo) {
      newErrors.agreements = '개인정보 수집·이용에 동의해주세요';
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

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phoneNumber: formatted }));
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: '' }));
    }
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
      privacy: checked,
      personalInfo: checked
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
      const phoneClean = formData.phoneNumber.replace(/[^0-9]/g, '');

      const fullUserData = {
        id: kakaoUserInfo.id,
        displayName: kakaoUserInfo.displayName,
        email: kakaoUserInfo.email,
        profileImage: kakaoUserInfo.profileImage,
        provider: 'kakao',
        birthyear: formData.birthyear,
        gender: formData.gender,
        phoneNumber: phoneClean
      };

      await authService.registerUser(fullUserData);
      await login(kakaoUserInfo);

      console.log('✅ 회원가입 완료, 이동할 경로:', from);
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

  const allAgreed = agreements.terms && agreements.privacy && agreements.personalInfo;

  // ✅ 카카오에서 값이 있는지 여부
  const hasKakaoBirthyear = !!kakaoUserInfo.birthyear;
  const hasKakaoGender = !!kakaoUserInfo.gender;
  const hasKakaoPhone = !!kakaoUserInfo.phoneNumber;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          {kakaoUserInfo.profileImage && (
            <img
              src={kakaoUserInfo.profileImage}
              alt="프로필"
              className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-blue-100"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">회원가입</h1>
          <p className="text-gray-600">
            {kakaoUserInfo.displayName}님, 환영합니다!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 카카오 계정 정보 (자동 입력) */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">카카오 계정 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">이름</span>
                <span className="font-medium text-gray-900">{kakaoUserInfo.displayName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">카카오 이메일</span>
                <span className="font-medium text-gray-900">{kakaoUserInfo.email || '미제공'}</span>
              </div>

              {/* ✅ 전화번호를 같은 위계로 이동 */}
              <div className="flex justify-between items-center gap-3">
                <span className="text-gray-600">전화번호</span>
                {hasKakaoPhone ? (
                  <span className="font-medium text-gray-900">{formData.phoneNumber || '미제공'}</span>
                ) : (
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="010-1234-5678"
                    maxLength={13}
                    className={`w-40 px-2 py-1 border rounded-md text-right bg-white focus:outline-none focus:ring-2
                      ${errors.phoneNumber
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-blue-200'}`}
                  />
                )}
              </div>

              {errors.phoneNumber && !hasKakaoPhone && (
                <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
              )}
            </div>
          </div>

          {/* 추가 정보 입력 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              추가 정보 입력 <span className="text-red-500">*</span>
            </h3>

            {/* 출생년도 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                출생년도 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="birthyear"
                value={formData.birthyear}
                onChange={handleChange}
                placeholder="예: 1990"
                maxLength={4}
                readOnly={hasKakaoBirthyear}
                disabled={hasKakaoBirthyear}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 
                  ${errors.birthyear
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-200'}
                  ${hasKakaoBirthyear ? 'bg-gray-100' : ''}`}
              />
              {errors.birthyear && (
                <p className="text-red-500 text-sm mt-1">{errors.birthyear}</p>
              )}
            </div>

            {/* 성별 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성별 <span className="text-red-500">*</span>
              </label>

              {/* ✅ 카카오에 값 있으면 잠금(선택 불가) */}
              <div className={`flex gap-3 ${hasKakaoGender ? 'pointer-events-none' : ''}`}>
                <label className={`flex-1 flex items-center justify-center py-3 px-4 border-2 rounded-xl transition-all ${
                  formData.gender === 'male'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                } ${hasKakaoGender ? 'cursor-default' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleChange}
                    className="sr-only"
                    disabled={hasKakaoGender}
                  />
                  <span className="font-medium">남성</span>
                </label>

                <label className={`flex-1 flex items-center justify-center py-3 px-4 border-2 rounded-xl transition-all ${
                  formData.gender === 'female'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                } ${hasKakaoGender ? 'cursor-default' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleChange}
                    className="sr-only"
                    disabled={hasKakaoGender}
                  />
                  <span className="font-medium">여성</span>
                </label>
              </div>

              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
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
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
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
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <span className="text-sm text-gray-700">[필수] 서비스 이용약관</span>
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline ml-2"
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
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <span className="text-sm text-gray-700">[필수] 개인정보 처리방침</span>
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline ml-2"
                  >
                    보기
                  </a>
                </div>
              </label>

              <label className="flex items-start cursor-pointer group">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={agreements.personalInfo}
                    onChange={() => handleAgreementChange('personalInfo')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <span className="text-sm text-gray-700">[필수] 개인정보 수집·이용 동의</span>
                  <div className="text-xs text-gray-500 mt-1">
                    • 수집항목: 이름, 성별, 출생년도, 카카오계정(전화번호)<br/>
                    • 이용목적: 회원 식별, 서비스 제공<br/>
                    • 보유기간: 회원 탈퇴 시까지
                  </div>
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
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all
              ${isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'}`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                가입 처리 중...
              </span>
            ) : (
              '가입 완료'
            )}
          </button>
        </form>

        {/* 안내 문구 */}
        <p className="text-xs text-gray-500 text-center mt-6">
          가입하시면 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
};

export default SignupPage;

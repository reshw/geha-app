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
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    // 카카오 정보 없이 직접 접근하면 로그인 페이지로
    if (!kakaoUserInfo) {
      console.log('❌ kakaoUserInfo 없음 - 로그인 페이지로 리다이렉트');
      navigate('/', { replace: true });
    }
  }, [kakaoUserInfo, navigate]);

  const validateForm = () => {
    const newErrors = {};
    
    // 출생년도 검증
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
    
    // 성별 검증
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요';
    }
    
    // 전화번호 검증
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

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
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
              <div className="flex justify-between">
                <span className="text-gray-600">이름</span>
                <span className="font-medium text-gray-900">{kakaoUserInfo.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">카카오 이메일</span>
                <span className="font-medium text-gray-900">{kakaoUserInfo.email || '미제공'}</span>
              </div>
            </div>
          </div>

          {/* 추가 정보 입력 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">추가 정보 입력 <span className="text-red-500">*</span></h3>
            
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
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 
                  ${errors.birthyear 
                    ? 'border-red-300 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-200'}`}
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
              <div className="flex gap-3">
                <label className={`flex-1 flex items-center justify-center py-3 px-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.gender === 'male' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
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
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
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
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
              )}
            </div>

            {/* 전화번호 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카카오계정(전화번호) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                placeholder="010-1234-5678"
                maxLength={13}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 
                  ${errors.phoneNumber 
                    ? 'border-red-300 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-200'}`}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
              )}
            </div>
          </div>

          {/* 약관 동의 */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">약관 동의 <span className="text-red-500">*</span></h3>
            
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
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-xs text-blue-600 hover:underline ml-2"
                  >
                    보기
                  </button>
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
                  <button
                    type="button"
                    onClick={() => setShowPrivacy(true)}
                    className="text-xs text-blue-600 hover:underline ml-2"
                  >
                    보기
                  </button>
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

      {/* 이용약관 모달 */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">서비스 이용약관</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] text-sm text-gray-700 space-y-4">
              <p><strong>제1조 (목적)</strong></p>
              <p>본 약관은 게하 앱(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
              
              <p><strong>제2조 (회원가입)</strong></p>
              <p>1. 이용자는 회사가 정한 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</p>
              <p>2. 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.</p>
              
              <p><strong>제3조 (서비스의 제공)</strong></p>
              <p>회사는 회원에게 숙박시설 예약 관리 서비스를 제공합니다.</p>
              
              <p><strong>제4조 (개인정보 보호)</strong></p>
              <p>회사는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력합니다.</p>
            </div>
            <div className="p-6 border-t">
              <button
                onClick={() => setShowTerms(false)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보 처리방침 모달 */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">개인정보 처리방침</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] text-sm text-gray-700 space-y-4">
              <p><strong>1. 개인정보의 수집 및 이용목적</strong></p>
              <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>회원 가입 및 관리</li>
                <li>서비스 제공 및 예약 관리</li>
                <li>민원 처리</li>
              </ul>
              
              <p><strong>2. 수집하는 개인정보 항목</strong></p>
              <p>필수항목: 이름, 성별, 출생년도, 카카오계정(이메일), 전화번호</p>
              
              <p><strong>3. 개인정보의 보유 및 이용기간</strong></p>
              <p>회원 탈퇴 시까지 보유하며, 탈퇴 즉시 파기합니다.</p>
              
              <p><strong>4. 개인정보의 제3자 제공</strong></p>
              <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.</p>
              
              <p><strong>5. 개인정보 보호책임자</strong></p>
              <p>문의: reshw@naver.com</p>
            </div>
            <div className="p-6 border-t">
              <button
                onClick={() => setShowPrivacy(false)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignupPage;
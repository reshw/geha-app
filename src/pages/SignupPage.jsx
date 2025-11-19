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

  useEffect(() => {
    // 카카오 정보 없이 직접 접근하면 로그인 페이지로
    if (!kakaoUserInfo) {
      console.log('❌ kakaoUserInfo 없음 - 로그인 페이지로 리다이렉트');
      navigate('/login', { replace: true });
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 입력 시 해당 필드 에러 제거
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // 전화번호에서 하이픈 제거
      const phoneClean = formData.phoneNumber.replace(/[^0-9]/g, '');
      
      // 카카오 정보 + 입력 정보 합치기
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
      
      // Firebase에 사용자 등록
      await authService.registerUser(fullUserData);
      
      // 앱 세션에 로그인
      await login(kakaoUserInfo);
      
      console.log('✅ 회원가입 완료, 이동할 경로:', from);
      
      // 원래 가려던 페이지로 이동
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          {kakaoUserInfo.profileImage && (
            <img
              src={kakaoUserInfo.profileImage}
              alt="프로필"
              className="w-20 h-20 rounded-full mx-auto mb-3"
            />
          )}
          <h1 className="text-xl font-bold text-gray-900">회원가입</h1>
          <p className="text-gray-600 mt-1">
            {kakaoUserInfo.displayName}님, 추가 정보를 입력해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 출생년도 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              출생년도
            </label>
            <input
              type="text"
              name="birthyear"
              value={formData.birthyear}
              onChange={handleChange}
              placeholder="예: 1990"
              maxLength={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 
                ${errors.birthyear 
                  ? 'border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:ring-blue-200'}`}
            />
            {errors.birthyear && (
              <p className="text-red-500 text-sm mt-1">{errors.birthyear}</p>
            )}
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              성별
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={handleChange}
                  className="mr-2"
                />
                남성
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={handleChange}
                  className="mr-2"
                />
                여성
              </label>
            </div>
            {errors.gender && (
              <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
            )}
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              휴대폰 번호
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              placeholder="010-1234-5678"
              maxLength={13}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 
                ${errors.phoneNumber 
                  ? 'border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:ring-blue-200'}`}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg font-medium transition-colors
              ${isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {isSubmitting ? '가입 중...' : '가입 완료'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
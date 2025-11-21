import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, AlertCircle } from 'lucide-react';

const SignInPage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phoneNumber: '',
    birthYear: '',
    gender: ''
  });
  
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isUsernameChecked, setIsUsernameChecked] = useState(false);
  const [timer, setTimer] = useState(0);
  
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    personalInfo: false,
    marketing: false
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 입력 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 아이디 변경 시 중복확인 초기화
    if (name === 'username') {
      setIsUsernameChecked(false);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 에러 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 동의 체크박스 핸들러
  const handleAgreementChange = (name) => {
    setAgreements(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  // 전체 동의
  const handleAllAgree = () => {
    const allChecked = agreements.terms && agreements.privacy && agreements.personalInfo && agreements.marketing;
    setAgreements({
      terms: !allChecked,
      privacy: !allChecked,
      personalInfo: !allChecked,
      marketing: !allChecked
    });
  };

  // 아이디 중복확인 (모양새만)
  const handleCheckUsername = () => {
    if (!formData.username) {
      setErrors(prev => ({
        ...prev,
        username: '아이디를 입력해주세요'
      }));
      return;
    }
    
    if (formData.username.length < 4) {
      setErrors(prev => ({
        ...prev,
        username: '아이디는 4자 이상이어야 합니다'
      }));
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setErrors(prev => ({
        ...prev,
        username: '아이디는 영문, 숫자, 언더스코어(_)만 사용 가능합니다'
      }));
      return;
    }
    
    // 중복확인 성공 (항상 사용 가능)
    setIsUsernameChecked(true);
    setErrors(prev => ({
      ...prev,
      username: ''
    }));
    alert('사용 가능한 아이디입니다.');
  };

  // 휴대폰 번호 형식화
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 휴대폰 입력 핸들러
  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      phoneNumber: formatted
    }));
  };

  // 인증번호 발송 (모양새만)
  const handleSendCode = () => {
    if (!formData.phoneNumber || formData.phoneNumber.length < 13) {
      setErrors(prev => ({
        ...prev,
        phoneNumber: '올바른 휴대폰 번호를 입력해주세요'
      }));
      return;
    }
    
    setIsCodeSent(true);
    setTimer(180); // 3분
    
    // 타이머 시작 (실제로는 구현 안함, 모양새만)
    alert('인증번호가 발송되었습니다. (테스트: 123456)');
  };

  // 인증번호 확인 (모양새만)
  const handleVerifyCode = () => {
    if (verificationCode === '123456') {
      setIsVerified(true);
      alert('인증이 완료되었습니다.');
    } else {
      alert('인증번호가 일치하지 않습니다.');
    }
  };

  // 폼 검증
  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = '아이디를 입력해주세요';
    } else if (!isUsernameChecked) {
      newErrors.username = '아이디 중복확인을 해주세요';
    }

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다';
    }

    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다';
    }

    if (!formData.phoneNumber || formData.phoneNumber.length < 13) {
      newErrors.phoneNumber = '휴대폰 번호를 입력해주세요';
    }

    if (!isVerified) {
      newErrors.verification = '휴대폰 인증을 완료해주세요';
    }

    if (!formData.birthYear) {
      newErrors.birthYear = '출생연도를 선택해주세요';
    }

    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요';
    }

    if (!agreements.terms || !agreements.privacy || !agreements.personalInfo) {
      newErrors.agreements = '필수 약관에 동의해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 회원가입 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 실제로는 서버로 전송하지 않음 (카카오 심사용)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('회원가입이 완료되었습니다!\n(카카오 심사용 페이지입니다)');
      navigate('/');
    } catch (error) {
      alert('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">회원가입</h1>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 아이디 */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                아이디 <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="영문, 숫자, _ 사용 (4자 이상)"
                  disabled={isUsernameChecked}
                />
                <button
                  type="button"
                  onClick={handleCheckUsername}
                  disabled={isUsernameChecked}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
                >
                  {isUsernameChecked ? '확인완료' : '중복확인'}
                </button>
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.username}
                </p>
              )}
              {isUsernameChecked && (
                <p className="mt-1 text-sm text-green-400 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  사용 가능한 아이디입니다
                </p>
              )}
            </div>

            {/* 이름 */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                이름 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="홍길동"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                이메일 <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                비밀번호 <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="8자 이상 입력해주세요"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                비밀번호 확인 <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="비밀번호를 다시 입력해주세요"
              />
              {errors.passwordConfirm && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.passwordConfirm}
                </p>
              )}
            </div>

            {/* 휴대폰 번호 + 인증 */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                휴대폰 번호 <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="010-0000-0000"
                  maxLength="13"
                  disabled={isVerified}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isVerified}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
                >
                  {isVerified ? '인증완료' : isCodeSent ? '재발송' : '인증번호'}
                </button>
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.phoneNumber}
                </p>
              )}

              {/* 인증번호 입력 */}
              {isCodeSent && !isVerified && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="인증번호 6자리 입력 (테스트: 123456)"
                    maxLength="6"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold whitespace-nowrap"
                  >
                    확인
                  </button>
                </div>
              )}

              {isVerified && (
                <p className="mt-2 text-sm text-green-400 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  휴대폰 인증이 완료되었습니다
                </p>
              )}

              {errors.verification && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.verification}
                </p>
              )}
            </div>

            {/* 출생연도 */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                출생연도 <span className="text-red-400">*</span>
              </label>
              <select
                name="birthYear"
                value={formData.birthYear}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" className="bg-slate-800">선택해주세요</option>
                {years.map(year => (
                  <option key={year} value={year} className="bg-slate-800">{year}년</option>
                ))}
              </select>
              {errors.birthYear && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.birthYear}
                </p>
              )}
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                성별 <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-white font-medium">남성</span>
                </label>
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-white font-medium">여성</span>
                </label>
              </div>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.gender}
                </p>
              )}
            </div>

            {/* 약관 동의 */}
            <div className="space-y-3 pt-4 border-t border-white/20">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreements.terms && agreements.privacy && agreements.personalInfo && agreements.marketing}
                  onChange={handleAllAgree}
                  className="w-5 h-5 rounded"
                />
                <span className="text-white font-semibold">전체 동의</span>
              </label>

              <div className="pl-8 space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreements.terms}
                    onChange={() => handleAgreementChange('terms')}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-300 text-sm">
                    <span className="text-red-400">*</span> 이용약관 동의
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreements.privacy}
                    onChange={() => handleAgreementChange('privacy')}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-300 text-sm">
                    <span className="text-red-400">*</span> 개인정보 처리방침 동의
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreements.personalInfo}
                    onChange={() => handleAgreementChange('personalInfo')}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-300 text-sm">
                    <span className="text-red-400">*</span> 개인정보 수집 및 이용 동의
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreements.marketing}
                    onChange={() => handleAgreementChange('marketing')}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-300 text-sm">
                    (선택) 마케팅 정보 수신 동의
                  </span>
                </label>
              </div>

              {errors.agreements && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.agreements}
                </p>
              )}
            </div>

            {/* 수집 정보 안내 */}
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2 text-sm">수집하는 개인정보</h3>
              <ul className="text-gray-300 text-xs space-y-1">
                <li>• <span className="text-red-300">필수 항목:</span> 아이디, 이름, 이메일, 비밀번호, 휴대폰 번호, 출생연도, 성별</li>
                <li>• <span className="text-yellow-300">선택 항목:</span> 마케팅 정보 수신 동의</li>
                <li>• <span className="text-green-300">수집 목적:</span> 회원가입, 본인 확인, 서비스 제공, 고객 지원</li>
                <li>• <span className="text-purple-300">보유 기간:</span> 회원 탈퇴 시까지</li>
              </ul>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {isSubmitting ? '처리 중...' : '회원가입 완료'}
            </button>

            {/* 안내 문구 */}
            <p className="text-center text-gray-400 text-sm">
              이미 계정이 있으신가요?{' '}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                로그인
              </button>
            </p>
          </form>
        </div>

       
        
      </div>
    </div>
  );
};

export default SignInPage;
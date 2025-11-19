// src/pages/JoinSpacePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import spaceService from '../services/spaceService';
import LoginOverlay from '../components/auth/LoginOverlay';

const JoinSpacePage = () => {
  const navigate = useNavigate();
  const { code } = useParams(); // URL 파라미터에서 코드 추출
  const { user, isLoggedIn } = useAuth();
  
  const [spaceCode, setSpaceCode] = useState(code || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [spaceInfo, setSpaceInfo] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    // URL에 코드가 있고 로그인 되어 있으면 자동으로 스페이스 정보 조회
    if (code && isLoggedIn) {
      handleCodeSubmit(code);
    }
  }, [isLoggedIn, code]);

  const handleCodeSubmit = async (inputCode = spaceCode) => {
    if (!inputCode || inputCode.trim().length === 0) {
      setError('방 코드를 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // 스페이스 존재 여부 확인
      const space = await spaceService.getSpaceByCode(inputCode.trim());
      
      if (!space) {
        setError('존재하지 않는 방 코드입니다');
        setSpaceInfo(null);
        setShowConfirm(false);
        return;
      }

      // 이미 가입되어 있는지 확인
      const alreadyJoined = await spaceService.checkUserInSpace(user.id, space.id);
      
      if (alreadyJoined) {
        // 이미 가입된 방이면 메인으로 이동
        alert('이미 가입된 방입니다');
        navigate('/', { replace: true });
        return;
      }

      // 스페이스 정보 표시 및 확인 화면 표시
      setSpaceInfo(space);
      setShowConfirm(true);
    } catch (err) {
      console.error('방 조회 실패:', err);
      setError('방 정보를 불러오는데 실패했습니다');
      setSpaceInfo(null);
      setShowConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinConfirm = async () => {
    if (!spaceInfo) return;
    
    setIsLoading(true);
    
    try {
      const result = await spaceService.joinSpace(String(user.id), spaceInfo.id, {
        displayName: user.displayName,
        email: user.email,
        profileImage: user.profileImage
      });

      if (result.alreadyJoined) {
        alert('이미 가입된 방입니다');
      } else {
        alert(`${spaceInfo.name}에 가입되었습니다!`);
      }
      
      // 메인 화면으로 이동
      navigate('/', { replace: true });
    } catch (err) {
      console.error('방 가입 실패:', err);
      alert(`방 가입에 실패했습니다.\n${err?.message || ''}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setSpaceInfo(null);
    setSpaceCode('');
    setError('');
  };

  if (!isLoggedIn) {
    return <LoginOverlay />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          방 가입하기
        </h1>

        {!showConfirm ? (
          // 코드 입력 화면
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                방 코드 입력
              </label>
              <input
                type="text"
                value={spaceCode}
                onChange={(e) => {
                  setSpaceCode(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCodeSubmit();
                  }
                }}
                placeholder="6자리 코드 입력"
                className={`w-full px-4 py-3 border rounded-lg text-center text-lg tracking-wider
                  focus:outline-none focus:ring-2 
                  ${error 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-200'}`}
                disabled={isLoading}
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>

            <button
              onClick={() => handleCodeSubmit()}
              disabled={isLoading || !spaceCode.trim()}
              className={`w-full py-3 rounded-lg font-medium transition-colors mb-4
                ${isLoading || !spaceCode.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {isLoading ? '확인 중...' : '확인'}
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 방 코드는 방장이나 관리자에게 문의하세요!
              </p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800"
            >
              취소
            </button>
          </>
        ) : (
          // 가입 확인 화면
          <div className="text-center">
            <div className="mb-6">
              <div className="text-4xl mb-4">🏠</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {spaceInfo?.name || '방 이름'}
              </h2>
              <p className="text-gray-600">
                이 방에 가입하시겠습니까?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium
                  text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleJoinConfirm}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors
                  ${isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {isLoading ? '가입 중...' : '가입하기'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinSpacePage;
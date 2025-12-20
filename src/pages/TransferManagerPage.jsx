import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import useStore from '../store/useStore';
import { USER_TYPES, USER_TYPE_LABELS } from '../utils/constants';
import { canManageSpace } from '../utils/permissions';
import { ArrowLeft, ShieldAlert, Crown, AlertTriangle } from 'lucide-react';

export default function TransferManagerPage() {
  const navigate = useNavigate();
  const { user, selectedSpace } = useStore();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [confirmationStep, setConfirmationStep] = useState(0);

  // 권한 체크 - 매니저만 접근 가능
  useEffect(() => {
    if (!user || !selectedSpace) {
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }

    const spaceId = selectedSpace.id || selectedSpace.spaceId;
    const userSpaceData = user.spaceAccess?.find(s => s.spaceId === spaceId);
    
    // 매니저만 권한 양도 가능
    if (!userSpaceData || userSpaceData.userType !== USER_TYPES.MANAGER) {
      alert('매니저만 권한을 양도할 수 있습니다.');
      navigate('/space/manage');
      return;
    }
  }, [user, selectedSpace, navigate]);

  // 멤버 목록 로드 (본인 제외)
  useEffect(() => {
    if (!selectedSpace?.id) return;
    loadMembers();
  }, [selectedSpace]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;
      
      const assignedUsersRef = collection(db, `spaces/${spaceId}/assignedUsers`);
      const snapshot = await getDocs(assignedUsersRef);
      
      const memberList = [];
      snapshot.forEach(doc => {
        // 본인 제외
        if (doc.id === user.id) return;
        
        const data = doc.data();
        memberList.push({
          userId: doc.id,
          displayName: data.displayName || '이름 없음',
          email: data.email || '',
          userType: data.userType || 'guest',
          profileImage: data.profileImage || ''
        });
      });

      // 부매니저, 주주 우선 정렬
      memberList.sort((a, b) => {
        const order = {
          [USER_TYPES.VICE_MANAGER]: 1,
          [USER_TYPES.SHAREHOLDER]: 2,
          [USER_TYPES.GUEST]: 3
        };
        return (order[a.userType] || 99) - (order[b.userType] || 99);
      });

      setMembers(memberList);
    } catch (error) {
      console.error('멤버 목록 로드 실패:', error);
      alert('멤버 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 권한 양도 실행
  const handleTransfer = async () => {
    if (!selectedMember) return;

    try {
      setTransferring(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;

      console.log('👑 매니저 권한 양도 시작:', {
        from: user.id,
        to: selectedMember.userId,
        spaceId
      });

      const batch = writeBatch(db);

      // 1. 새 매니저로 권한 변경
      const newManagerSpaceRef = doc(db, `spaces/${spaceId}/assignedUsers`, selectedMember.userId);
      batch.update(newManagerSpaceRef, {
        userType: USER_TYPES.MANAGER
      });

      const newManagerUserRef = doc(db, `users/${selectedMember.userId}/spaceAccess`, spaceId);
      batch.update(newManagerUserRef, {
        userType: USER_TYPES.MANAGER,
        updatedAt: new Date().toISOString()
      });

      // 2. 기존 매니저를 부매니저로 변경
      const oldManagerSpaceRef = doc(db, `spaces/${spaceId}/assignedUsers`, user.id);
      batch.update(oldManagerSpaceRef, {
        userType: USER_TYPES.VICE_MANAGER
      });

      const oldManagerUserRef = doc(db, `users/${user.id}/spaceAccess`, spaceId);
      batch.update(oldManagerUserRef, {
        userType: USER_TYPES.VICE_MANAGER,
        updatedAt: new Date().toISOString()
      });

      await batch.commit();

      console.log('✅ 매니저 권한 양도 완료');

      alert(`${selectedMember.displayName}님에게 매니저 권한이 양도되었습니다.\n\n당신은 이제 부매니저입니다.`);
      
      // 홈으로 이동 (권한이 변경되었으므로)
      navigate('/');
      
      // 페이지 새로고침으로 권한 재확인
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
      console.error('❌ 권한 양도 실패:', error);
      alert('권한 양도에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setTransferring(false);
    }
  };

  // 확인 단계별 메시지
  const getConfirmationMessage = () => {
    if (confirmationStep === 1) {
      return `정말로 ${selectedMember?.displayName}님에게 매니저 권한을 양도하시겠습니까?`;
    }
    if (confirmationStep === 2) {
      return `⚠️ 최종 확인\n\n매니저 권한을 양도하면:\n• 당신은 부매니저로 변경됩니다\n• 스페이스 관리 권한이 제한됩니다\n• 되돌릴 수 없습니다\n\n계속하시겠습니까?`;
    }
    return '';
  };

  const handleConfirm = () => {
    if (confirmationStep === 0) {
      if (!selectedMember) {
        alert('양도받을 멤버를 선택해주세요.');
        return;
      }
      setConfirmationStep(1);
    } else if (confirmationStep === 1) {
      if (window.confirm(getConfirmationMessage())) {
        setConfirmationStep(2);
      }
    } else if (confirmationStep === 2) {
      if (window.confirm(getConfirmationMessage())) {
        handleTransfer();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">멤버 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/30 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/space/manage')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                매니저 권한 양도
              </h1>
              <p className="text-sm text-slate-300">{selectedSpace?.spaceName || ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 경고 메시지 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-300">
              <p className="font-medium mb-2">⚠️ 중요한 안내</p>
              <ul className="space-y-1 text-red-200/80">
                <li>• 매니저 권한을 양도하면 당신은 <strong>부매니저</strong>로 변경됩니다.</li>
                <li>• 이 작업은 <strong>되돌릴 수 없습니다</strong>.</li>
                <li>• 신중하게 선택해주세요.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 멤버 선택 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            새로운 매니저 선택
          </h2>
          
          {members.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-600/30 rounded-xl p-8 text-center">
              <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-300">양도할 수 있는 멤버가 없습니다.</p>
              <p className="text-sm text-slate-400 mt-2">
                먼저 멤버를 초대하거나 추가해주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <button
                  key={member.userId}
                  onClick={() => setSelectedMember(member)}
                  className={`w-full bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border rounded-xl p-4 shadow-lg transition-all ${
                    selectedMember?.userId === member.userId
                      ? 'border-blue-500 ring-2 ring-blue-500/50'
                      : 'border-slate-600/30 hover:border-slate-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* 프로필 */}
                    {member.profileImage ? (
                      <img
                        src={member.profileImage}
                        alt={member.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {member.displayName.charAt(0)}
                      </div>
                    )}

                    {/* 정보 */}
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-white">
                        {member.displayName}
                      </h3>
                      {member.email && (
                        <p className="text-sm text-slate-400">{member.email}</p>
                      )}
                    </div>

                    {/* 현재 권한 */}
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      member.userType === USER_TYPES.VICE_MANAGER
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        : member.userType === USER_TYPES.SHAREHOLDER
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                    }`}>
                      {USER_TYPE_LABELS[member.userType]}
                    </div>

                    {/* 선택 표시 */}
                    {selectedMember?.userId === member.userId && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 확인 단계 표시 */}
        {confirmationStep > 0 && selectedMember && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-yellow-300 text-sm">
              <strong>확인 단계 {confirmationStep}/2</strong>
              <br />
              {selectedMember.displayName}님을 새 매니저로 선택했습니다.
            </p>
          </div>
        )}

        {/* 실행 버튼 */}
        <button
          onClick={handleConfirm}
          disabled={!selectedMember || transferring}
          className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {transferring ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>권한 양도 중...</span>
            </>
          ) : (
            <>
              <Crown className="w-5 h-5" />
              <span>
                {confirmationStep === 0 && '계속하기'}
                {confirmationStep === 1 && '다음 단계'}
                {confirmationStep === 2 && '최종 확인 및 양도'}
              </span>
            </>
          )}
        </button>

        {/* 취소 버튼 */}
        {confirmationStep > 0 && (
          <button
            onClick={() => setConfirmationStep(0)}
            disabled={transferring}
            className="w-full mt-3 px-6 py-3 bg-slate-600/50 hover:bg-slate-600/70 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            처음부터 다시
          </button>
        )}

        {/* 안내 */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-2">💡 권한 양도 안내</p>
            <ul className="space-y-1 text-blue-200/80">
              <li>• 양도 후에는 새 매니저만 다시 권한을 변경할 수 있습니다.</li>
              <li>• 부매니저로 변경되면 일부 관리 기능이 제한됩니다.</li>
              <li>• 양도 후 즉시 적용되며, 페이지가 새로고침됩니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
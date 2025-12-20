import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import useStore from '../store/useStore';
import { USER_TYPES, USER_TYPE_LABELS, USER_TYPE_LEVEL } from '../utils/constants';
import { canManageSpace } from '../utils/permissions';
import { ArrowLeft, UserMinus, Shield, Users } from 'lucide-react';

export default function MemberManagePage() {
  const navigate = useNavigate();
  const { user, selectedSpace } = useStore();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // 권한 체크
  useEffect(() => {
    console.log('🔍 MemberManagePage 권한 체크:', { user, selectedSpace });
    
    if (!user || !selectedSpace) {
      console.warn('⚠️ user 또는 selectedSpace 없음');
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }

    const spaceId = selectedSpace.id || selectedSpace.spaceId;
    const userSpaceData = user.spaceAccess?.find(s => s.spaceId === spaceId);
    
    if (!userSpaceData || !canManageSpace(userSpaceData.userType)) {
      console.warn('⚠️ 권한 없음:', userSpaceData?.userType);
      alert('접근 권한이 없습니다. 매니저만 접근 가능합니다.');
      navigate('/');
      return;
    }
    
    console.log('✅ 권한 확인 완료');
  }, [user, selectedSpace, navigate]);

  // 멤버 목록 로드
  useEffect(() => {
    if (!selectedSpace?.id) return;
    loadMembers();
  }, [selectedSpace]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;
      console.log('📋 멤버 목록 로드 시작:', spaceId);
      
      const assignedUsersRef = collection(db, `spaces/${spaceId}/assignedUsers`);
      const snapshot = await getDocs(assignedUsersRef);
      
      const memberList = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        memberList.push({
          userId: doc.id,
          displayName: data.displayName || '이름 없음',
          email: data.email || '',
          userType: data.userType || 'guest',
          profileImage: data.profileImage || '',
          joinedAt: data.joinedAt,
          status: data.status || 'active'
        });
      });

      // 권한 레벨 순으로 정렬
      memberList.sort((a, b) => {
        const levelA = USER_TYPE_LEVEL[a.userType] || 0;
        const levelB = USER_TYPE_LEVEL[b.userType] || 0;
        return levelB - levelA;
      });

      setMembers(memberList);
    } catch (error) {
      console.error('멤버 목록 로드 실패:', error);
      alert('멤버 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 권한 변경
  const handleChangeUserType = async (member, newUserType) => {
    if (member.userId === user.id) {
      alert('본인의 권한은 변경할 수 없습니다.');
      return;
    }

    if (member.userType === USER_TYPES.MANAGER) {
      const confirmed = window.confirm(
        '매니저 권한을 변경하시겠습니까?\n매니저가 없으면 스페이스 관리가 불가능합니다.'
      );
      if (!confirmed) return;
    }

    try {
      setProcessing(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;

      // 1. spaces/{spaceId}/assignedUsers/{userId} 업데이트
      const spaceUserRef = doc(db, `spaces/${spaceId}/assignedUsers`, member.userId);
      await updateDoc(spaceUserRef, {
        userType: newUserType
      });

      // 2. users/{userId}/spaceAccess/{spaceId} 업데이트
      const userSpaceRef = doc(db, `users/${member.userId}/spaceAccess`, spaceId);
      await updateDoc(userSpaceRef, {
        userType: newUserType
      });

      alert('권한이 변경되었습니다.');
      await loadMembers();
    } catch (error) {
      console.error('권한 변경 실패:', error);
      alert('권한 변경에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  // 멤버 내보내기
  const handleRemoveMember = async (member) => {
    if (member.userId === user.id) {
      alert('본인은 내보낼 수 없습니다.');
      return;
    }

    if (member.userType === USER_TYPES.MANAGER) {
      alert('매니저는 내보낼 수 없습니다. 먼저 권한을 변경해주세요.');
      return;
    }

    const confirmed = window.confirm(
      `${member.displayName}님을 내보내시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );
    if (!confirmed) return;

    try {
      setProcessing(true);
      const spaceId = selectedSpace.id || selectedSpace.spaceId;

      // 1. spaces/{spaceId}/assignedUsers/{userId} 삭제
      const spaceUserRef = doc(db, `spaces/${spaceId}/assignedUsers`, member.userId);
      await deleteDoc(spaceUserRef);

      // 2. users/{userId}/spaceAccess/{spaceId} 삭제
      const userSpaceRef = doc(db, `users/${member.userId}/spaceAccess`, spaceId);
      await deleteDoc(userSpaceRef);

      alert('멤버가 내보내졌습니다.');
      await loadMembers();
    } catch (error) {
      console.error('멤버 내보내기 실패:', error);
      alert('멤버 내보내기에 실패했습니다.');
    } finally {
      setProcessing(false);
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
              <h1 className="text-xl font-bold text-white">멤버 관리</h1>
              <p className="text-sm text-slate-300">{selectedSpace?.spaceName || ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 멤버 목록 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <Users className="w-5 h-5" />
            <span className="font-medium">전체 멤버 {members.length}명</span>
          </div>
        </div>

        <div className="space-y-3">
          {members.map(member => {
            const isCurrentUser = member.userId === user.id;
            const joinedDate = member.joinedAt?.toDate?.() || null;

            return (
              <div
                key={member.userId}
                className="bg-gradient-to-br from-slate-800/80 to-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* 프로필 */}
                  <div className="flex items-center gap-3 flex-1">
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

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white truncate">
                          {member.displayName}
                        </h3>
                        {isCurrentUser && (
                          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                            나
                          </span>
                        )}
                      </div>
                      {member.email && (
                        <p className="text-sm text-slate-400 truncate">{member.email}</p>
                      )}
                      {joinedDate && (
                        <p className="text-xs text-slate-500 mt-1">
                          가입일: {joinedDate.toLocaleDateString('ko-KR')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 권한 배지 */}
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      member.userType === USER_TYPES.MANAGER
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : member.userType === USER_TYPES.VICE_MANAGER
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        : member.userType === USER_TYPES.SHAREHOLDER
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                    }`}>
                      {USER_TYPE_LABELS[member.userType]}
                    </div>
                  </div>
                </div>

                {/* 관리 버튼 */}
                {!isCurrentUser && (
                  <div className="mt-4 pt-4 border-t border-slate-600/30 flex gap-2">
                    {/* 권한 변경 드롭다운 */}
                    <select
                      value={member.userType}
                      onChange={(e) => handleChangeUserType(member, e.target.value)}
                      disabled={processing}
                      className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                    >
                      <option value={USER_TYPES.GUEST}>{USER_TYPE_LABELS.guest}</option>
                      <option value={USER_TYPES.SHAREHOLDER}>{USER_TYPE_LABELS.shareholder}</option>
                      <option value={USER_TYPES.VICE_MANAGER}>{USER_TYPE_LABELS['vice-manager']}</option>
                    </select>

                    {/* 내보내기 버튼 */}
                    <button
                      onClick={() => handleRemoveMember(member)}
                      disabled={processing || member.userType === USER_TYPES.MANAGER}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <UserMinus className="w-4 h-4" />
                      <span className="text-sm">내보내기</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-2">권한 관리 안내</p>
              <ul className="space-y-1 text-blue-200/80">
                <li>• 매니저만 멤버의 권한을 변경하거나 내보낼 수 있습니다.</li>
                <li>• 매니저는 권한 변경 드롭다운에 표시되지 않으며, 내보낼 수 없습니다.</li>
                <li>• 본인의 권한은 변경할 수 없습니다.</li>
                <li>• 멤버를 내보내면 양방향으로 삭제되어 복구할 수 없습니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 로딩 오버레이 */}
      {processing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 shadow-2xl">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-center">처리 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}

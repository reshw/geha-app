import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle, Clock, XCircle, Filter } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import { canManageSpace } from '../utils/permissions';
import expenseService from '../services/expenseService';
import ExpenseDetailModal from '../components/expenses/ExpenseDetailModal';

const ExpenseListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedSpace } = useStore();
  const [expenseGroups, setExpenseGroups] = useState([]); // groupId 기준으로 그룹핑된 데이터
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null); // 상세보기 선택된 그룹
  
  const isManager = selectedSpace?.userType && canManageSpace(selectedSpace.userType);
  
  // Firebase에서 실제 데이터 로드
  useEffect(() => {
    const loadExpenses = async () => {
      if (!selectedSpace?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('💰 운영비 데이터 로드 시작:', selectedSpace.id);
        
        const expenses = await expenseService.getExpenses(selectedSpace.id);
        console.log('📦 로드된 운영비:', expenses);
        
        // groupId 기준으로 그룹핑
        const groupMap = new Map();
        
        expenses.forEach(expense => {
          const groupId = expense.groupId;
          
          if (!groupMap.has(groupId)) {
            groupMap.set(groupId, {
              groupId,
              items: [],
              totalAmount: 0,
              userName: expense.userName,
              UserId: expense.UserId,
              createdAt: expense.createdAt,
              usedAt: expense.usedAt,
              memo: expense.memo,
              status: expense.status, // pending, approved, rejected
              approved: expense.approved,
              approvedAt: expense.approvedAt,
              approvedBy: expense.approvedBy,
              approvedByName: expense.approvedByName,
              rejectedAt: expense.rejectedAt,
              rejectedBy: expense.rejectedBy,
              rejectedByName: expense.rejectedByName,
              rejectionReason: expense.rejectionReason,
            });
          }
          
          const group = groupMap.get(groupId);
          group.items.push(expense);
          group.totalAmount += expense.total;
        });
        
        const groups = Array.from(groupMap.values());
        // 최신순 정렬
        groups.sort((a, b) => b.createdAt - a.createdAt);
        
        setExpenseGroups(groups);
        console.log('✅ 그룹핑 완료:', groups.length);
      } catch (error) {
        console.error('❌ 운영비 로드 실패:', error);
        alert('운영비 내역을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    loadExpenses();
  }, [selectedSpace?.id]); // ✅ selectedSpace 전체가 아닌 id만 의존성으로
  
  const filteredExpenses = expenseGroups.filter(group => {
    if (filter === 'all') return true;
    return group.status === filter;
  });
  
  const pendingCount = expenseGroups.filter(g => g.status === 'pending').length;
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3" />
            대기중
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            승인됨
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
            <XCircle className="w-3 h-3" />
            거부됨
          </span>
        );
      default:
        return null;
    }
  };
  
  const formatCurrency = (amount) => {
    return amount.toLocaleString('ko-KR') + '원';
  };
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">공용 운영비</h1>
              <p className="text-white/80 text-sm mt-1">
                {selectedSpace?.spaceName || '스페이스'} 운영비 내역
              </p>
            </div>
          </div>
          
          {/* 필터 탭 */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                filter === 'all'
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              전체 ({expenseGroups.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                filter === 'pending'
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              대기중 ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                filter === 'approved'
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              승인됨 ({expenseGroups.filter(g => g.status === 'approved').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                filter === 'rejected'
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              거부됨 ({expenseGroups.filter(g => g.status === 'rejected').length})
            </button>
          </div>
        </div>
      </div>
      
      {/* 내역 리스트 */}
      <div className="max-w-2xl mx-auto p-4 pb-32">
        {filteredExpenses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">
              {filter === 'all' ? '아직 운영비 내역이 없습니다' : `${filter === 'pending' ? '대기중인' : filter === 'approved' ? '승인된' : '거부된'} 항목이 없습니다`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((group) => (
              <div
                key={group.groupId}
                className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedGroup(group)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{group.userName}</span>
                      {getStatusBadge(group.status)}
                    </div>
                    <div className="text-sm text-gray-500">{formatDate(group.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(group.totalAmount)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {group.items.length}개 항목
                    </div>
                  </div>
                </div>
                
                {/* 항목 요약 */}
                <div className="text-sm text-gray-600 space-y-1">
                  {group.items.slice(0, 2).map((item, idx) => {
                    const name = item.itemName || '항목명 없음';
                    const spec = item.itemSpec || '';
                    const qty = item.itemQty || 0;
                    const amount = item.total || 0;
                    
                    return (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {name}
                          {spec && ` (${spec})`}
                          {qty > 0 && ` x ${qty}`}
                        </span>
                        <span>{formatCurrency(amount)}</span>
                      </div>
                    );
                  })}
                  {group.items.length > 2 && (
                    <div className="text-gray-400">외 {group.items.length - 2}개 항목</div>
                  )}
                </div>
                
                {/* 메모 */}
                {group.memo && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-500">{group.memo}</p>
                  </div>
                )}
                
                {/* 승인 정보 */}
                {group.status === 'approved' && group.approvedByName && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-sm text-green-600">
                      승인자: {group.approvedByName} · {formatDate(group.approvedAt)}
                    </p>
                  </div>
                )}
                
                {/* 거부 사유 */}
                {group.status === 'rejected' && group.rejectionReason && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-sm text-red-600">
                      거부 사유: {group.rejectionReason}
                    </p>
                    {group.rejectedByName && (
                      <p className="text-xs text-gray-500 mt-1">
                        거부자: {group.rejectedByName} · {formatDate(group.rejectedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 플로팅 버튼들 */}
      <div className="fixed right-6 flex flex-col gap-3"
        style={{
          bottom: 'max(24px, env(safe-area-inset-bottom, 24px))'
        }}
      >
        {/* 관리자만: 승인 대기 버튼 */}
        {isManager && pendingCount > 0 && (
          <button
            onClick={() => navigate('/expenses/approval')}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-semibold"
          >
            <CheckCircle className="w-5 h-5" />
            승인 대기 {pendingCount}건
          </button>
        )}
        
        {/* 모든 사용자: 청구하기 버튼 */}
        <button
          onClick={() => navigate('/expenses/request')}
          className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
      
      {/* 상세보기 모달 */}
      {selectedGroup && (
        <ExpenseDetailModal
          group={selectedGroup}
          selectedSpace={selectedSpace}
          onClose={() => setSelectedGroup(null)}
          onApprove={async (groupId) => {
            await expenseService.approveGroup(
              selectedSpace.id,
              groupId,
              {
                approverId: user.id,
                approverName: user.displayName || user.name
              }
            );
            // 데이터 새로고침
            const expenses = await expenseService.getExpenses(selectedSpace.id);
            const groupMap = new Map();
            expenses.forEach(expense => {
              const gId = expense.groupId;
              if (!groupMap.has(gId)) {
                groupMap.set(gId, {
                  groupId: gId,
                  items: [],
                  totalAmount: 0,
                  userName: expense.userName,
                  UserId: expense.UserId,
                  createdAt: expense.createdAt,
                  usedAt: expense.usedAt,
                  memo: expense.memo,
                  status: expense.status,
                  approved: expense.approved,
                  approvedAt: expense.approvedAt,
                  approvedBy: expense.approvedBy,
                  approvedByName: expense.approvedByName,
                });
              }
              const grp = groupMap.get(gId);
              grp.items.push(expense);
              grp.totalAmount += expense.total;
            });
            const groups = Array.from(groupMap.values());
            groups.sort((a, b) => b.createdAt - a.createdAt);
            setExpenseGroups(groups);
          }}
          onReject={async (groupId, reason) => {
            await expenseService.rejectGroup(
              selectedSpace.id,
              groupId,
              {
                rejecterId: user.id,
                rejecterName: user.displayName || user.name
              },
              reason
            );
            // 데이터 새로고침
            const expenses = await expenseService.getExpenses(selectedSpace.id);
            const groupMap = new Map();
            expenses.forEach(expense => {
              const gId = expense.groupId;
              if (!groupMap.has(gId)) {
                groupMap.set(gId, {
                  groupId: gId,
                  items: [],
                  totalAmount: 0,
                  userName: expense.userName,
                  UserId: expense.UserId,
                  createdAt: expense.createdAt,
                  usedAt: expense.usedAt,
                  memo: expense.memo,
                  status: expense.status,
                  approved: expense.approved,
                  rejectedAt: expense.rejectedAt,
                  rejectedBy: expense.rejectedBy,
                  rejectedByName: expense.rejectedByName,
                  rejectionReason: expense.rejectionReason,
                });
              }
              const grp = groupMap.get(gId);
              grp.items.push(expense);
              grp.totalAmount += expense.total;
            });
            const groups = Array.from(groupMap.values());
            groups.sort((a, b) => b.createdAt - a.createdAt);
            setExpenseGroups(groups);
          }}
        />
      )}
    </div>
  );
};

export default ExpenseListPage;
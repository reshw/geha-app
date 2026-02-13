import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, User, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Filter, Settings, X, ArrowLeft } from 'lucide-react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import useStore from '../store/useStore';
import expenseService from '../services/expenseService';
import spaceSettingsService from '../services/spaceSettingsService';
import ExpenseDetailModal from '../components/expenses/ExpenseDetailModal';
import { canManageSpace, canAccessFinance } from '../utils/permissions';

const ExpenseListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedSpace } = useStore();
  
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [expandedId, setExpandedId] = useState(null); // 하나만 열리도록
  
  // 날짜 필터
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // 기본 필터 설정 (매니저 이상)
  const [showDefaultSettings, setShowDefaultSettings] = useState(false);
  const [defaultFilter, setDefaultFilter] = useState('all');
  const [defaultDateRange, setDefaultDateRange] = useState('all'); // all, month, week, custom
  const [defaultStartDate, setDefaultStartDate] = useState('');
  const [defaultEndDate, setDefaultEndDate] = useState('');
  
  const isManager = selectedSpace?.userType && canManageSpace(selectedSpace.userType);
  
  // 권한 체크 및 운영비 목록 조회
  useEffect(() => {
    const checkPermissionAndLoad = async () => {
      if (!selectedSpace?.id || !user) return;

      try {
        const financePermission = await spaceSettingsService.getFinancePermission(selectedSpace.id);
        const hasAccess = canAccessFinance(selectedSpace.userType, financePermission);

        if (!hasAccess) {
          alert('재정 관리 페이지에 접근 권한이 없습니다.');
          navigate('/');
          return;
        }

        loadExpenses();
        loadDefaultSettings();
      } catch (error) {
        console.error('권한 체크 실패:', error);
      }
    };

    checkPermissionAndLoad();
  }, [selectedSpace, user, navigate]);
  
  // 필터링
  useEffect(() => {
    applyFilter();
  }, [expenses, filter, startDate, endDate]);
  
  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await expenseService.getExpenses(selectedSpace.id);
      setExpenses(data);
    } catch (error) {
      console.error('운영비 조회 실패:', error);
      alert('운영비 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadDefaultSettings = async () => {
    try {
      // Firebase에서 스페이스별 기본 설정 불러오기
      const settingsRef = doc(db, 'spaces', selectedSpace.id, 'settings', 'expenseList');
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        const settings = settingsSnap.data();
        setDefaultFilter(settings.defaultFilter || 'all');
        setDefaultDateRange(settings.defaultDateRange || 'all');
        setDefaultStartDate(settings.defaultStartDate || '');
        setDefaultEndDate(settings.defaultEndDate || '');
        
        // 기본 필터 적용
        setFilter(settings.defaultFilter || 'all');
        
        // 기본 날짜 범위 적용
        if (settings.defaultDateRange === 'month') {
          const today = new Date();
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          setStartDate(firstDay.toISOString().split('T')[0]);
          setEndDate(new Date().toISOString().split('T')[0]);
        } else if (settings.defaultDateRange === 'week') {
          const today = new Date();
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          setStartDate(weekAgo.toISOString().split('T')[0]);
          setEndDate(today.toISOString().split('T')[0]);
        } else if (settings.defaultDateRange === 'custom') {
          setStartDate(settings.defaultStartDate || '');
          setEndDate(settings.defaultEndDate || '');
        }
      }
    } catch (error) {
      console.log('기본 설정 불러오기 실패 (설정 없음):', error);
    }
  };
  
  const saveDefaultSettings = async () => {
    try {
      // custom 날짜 범위 선택 시 유효성 검사
      if (defaultDateRange === 'custom') {
        if (!defaultStartDate || !defaultEndDate) {
          alert('시작일과 종료일을 모두 입력해주세요.');
          return;
        }
        if (new Date(defaultStartDate) > new Date(defaultEndDate)) {
          alert('시작일은 종료일보다 이전이어야 합니다.');
          return;
        }
      }
      
      const settingsRef = doc(db, 'spaces', selectedSpace.id, 'settings', 'expenseList');
      await setDoc(settingsRef, {
        defaultFilter: defaultFilter,
        defaultDateRange: defaultDateRange,
        defaultStartDate: defaultStartDate,
        defaultEndDate: defaultEndDate,
        updatedBy: user.displayName || user.name,
        updatedAt: Timestamp.fromDate(new Date()),
      });
      
      alert('기본 설정이 저장되었습니다!\n모든 사용자에게 적용됩니다.');
      setShowDefaultSettings(false);
      
      // 즉시 적용
      setFilter(defaultFilter);
      if (defaultDateRange === 'month') {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(new Date().toISOString().split('T')[0]);
      } else if (defaultDateRange === 'week') {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        setStartDate(weekAgo.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
      } else if (defaultDateRange === 'custom') {
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
      } else {
        setStartDate('');
        setEndDate('');
      }
    } catch (error) {
      console.error('기본 설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
    }
  };
  
  const applyFilter = () => {
    let filtered = expenses;
    
    // 상태 필터
    if (filter === 'pending') {
      filtered = filtered.filter(e => e.status === 'pending');
    } else if (filter === 'approved') {
      filtered = filtered.filter(e => e.status === 'approved');
    } else if (filter === 'rejected') {
      filtered = filtered.filter(e => e.status === 'rejected');
    }
    
    // 날짜 필터
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(e => {
        const usedDate = new Date(e.usedAt);
        usedDate.setHours(0, 0, 0, 0);
        return usedDate >= start;
      });
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(e => {
        const usedDate = new Date(e.usedAt);
        return usedDate <= end;
      });
    }
    
    setFilteredExpenses(filtered);
  };
  
  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };
  
  const handleApprove = async (expenseId) => {
    try {
      await expenseService.approveExpense(
        selectedSpace.id,
        expenseId,
        {
          approverId: user.id,
          approverName: user.displayName || user.name,
        }
      );
      
      alert('승인이 완료되었습니다!');
      await loadExpenses();
      setSelectedExpense(null);
    } catch (error) {
      console.error('승인 실패:', error);
      throw error;
    }
  };
  
  const handleReject = async (expenseId, reason) => {
    try {
      await expenseService.rejectExpense(
        selectedSpace.id,
        expenseId,
        {
          rejecterId: user.id,
          rejecterName: user.displayName || user.name,
        },
        reason
      );
      
      alert('거부가 완료되었습니다!');
      await loadExpenses();
      setSelectedExpense(null);
    } catch (error) {
      console.error('거부 실패:', error);
      throw error;
    }
  };
  
  const toggleExpand = (id) => {
    // 같은 거 클릭하면 닫기, 다른 거 클릭하면 그것만 열기
    setExpandedId(expandedId === id ? null : id);
  };
  
  const formatCurrency = (amount) => {
    return amount.toLocaleString('ko-KR') + '원';
  };
  
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getItemsSummary = (expense) => {
    // 입금 타입 처리
    if (expense.type === 'income') {
      return expense.itemName || '입금';
    }

    // 지출 타입 처리 (기존 로직)
    const items = expense.items;
    if (!items || items.length === 0) return '항목 없음';
    if (items.length === 1) return items[0].itemName;
    if (items.length === 2) return `${items[0].itemName}, ${items[1].itemName}`;
    return `${items[0].itemName}, ${items[1].itemName} 외 ${items.length - 2}개`;
  };
  
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
            승인
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
            <XCircle className="w-3 h-3" />
            거부
          </span>
        );
      default:
        return null;
    }
  };
  
  // 잔액 계산
  const balance = useMemo(() => {
    const approvedIncomes = filteredExpenses.filter(e =>
      e.status === 'approved' && e.type === 'income'
    );
    const approvedExpenses = filteredExpenses.filter(e =>
      e.status === 'approved' && (e.type === 'expense' || !e.type)
    );

    const totalIncome = approvedIncomes.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
    const totalExpense = approvedExpenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    };
  }, [filteredExpenses]);

  // 날짜별 그룹화 (최신순)
  const groupedByDate = useMemo(() => {
    const groups = {};

    filteredExpenses.forEach(expense => {
      const date = new Date(expense.usedAt);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: date,
          expenses: [],
          totalIncome: 0,
          totalExpense: 0
        };
      }

      groups[dateKey].expenses.push(expense);

      // 일자별 합계
      if (expense.type === 'income') {
        groups[dateKey].totalIncome += expense.totalAmount || 0;
      } else {
        groups[dateKey].totalExpense += expense.totalAmount || 0;
      }
    });

    // 날짜별로 정렬 (최신순)
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .map(([dateKey, data]) => ({ dateKey, ...data }));
  }, [filteredExpenses]);

  // 날짜 표시 포맷 (오늘/어제/날짜)
  const getDateLabel = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate.getTime() === today.getTime()) {
      return '오늘';
    } else if (targetDate.getTime() === yesterday.getTime()) {
      return '어제';
    } else {
      return formatDate(date);
    }
  };

  const counts = useMemo(() => {
    // 날짜 필터가 적용된 expenses를 기준으로 카운트
    let dateFiltered = expenses;

    // 날짜 필터 적용
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFiltered = dateFiltered.filter(e => {
        const usedDate = new Date(e.usedAt);
        usedDate.setHours(0, 0, 0, 0);
        return usedDate >= start;
      });
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFiltered = dateFiltered.filter(e => {
        const usedDate = new Date(e.usedAt);
        return usedDate <= end;
      });
    }
    
    return {
      all: dateFiltered.length,
      pending: dateFiltered.filter(e => e.status === 'pending').length,
      approved: dateFiltered.filter(e => e.status === 'approved').length,
      rejected: dateFiltered.filter(e => e.status === 'rejected').length,
    };
  }, [expenses, startDate, endDate]);
  
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">💰 공용 운영비</h1>
              <p className="text-white/80 text-sm mt-1">
                {selectedSpace?.spaceName || '스페이스'} 운영비 관리
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`p-2 rounded-lg transition-colors ${
                showDateFilter || startDate || endDate
                  ? 'bg-white/30'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            {isManager && (
              <button
                onClick={() => setShowDefaultSettings(true)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* 날짜 필터 */}
      {showDateFilter && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">📅 기간 필터</h3>
              {(startDate || endDate) && (
                <button
                  onClick={clearDateFilter}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  초기화
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">시작일</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">종료일</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {(startDate || endDate) && (
              <div className="text-sm text-gray-600 text-center">
                {startDate && endDate
                  ? `${startDate} ~ ${endDate}`
                  : startDate
                  ? `${startDate} 이후`
                  : `${endDate} 이전`
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* 잔액 카드 */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-80 mb-1">현재 잔액</div>
          <div className="text-4xl font-bold mb-3">
            {formatCurrency(balance.balance)}
          </div>
          <div className="flex justify-between text-sm opacity-90">
            <span>💰 입금 {formatCurrency(balance.totalIncome)}</span>
            <span>💸 지출 {formatCurrency(balance.totalExpense)}</span>
          </div>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 min-w-[80px] px-4 py-3 font-semibold transition-colors ${
                filter === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600'
              }`}
            >
              전체 ({counts.all})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`flex-1 min-w-[80px] px-4 py-3 font-semibold transition-colors ${
                filter === 'pending'
                  ? 'text-yellow-600 border-b-2 border-yellow-600'
                  : 'text-gray-600'
              }`}
            >
              대기중 ({counts.pending})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`flex-1 min-w-[80px] px-4 py-3 font-semibold transition-colors ${
                filter === 'approved'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600'
              }`}
            >
              승인 ({counts.approved})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`flex-1 min-w-[80px] px-4 py-3 font-semibold transition-colors ${
                filter === 'rejected'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600'
              }`}
            >
              거부 ({counts.rejected})
            </button>
          </div>
        </div>
      </div>
      
      {/* 목록 */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">로딩 중...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <p className="text-gray-500">
              {filter === 'all'
                ? (startDate || endDate ? '해당 기간에 운영비 내역이 없습니다.' : '운영비 내역이 없습니다.')
                : `${filter === 'pending' ? '대기중인' : filter === 'approved' ? '승인된' : '거부된'} 청구가 없습니다.`
              }
            </p>
          </div>
        ) : (
          groupedByDate.map((dateGroup) => (
            <div key={dateGroup.dateKey} className="space-y-3">
              {/* 날짜 헤더 */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg px-4 py-3 border-l-4 border-blue-500 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-gray-900">{getDateLabel(dateGroup.date)}</span>
                    <span className="text-sm text-gray-500">
                      {getDateLabel(dateGroup.date) === '오늘' || getDateLabel(dateGroup.date) === '어제'
                        ? `(${formatDate(dateGroup.date)})`
                        : ''
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {dateGroup.totalIncome > 0 && (
                      <span className="text-blue-600 font-semibold">
                        +{formatCurrency(dateGroup.totalIncome)}
                      </span>
                    )}
                    {dateGroup.totalExpense > 0 && (
                      <span className="text-red-600 font-semibold">
                        -{formatCurrency(dateGroup.totalExpense)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 해당 날짜의 expense 리스트 */}
              {dateGroup.expenses.map((expense) => {
            const isExpanded = expandedId === expense.id;
            
            return (
              <div
                key={expense.id}
                className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${
                  isExpanded ? 'ring-2 ring-blue-500 shadow-lg' : ''
                }`}
              >
                {/* 헤더 */}
                <div
                  className={`p-4 cursor-pointer transition-colors ${
                    isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleExpand(expense.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">
                        {expense.userName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        expense.type === 'income'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {expense.type === 'income' ? '입금' : '지출'}
                      </span>
                      {getStatusBadge(expense.status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    {expense.type === 'income' ? '입금일' : '사용일'}: {formatDate(expense.usedAt)}
                  </div>

                  {/* 품목 요약 */}
                  <div className="text-sm text-gray-700 mb-2 line-clamp-1">
                    {getItemsSummary(expense)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {expense.type === 'income'
                        ? (expense.transactionType === 'auto_guest_reservation' ? '🏠 게스트 예약' : '입금')
                        : `${expense.items?.length || 0}개 품목`
                      }
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-bold ${
                        expense.type === 'income' ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.totalAmount)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-blue-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 상세 (접혔다 펼쳐짐) */}
                {isExpanded && (
                  <div className="border-t-2 border-blue-200 p-4 bg-blue-50/50 space-y-3 animate-fadeIn">
                    {/* 품목 내역 */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        {expense.type === 'income' ? '💰 입금 정보' : '📋 품목 내역'}
                      </h4>
                      {expense.type === 'income' ? (
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex justify-between items-center">
                            <div className="font-medium text-gray-900">
                              {expense.itemName}
                              {expense.transactionType === 'auto_guest_reservation' && expense.guestInfo && (
                                <div className="text-xs text-gray-500 mt-1">
                                  게스트: {expense.guestInfo.name} · {expense.guestInfo.nights}박
                                </div>
                              )}
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              +{formatCurrency(expense.totalAmount)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {expense.items?.map((item, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-3 flex justify-between shadow-sm">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {item.itemName}
                                  {item.itemSpec && (
                                    <span className="text-gray-500 text-sm ml-1">({item.itemSpec})</span>
                                  )}
                                </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {formatCurrency(item.itemPrice)} × {item.itemQty}
                              </div>
                            </div>
                            <div className="font-bold text-gray-900 text-lg">
                              {formatCurrency(item.total)}
                            </div>
                          </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 메모 */}
                    {expense.memo && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          📝 메모
                        </h4>
                        <p className="text-sm text-gray-700">{expense.memo}</p>
                      </div>
                    )}
                    
                    {/* 상세보기 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExpense(expense);
                      }}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      상세보기 및 승인/거부
                    </button>
                  </div>
                )}
              </div>
            );
          })}
            </div>
          ))
        )}
      </div>
      
      {/* 플로팅 버튼 */}
      <button
        onClick={() => navigate('/expenses/request')}
        className="fixed right-4 bottom-20 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center hover:scale-110"
        style={{ bottom: 'calc(70px + env(safe-area-inset-bottom))' }}
      >
        <Plus className="w-6 h-6" />
      </button>
      
      {/* 기본 설정 모달 (매니저 전용) */}
      {showDefaultSettings && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => setShowDefaultSettings(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl z-[101] max-w-md mx-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">⚙️ 기본 설정</h3>
              <button
                onClick={() => setShowDefaultSettings(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-900">
                💡 <strong>매니저 전용:</strong> 모든 사용자가 페이지를 열 때 표시될 초기 필터를 설정합니다.
              </p>
            </div>
            
            <div className="space-y-4">
              {/* 기본 상태 필터 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  기본 상태 필터
                </label>
                <select
                  value={defaultFilter}
                  onChange={(e) => setDefaultFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체</option>
                  <option value="pending">대기중만 표시</option>
                  <option value="approved">승인만 표시</option>
                  <option value="rejected">거부만 표시</option>
                </select>
              </div>
              
              {/* 기본 날짜 범위 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  기본 날짜 범위
                </label>
                <select
                  value={defaultDateRange}
                  onChange={(e) => setDefaultDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체 기간</option>
                  <option value="week">최근 1주일</option>
                  <option value="month">이번 달</option>
                  <option value="custom">날짜 직접 지정</option>
                </select>
              </div>
              
              {/* 날짜 직접 지정 */}
              {defaultDateRange === 'custom' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      시작일
                    </label>
                    <input
                      type="date"
                      value={defaultStartDate}
                      onChange={(e) => setDefaultStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      종료일
                    </label>
                    <input
                      type="date"
                      value={defaultEndDate}
                      onChange={(e) => setDefaultEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {defaultStartDate && defaultEndDate && (
                    <p className="text-xs text-center text-gray-600">
                      📅 {defaultStartDate} ~ {defaultEndDate}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDefaultSettings(false)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={saveDefaultSettings}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* 상세보기 모달 */}
      {selectedExpense && (
        <ExpenseDetailModal
          expense={selectedExpense}
          selectedSpace={selectedSpace}
          onClose={() => setSelectedExpense(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default ExpenseListPage;
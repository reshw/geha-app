import { useState } from 'react';
import { Play, AlertTriangle, CheckCircle, Key } from 'lucide-react';
import { runMigration, runMigrationConfirmed } from '../services/migrateExpenses';
import { collection, getDocs, writeBatch, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import tierService from '../services/tierService';

const MigrationPage = () => {
  const [spaceId, setSpaceId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);

  // Type 필드 마이그레이션
  const [typeSpaceId, setTypeSpaceId] = useState('');
  const [isTypeRunning, setIsTypeRunning] = useState(false);
  const [typeLogs, setTypeLogs] = useState([]);
  const [typeResult, setTypeResult] = useState(null);

  // TierConfig 초기화 (테스트 스페이스 jwbIZM)
  const [isTierInitRunning, setIsTierInitRunning] = useState(false);
  const [tierInitLogs, setTierInitLogs] = useState([]);
  const [tierInitResult, setTierInitResult] = useState(null);
  
  // 콘솔 출력을 화면에 표시
  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, time: new Date() }]);
  };

  const addTypeLog = (message, type = 'info') => {
    setTypeLogs(prev => [...prev, { message, type, time: new Date() }]);
  };

  const addTierInitLog = (message, type = 'info') => {
    setTierInitLogs(prev => [...prev, { message, type, time: new Date() }]);
  };
  
  // Dry Run 실행
  const handleDryRun = async () => {
    if (!spaceId.trim()) {
      alert('방 코드를 입력해주세요.');
      return;
    }
    
    setIsRunning(true);
    setLogs([]);
    setResult(null);
    
    try {
      addLog('🔍 Dry Run 시작...', 'info');
      addLog(`📍 방 코드: ${spaceId}`, 'info');
      
      const previewResult = await runMigration(spaceId);
      
      setResult(previewResult);
      addLog('✅ Dry Run 완료!', 'success');
      addLog(`📊 발견된 그룹: ${previewResult.groups}개`, 'info');
      addLog(`📄 기존 문서: ${previewResult.oldDocs}개`, 'info');
      addLog(`📄 새 문서: ${previewResult.newDocs}개`, 'info');
      addLog(`💾 절감: ${previewResult.oldDocs - previewResult.newDocs}개`, 'success');
      
    } catch (error) {
      console.error('Dry Run 실패:', error);
      addLog(`❌ 오류 발생: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };
  
  // 실제 마이그레이션 실행
  const handleRealRun = async () => {
    if (!spaceId.trim()) {
      alert('방 코드를 입력해주세요.');
      return;
    }
    
    if (!result || result.dryRun !== true) {
      alert('먼저 Dry Run을 실행해주세요.');
      return;
    }
    
    const confirmed = window.confirm(
      `⚠️ 주의: 이 작업은 되돌릴 수 없습니다!\n\n` +
      `방 코드: ${spaceId}\n` +
      `삭제될 문서: ${result.oldDocs}개\n` +
      `생성될 문서: ${result.newDocs}개\n\n` +
      `계속하시겠습니까?`
    );
    
    if (!confirmed) return;
    
    const doubleCheck = window.confirm(
      '정말로 실행하시겠습니까?\n백업은 완료하셨나요?'
    );
    
    if (!doubleCheck) return;
    
    setIsRunning(true);
    setLogs([]);
    
    try {
      addLog('🚀 실제 마이그레이션 시작...', 'info');
      
      const finalResult = await runMigrationConfirmed(spaceId);
      
      setResult(finalResult);
      addLog('🎉 마이그레이션 완료!', 'success');
      addLog(`✅ ${finalResult.oldDocs}개 → ${finalResult.newDocs}개`, 'success');
      
      setTimeout(() => {
        alert('마이그레이션이 완료되었습니다!\n페이지를 새로고침 해주세요.');
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('마이그레이션 실패:', error);
      addLog(`❌ 오류 발생: ${error.message}`, 'error');
      alert('마이그레이션 실패! Firebase Console을 확인해주세요.');
    } finally {
      setIsRunning(false);
    }
  };

  // Type 필드 추가 마이그레이션 - Dry Run
  const handleTypeFieldDryRun = async () => {
    if (!typeSpaceId.trim()) {
      alert('방 코드를 입력해주세요.');
      return;
    }

    setIsTypeRunning(true);
    setTypeLogs([]);
    setTypeResult(null);

    try {
      addTypeLog('🔍 Type 필드 Dry Run 시작...', 'info');
      addTypeLog(`📍 방 코드: ${typeSpaceId}`, 'info');

      const expensesRef = collection(db, 'spaces', typeSpaceId, 'Expense');
      const snapshot = await getDocs(expensesRef);

      let needsUpdate = 0;
      let alreadyHasType = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.type) {
          needsUpdate++;
        } else {
          alreadyHasType++;
        }
      });

      const total = snapshot.size;

      setTypeResult({
        dryRun: true,
        total,
        needsUpdate,
        alreadyHasType
      });

      addTypeLog('✅ Dry Run 완료!', 'success');
      addTypeLog(`📊 전체 문서: ${total}개`, 'info');
      addTypeLog(`✏️ 업데이트 필요: ${needsUpdate}개`, 'warning');
      addTypeLog(`✅ 이미 처리됨: ${alreadyHasType}개`, 'success');

    } catch (error) {
      console.error('Type Field Dry Run 실패:', error);
      addTypeLog(`❌ 오류 발생: ${error.message}`, 'error');
    } finally {
      setIsTypeRunning(false);
    }
  };

  // Type 필드 추가 마이그레이션 - 실제 실행
  const handleTypeFieldRealRun = async () => {
    if (!typeSpaceId.trim()) {
      alert('방 코드를 입력해주세요.');
      return;
    }

    if (!typeResult || typeResult.dryRun !== true) {
      alert('먼저 Dry Run을 실행해주세요.');
      return;
    }

    const confirmed = window.confirm(
      `⚠️ Type 필드 마이그레이션을 실행합니다!\n\n` +
      `방 코드: ${typeSpaceId}\n` +
      `업데이트될 문서: ${typeResult.needsUpdate}개\n\n` +
      `모든 기존 expense 문서에 type: 'expense' 필드가 추가됩니다.\n\n` +
      `계속하시겠습니까?`
    );

    if (!confirmed) return;

    setIsTypeRunning(true);
    setTypeLogs([]);

    try {
      addTypeLog('🚀 Type 필드 마이그레이션 시작...', 'info');

      const expensesRef = collection(db, 'spaces', typeSpaceId, 'Expense');
      const snapshot = await getDocs(expensesRef);

      const batch = writeBatch(db);
      let count = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.type) {
          batch.update(docSnap.ref, {
            type: 'expense',
            transactionType: 'manual'
          });
          count++;
        }
      });

      await batch.commit();

      setTypeResult({
        dryRun: false,
        updated: count
      });

      addTypeLog('🎉 마이그레이션 완료!', 'success');
      addTypeLog(`✅ ${count}개 문서 업데이트 완료`, 'success');

      setTimeout(() => {
        alert('Type 필드 마이그레이션이 완료되었습니다!');
      }, 1000);

    } catch (error) {
      console.error('Type Field 마이그레이션 실패:', error);
      addTypeLog(`❌ 오류 발생: ${error.message}`, 'error');
      alert('마이그레이션 실패! Firebase Console을 확인해주세요.');
    } finally {
      setIsTypeRunning(false);
    }
  };

  // TierConfig 초기화 (테스트 스페이스 jwbIZM)
  const handleTierConfigInit = async () => {
    const testSpaceId = 'jwbIZM';

    setIsTierInitRunning(true);
    setTierInitLogs([]);
    setTierInitResult(null);

    try {
      addTierInitLog('🔍 TierConfig 초기화 시작...', 'info');
      addTierInitLog(`📍 테스트 스페이스: ${testSpaceId}`, 'info');

      // 이미 존재하는지 확인
      const tierRef = doc(db, `spaces/${testSpaceId}/settings`, 'tiers');
      const tierDoc = await getDoc(tierRef);

      if (tierDoc.exists()) {
        addTierInitLog('⚠️ 이미 tierConfig가 존재합니다', 'warning');
        setTierInitResult({
          alreadyExists: true,
          data: tierDoc.data()
        });
        return;
      }

      // 기본 tierConfig 생성
      const defaultConfig = {
        tierNames: {
          master: '매니저',
          'vice-master': '부매니저',
          c2: '주주',
          c1: '게스트',
          c3: null,
          c4: null
        },
        tierLevels: {
          master: 6,
          'vice-master': 5,
          c2: 4,
          c1: 3,
          c3: 2,
          c4: 1
        },
        permissions: {
          finance: {
            view: 'c2',
            createIncome: 'vice-master',
            createExpense: 'vice-master',
            approve: 'master',
            delete: 'master'
          },
          praise: {
            view: 'c1',
            create: 'c1',
            viewStats: 'c2',
            approve: 'vice-master',
            delete: 'master'
          },
          settlement: {
            view: 'c2',
            createBill: 'vice-master',
            approveBill: 'master',
            delete: 'master'
          },
          reservation: {
            create: 'c1',
            createPast: 'vice-master',
            cancelOwn: 'c1',
            cancelAny: 'vice-master',
            viewStats: 'c2'
          },
          expense: {
            view: 'c2',
            create: 'vice-master',
            approve: 'master',
            delete: 'master'
          },
          space: {
            manageMembers: 'vice-master',
            changeSettings: 'master',
            transferOwnership: 'master',
            deleteMember: 'vice-master'
          },
          bartender: {
            view: 'c1',
            order: 'c1',
            manageMenu: 'vice-master',
            viewOrders: 'c2'
          }
        },
        enabledTiers: ['master', 'vice-master', 'c2', 'c1'],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        updatedBy: {
          id: 'migration',
          displayName: 'System Migration'
        }
      };

      await setDoc(tierRef, defaultConfig);

      setTierInitResult({
        alreadyExists: false,
        created: true
      });

      addTierInitLog('🎉 TierConfig 초기화 완료!', 'success');
      addTierInitLog(`✅ spaces/${testSpaceId}/settings/tiers 문서 생성됨`, 'success');
      addTierInitLog(`📊 기본 4개 등급 설정됨`, 'info');
      addTierInitLog(`🔒 기능별 권한 설정 완료`, 'info');

      setTimeout(() => {
        alert('TierConfig 초기화가 완료되었습니다!\n\n테스트 스페이스(jwbIZM)의 설정 페이지에서 확인할 수 있습니다.');
      }, 1000);

    } catch (error) {
      console.error('TierConfig 초기화 실패:', error);
      addTierInitLog(`❌ 오류 발생: ${error.message}`, 'error');
      alert('초기화 실패! Firebase Console을 확인해주세요.');
    } finally {
      setIsTierInitRunning(false);
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            💾 Expense 마이그레이션
          </h1>
          <p className="text-gray-600">
            항목별 개별 문서 → 청구별 단일 문서로 구조 변경
          </p>
        </div>
        
        {/* 경고 */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-900 mb-2">⚠️ 주의사항</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• 이 작업은 되돌릴 수 없습니다.</li>
                <li>• 반드시 Firebase Console에서 백업을 먼저 진행하세요.</li>
                <li>• Dry Run으로 충분히 검토한 후 실행하세요.</li>
                <li>• 마이그레이션 중에는 다른 사용자가 청구를 생성하면 안됩니다.</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* 방 코드 입력 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
            <Key className="w-5 h-5 text-blue-600" />
            방 코드 (Space ID)
          </label>
          <input
            type="text"
            value={spaceId}
            onChange={(e) => setSpaceId(e.target.value)}
            placeholder="예: 308308"
            disabled={isRunning}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <p className="text-sm text-gray-500 mt-2">
            💡 Firebase의 Space ID를 입력하세요 (예: 308308)
          </p>
        </div>
        
        {/* 버튼 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleDryRun}
            disabled={isRunning || !spaceId.trim()}
            className="py-4 px-6 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            1단계: Dry Run (미리보기)
          </button>
          
          <button
            onClick={handleRealRun}
            disabled={isRunning || !result || result.dryRun !== true}
            className="py-4 px-6 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            2단계: 실제 실행
          </button>
        </div>
        
        {/* 결과 */}
        {result && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📊 결과</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{result.groups}</div>
                <div className="text-sm text-gray-600 mt-1 font-semibold">청구 그룹</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                <div className="text-3xl font-bold text-gray-600">{result.oldDocs}</div>
                <div className="text-sm text-gray-600 mt-1 font-semibold">기존 문서</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <div className="text-3xl font-bold text-green-600">{result.newDocs}</div>
                <div className="text-sm text-gray-600 mt-1 font-semibold">새 문서</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-semibold border-2 border-green-200">
                <CheckCircle className="w-5 h-5" />
                {result.oldDocs - result.newDocs}개 문서 절감
              </div>
            </div>
          </div>
        )}
        
        {/* 로그 */}
        {logs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📝 로그</h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className={getLogColor(log.type)}>
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 구분선 */}
        <div className="my-8 border-t-4 border-gray-300"></div>

        {/* Type 필드 마이그레이션 섹션 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🏷️ Type 필드 추가 마이그레이션
          </h1>
          <p className="text-gray-600">
            기존 expense 문서에 type: 'expense' 필드 추가
          </p>
        </div>

        {/* 경고 */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">ℹ️ 안내사항</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 입금/지출 구분을 위해 type 필드를 추가합니다.</li>
                <li>• 기존 모든 문서는 type: 'expense'로 설정됩니다.</li>
                <li>• 이미 type 필드가 있는 문서는 건너뜁니다.</li>
                <li>• 안전한 작업이며 기존 데이터는 변경되지 않습니다.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 방 코드 입력 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
            <Key className="w-5 h-5 text-blue-600" />
            방 코드 (Space ID)
          </label>
          <input
            type="text"
            value={typeSpaceId}
            onChange={(e) => setTypeSpaceId(e.target.value)}
            placeholder="예: 308308"
            disabled={isTypeRunning}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <p className="text-sm text-gray-500 mt-2">
            💡 Firebase의 Space ID를 입력하세요 (예: 308308)
          </p>
        </div>

        {/* 버튼 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleTypeFieldDryRun}
            disabled={isTypeRunning || !typeSpaceId.trim()}
            className="py-4 px-6 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            1단계: Dry Run (미리보기)
          </button>

          <button
            onClick={handleTypeFieldRealRun}
            disabled={isTypeRunning || !typeResult || typeResult.dryRun !== true}
            className="py-4 px-6 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            2단계: 실제 실행
          </button>
        </div>

        {/* Type 결과 */}
        {typeResult && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📊 결과</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{typeResult.total || typeResult.updated}</div>
                <div className="text-sm text-gray-600 mt-1 font-semibold">
                  {typeResult.dryRun ? '전체 문서' : '업데이트 완료'}
                </div>
              </div>
              {typeResult.dryRun && (
                <>
                  <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                    <div className="text-3xl font-bold text-yellow-600">{typeResult.needsUpdate}</div>
                    <div className="text-sm text-gray-600 mt-1 font-semibold">업데이트 필요</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                    <div className="text-3xl font-bold text-green-600">{typeResult.alreadyHasType}</div>
                    <div className="text-sm text-gray-600 mt-1 font-semibold">이미 처리됨</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Type 로그 */}
        {typeLogs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📝 로그</h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
              {typeLogs.map((log, index) => (
                <div key={index} className={getLogColor(log.type)}>
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 구분선 */}
        <div className="my-8 border-t-4 border-purple-300"></div>

        {/* TierConfig 초기화 섹션 (테스트 스페이스 전용) */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-sm p-6 mb-6 border-2 border-purple-200">
          <h1 className="text-2xl font-bold text-purple-900 mb-2 flex items-center gap-2">
            🎖️ 커스텀 등급 시스템 초기화
            <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded">TEST</span>
          </h1>
          <p className="text-purple-700">
            테스트 스페이스 (jwbIZM)에 커스텀 등급 시스템 초기 설정 생성
          </p>
        </div>

        {/* 안내 */}
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-purple-900 mb-2">ℹ️ 안내사항</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• 테스트 스페이스 (jwbIZM)에만 적용됩니다.</li>
                <li>• spaces/jwbIZM/settings/tiers 문서를 생성합니다.</li>
                <li>• 기본 4개 등급 (매니저, 부매니저, 주주, 게스트) 설정됩니다.</li>
                <li>• 기능별 세부 권한이 기본값으로 설정됩니다.</li>
                <li>• 이미 존재하는 경우 건너뜁니다.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 실행 버튼 */}
        <div className="mb-6">
          <button
            onClick={handleTierConfigInit}
            disabled={isTierInitRunning}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            {isTierInitRunning ? '초기화 중...' : 'TierConfig 초기화 실행'}
          </button>
        </div>

        {/* TierConfig 결과 */}
        {tierInitResult && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📊 결과</h3>
            {tierInitResult.alreadyExists ? (
              <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200 text-center">
                <div className="text-2xl mb-2">⚠️</div>
                <div className="font-bold text-yellow-800">이미 TierConfig가 존재합니다</div>
                <div className="text-sm text-yellow-600 mt-2">
                  spaces/jwbIZM/settings/tiers 문서가 이미 생성되어 있습니다.
                </div>
              </div>
            ) : (
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200 text-center">
                <div className="text-2xl mb-2">✅</div>
                <div className="font-bold text-green-800">TierConfig 초기화 완료!</div>
                <div className="text-sm text-green-600 mt-2">
                  커스텀 등급 시스템이 테스트 스페이스에 적용되었습니다.
                </div>
              </div>
            )}
          </div>
        )}

        {/* TierConfig 로그 */}
        {tierInitLogs.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📝 로그</h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
              {tierInitLogs.map((log, index) => (
                <div key={index} className={getLogColor(log.type)}>
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MigrationPage;
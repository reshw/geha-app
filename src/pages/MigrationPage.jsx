import { useState } from 'react';
import { Play, AlertTriangle, CheckCircle, Key } from 'lucide-react';
import { runMigration, runMigrationConfirmed } from '../services/migrateExpenses';

const MigrationPage = () => {
  const [spaceId, setSpaceId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  
  // 콘솔 출력을 화면에 표시
  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, time: new Date() }]);
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
      </div>
    </div>
  );
};

export default MigrationPage;
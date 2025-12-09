/**
 * Expense 마이그레이션 스크립트
 * 
 * 목적: 항목별 개별 문서 구조 → 청구별 단일 문서 구조
 * 
 * 이전 구조:
 * - 2025-01-20T0549_0001 { itemName: "화장지", groupId: "2025-01-20T0549", ... }
 * - 2025-01-20T0549_0002 { itemName: "세제", groupId: "2025-01-20T0549", ... }
 * 
 * 새 구조:
 * - 2025-01-20T0549 { items: [{...}, {...}], totalAmount: 18000, ... }
 */

import { 
  collection, 
  doc,
  getDocs, 
  query,
  orderBy,
  writeBatch,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const migrateExpenses = async (spaceId, dryRun = true) => {
  console.log('🔄 Expense 마이그레이션 시작');
  console.log(`📍 스페이스: ${spaceId}`);
  console.log(`🧪 Dry Run: ${dryRun ? 'ON (실제 변경 안함)' : 'OFF (실제 변경)'}`);
  console.log('---');
  
  try {
    // 1. 현재 모든 Expense 문서 조회
    const expenseRef = collection(db, 'spaces', spaceId, 'Expense');
    const q = query(expenseRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    
    console.log(`📊 총 ${snapshot.size}개 문서 발견`);
    
    // 2. groupId별로 항목 그룹화
    const groupMap = new Map();
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const groupId = data.groupId;
      
      if (!groupId) {
        console.warn(`⚠️  groupId 없는 문서 발견: ${docSnap.id}`);
        return;
      }
      
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          oldDocIds: [],
          items: [],
          metadata: null,
        });
      }
      
      const group = groupMap.get(groupId);
      
      // 항목 정보
      group.items.push({
        itemName: data.itemName || '',
        itemPrice: data.itemPrice || 0,
        itemQty: data.itemQty || 1,
        itemSpec: data.itemSpec || '',
        total: data.total || 0,
      });
      
      // 메타데이터 (첫 번째 항목에서 가져오기)
      if (!group.metadata) {
        group.metadata = {
          UserId: data.UserId,
          userName: data.userName,
          usedAt: data.usedAt,
          createdAt: data.createdAt,
          memo: data.memo || '',
          imageUrl: data.imageUrl || '',
          approved: data.approved || false,
          status: data.status || 'pending',
          approvedAt: data.approvedAt || null,
          approvedBy: data.approvedBy || null,
          approvedByName: data.approvedByName || null,
          rejectedAt: data.rejectedAt || null,
          rejectedBy: data.rejectedBy || null,
          rejectedByName: data.rejectedByName || null,
          rejectionReason: data.rejectionReason || null,
        };
      }
      
      // 삭제할 기존 문서 ID 추적
      group.oldDocIds.push(docSnap.id);
    });
    
    console.log(`📦 ${groupMap.size}개 그룹으로 정리됨`);
    console.log('---');
    
    // 3. 마이그레이션 미리보기
    console.log('📋 마이그레이션 미리보기:');
    let totalOldDocs = 0;
    let totalNewDocs = 0;
    
    for (const [groupId, group] of groupMap) {
      console.log(`\n그룹: ${groupId}`);
      console.log(`  - 기존 문서: ${group.oldDocIds.length}개`);
      console.log(`  - 새 문서: 1개 (items 배열 ${group.items.length}개)`);
      console.log(`  - 청구자: ${group.metadata.userName}`);
      console.log(`  - 총액: ${group.items.reduce((sum, item) => sum + item.total, 0).toLocaleString()}원`);
      console.log(`  - 상태: ${group.metadata.status}`);
      
      totalOldDocs += group.oldDocIds.length;
      totalNewDocs += 1;
    }
    
    console.log('\n---');
    console.log(`📊 마이그레이션 요약:`);
    console.log(`  - 삭제될 문서: ${totalOldDocs}개`);
    console.log(`  - 생성될 문서: ${totalNewDocs}개`);
    console.log(`  - 절감되는 문서: ${totalOldDocs - totalNewDocs}개`);
    console.log('---');
    
    // 4. Dry Run이면 여기서 종료
    if (dryRun) {
      console.log('🧪 Dry Run 모드 - 실제 변경 없음');
      console.log('💡 실제 마이그레이션: migrateExpenses(spaceId, false)');
      return {
        success: true,
        dryRun: true,
        groups: groupMap.size,
        oldDocs: totalOldDocs,
        newDocs: totalNewDocs,
      };
    }
    
    // 5. 실제 마이그레이션 실행
    console.log('🚀 실제 마이그레이션 시작...');
    
    let processedGroups = 0;
    
    for (const [groupId, group] of groupMap) {
      const batch = writeBatch(db);
      
      // 총액 계산
      const totalAmount = group.items.reduce((sum, item) => sum + item.total, 0);
      
      // 새 문서 생성
      const newDocRef = doc(expenseRef, groupId);
      const newDocData = {
        ...group.metadata,
        items: group.items,
        totalAmount: totalAmount,
      };
      
      batch.set(newDocRef, newDocData);
      
      // 기존 문서 삭제
      for (const oldDocId of group.oldDocIds) {
        const oldDocRef = doc(expenseRef, oldDocId);
        batch.delete(oldDocRef);
      }
      
      await batch.commit();
      
      processedGroups++;
      console.log(`✅ [${processedGroups}/${groupMap.size}] ${groupId} 마이그레이션 완료`);
    }
    
    console.log('---');
    console.log('🎉 마이그레이션 완료!');
    
    return {
      success: true,
      dryRun: false,
      groups: groupMap.size,
      oldDocs: totalOldDocs,
      newDocs: totalNewDocs,
    };
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  }
};

// 사용 예시
export const runMigration = async (spaceId) => {
  console.log('='.repeat(60));
  console.log('EXPENSE 마이그레이션 도구');
  console.log('='.repeat(60));
  
  // 1단계: Dry Run (미리보기)
  console.log('\n[1단계] Dry Run - 미리보기\n');
  const previewResult = await migrateExpenses(spaceId, true);
  
  if (!previewResult.success) {
    console.error('미리보기 실패');
    return;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('⚠️  주의: 이 작업은 되돌릴 수 없습니다!');
  console.log('='.repeat(60));
  console.log('\n계속하려면 콘솔에서 다음을 실행하세요:');
  console.log(`runMigrationConfirmed("${spaceId}")`);
  
  return previewResult;
};

// 확인 후 실행
export const runMigrationConfirmed = async (spaceId) => {
  console.log('\n[2단계] 실제 마이그레이션 실행\n');
  const result = await migrateExpenses(spaceId, false);
  
  if (result.success) {
    console.log('\n✅ 마이그레이션 성공!');
    console.log(`📊 ${result.oldDocs}개 문서 → ${result.newDocs}개 문서`);
    console.log(`💾 ${result.oldDocs - result.newDocs}개 문서 절감`);
  }
  
  return result;
};

// 롤백 함수 (비상용)
export const rollbackMigration = async (spaceId) => {
  console.log('⚠️  롤백 기능은 백업이 있어야 가능합니다.');
  console.log('💡 Firebase Console에서 수동으로 복구하거나');
  console.log('💡 백업된 데이터를 다시 import 하세요.');
};

export default {
  runMigration,
  runMigrationConfirmed,
  rollbackMigration,
};
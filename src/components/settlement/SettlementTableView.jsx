// src/components/settlement/SettlementTableView.jsx
import { useMemo, useRef, useState } from 'react';
import { Download, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';

const SettlementTableView = ({
  receipts,
  participants,
  userProfiles,
  formatCurrency,
  formatDate,
  weekId
}) => {
  const tableRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // 날짜별로 영수증 그룹핑 (귀속일 기준)
  const groupedByDate = useMemo(() => {
    const groups = {};

    receipts.forEach(receipt => {
      // belongsToDate는 YYYY-MM-DD 형식 문자열
      const belongsDate = receipt.belongsToDate ? new Date(receipt.belongsToDate) : receipt.createdAt;
      const dateKey = formatDate(belongsDate);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(receipt);
    });

    return groups;
  }, [receipts, formatDate]);

  // 참여자 목록 (balance 순으로 정렬)
  const participantList = useMemo(() => {
    return Object.entries(participants || {})
      .sort(([, a], [, b]) => b.balance - a.balance)
      .map(([userId, data]) => ({
        userId,
        ...data,
        displayName: userProfiles[userId]?.displayName || data.name
      }));
  }, [participants, userProfiles]);

  // 각 참여자별 낸 금액 계산
  const participantPaidAmounts = useMemo(() => {
    const amounts = {};
    participantList.forEach(p => {
      amounts[p.userId] = 0;
    });

    receipts.forEach(receipt => {
      if (amounts[receipt.paidBy] !== undefined) {
        amounts[receipt.paidBy] += receipt.totalAmount;
      }
    });

    return amounts;
  }, [receipts, participantList]);

  // 각 참여자별 낼 금액 계산
  const participantOwedAmounts = useMemo(() => {
    const amounts = {};
    participantList.forEach(p => {
      amounts[p.userId] = 0;
    });

    receipts.forEach(receipt => {
      receipt.items.forEach(item => {
        item.splitAmong.forEach(userId => {
          if (amounts[userId] !== undefined) {
            amounts[userId] += item.perPerson;
          }
        });
      });
    });

    return amounts;
  }, [receipts, participantList]);

  // CSV 다운로드 함수
  const downloadCSV = () => {
    let csvContent = '';

    // BOM 추가 (한글 깨짐 방지)
    csvContent = '\uFEFF';

    // 헤더 행
    const headers = ['날짜', '내용', '지출', '금액', '분담자', '인원'];
    participantList.forEach(p => headers.push(p.displayName));
    csvContent += headers.join(',') + '\n';

    // 데이터 행
    Object.entries(groupedByDate).forEach(([date, dateReceipts]) => {
      dateReceipts.forEach(receipt => {
        receipt.items.forEach(item => {
          const row = [
            date,
            `"${(receipt.memo || '-').replace(/"/g, '""')}"`,
            `"${item.itemName.replace(/"/g, '""')}"`,
            item.amount,
            userProfiles[receipt.paidBy]?.displayName || receipt.paidByName,
            item.splitAmong.length
          ];

          participantList.forEach(p => {
            const isSplitter = item.splitAmong.includes(p.userId);
            row.push(isSplitter ? item.perPerson : 0);
          });

          csvContent += row.join(',') + '\n';
        });
      });
    });

    // 합계 행
    const totalRow = ['', '', '지출 합계', receipts.reduce((sum, r) => sum + r.totalAmount, 0), '', ''];
    participantList.forEach(p => {
      totalRow.push(participantOwedAmounts[p.userId] || 0);
    });
    csvContent += totalRow.join(',') + '\n';

    // 낸 돈 행
    const paidRow = ['', '', '', '', '', '낸 돈'];
    participantList.forEach(p => {
      paidRow.push(participantPaidAmounts[p.userId] || 0);
    });
    csvContent += paidRow.join(',') + '\n';

    // 낼 돈 행
    const owedRow = ['', '', '', '', '', '낼 돈'];
    participantList.forEach(p => {
      const balance = p.balance;
      owedRow.push(balance < 0 ? Math.abs(balance) : 0);
    });
    csvContent += owedRow.join(',') + '\n';

    // 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `정산_${weekId || 'export'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 이미지로 다운로드 함수
  const downloadAsImage = async () => {
    if (!tableRef.current) return;

    try {
      setIsCapturing(true);

      // 약간의 지연을 주어 상태 변경이 렌더링되도록 함
      await new Promise(resolve => setTimeout(resolve, 100));

      // 캡처 전 원래 스타일 저장
      const originalOverflow = tableRef.current.style.overflow;
      const originalWidth = tableRef.current.style.width;
      const originalMaxWidth = tableRef.current.style.maxWidth;

      // 캡처를 위해 스크롤 제거하고 전체 너비 표시
      tableRef.current.style.overflow = 'visible';
      tableRef.current.style.width = 'max-content';
      tableRef.current.style.maxWidth = 'none';

      // 스타일 변경 후 렌더링 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(tableRef.current, {
        scale: 2, // 고해상도
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: tableRef.current.scrollWidth,
        windowHeight: tableRef.current.scrollHeight,
      });

      // 원래 스타일 복원
      tableRef.current.style.overflow = originalOverflow;
      tableRef.current.style.width = originalWidth;
      tableRef.current.style.maxWidth = originalMaxWidth;

      // Canvas를 Blob으로 변환
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `정산표_${weekId || 'export'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsCapturing(false);
      }, 'image/png');
    } catch (error) {
      console.error('이미지 생성 실패:', error);
      alert('이미지 생성에 실패했습니다. 다시 시도해주세요.');
      setIsCapturing(false);
    }
  };

  if (!receipts || receipts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        제출된 영수증이 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* 다운로드 버튼들 */}
      <div className="p-3 border-b border-gray-200 flex justify-end gap-2">
        <button
          onClick={downloadAsImage}
          disabled={isCapturing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="hidden sm:inline">이미지 다운로드</span>
          <span className="sm:hidden">이미지</span>
        </button>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">CSV 다운로드</span>
          <span className="sm:hidden">CSV</span>
        </button>
      </div>

      {/* 테이블 */}
      <div ref={tableRef} className="overflow-x-auto bg-white p-4">
        {/* 테이블 제목 (이미지 캡처 시 포함) */}
        <div className="mb-3 text-center">
          <h2 className="text-lg font-bold text-gray-900">
            {weekId ? `[${weekId}] 주차 정산` : '정산표'}
          </h2>
        </div>

        <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100 border-b-2 border-gray-300">
            <th className="border border-gray-300 px-3 py-2 text-left font-bold whitespace-nowrap">날짜</th>
            <th className="border border-gray-300 px-3 py-2 text-left font-bold whitespace-nowrap">내용</th>
            <th className="border border-gray-300 px-3 py-2 text-left font-bold whitespace-nowrap">지출</th>
            <th className="border border-gray-300 px-3 py-2 text-left font-bold whitespace-nowrap">금액</th>
            <th className="border border-gray-300 px-3 py-2 text-left font-bold whitespace-nowrap">분담자</th>
            <th className="border border-gray-300 px-3 py-2 text-center font-bold whitespace-nowrap">인원</th>
            {participantList.map(participant => (
              <th
                key={participant.userId}
                className="border border-gray-300 px-3 py-2 text-center font-bold whitespace-nowrap bg-blue-50"
              >
                {participant.displayName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedByDate).map(([date, dateReceipts]) => {
            let dateRowSpan = 0;
            dateReceipts.forEach(receipt => {
              dateRowSpan += receipt.items.length;
            });

            let isFirstDateRow = true;
            const dateRows = [];

            dateReceipts.forEach((receipt, receiptIdx) => {
              receipt.items.forEach((item, itemIdx) => {
                const isFirstItemOfReceipt = itemIdx === 0;

                dateRows.push(
                  <tr key={`${receipt.id}-${itemIdx}`} className="hover:bg-gray-50">
                    {/* 날짜 (날짜별 첫 행에만 표시) */}
                    {isFirstDateRow && (
                      <td
                        rowSpan={dateRowSpan}
                        className="border border-gray-300 px-3 py-2 text-center font-semibold bg-gray-50 align-top"
                      >
                        {date}
                      </td>
                    )}

                    {/* 내용 - 영수증별 첫 항목에만 표시 */}
                    {isFirstItemOfReceipt && (
                      <td
                        rowSpan={receipt.items.length}
                        className="border border-gray-300 px-3 py-2 align-top"
                      >
                        {receipt.memo || '-'}
                      </td>
                    )}

                    {/* 지출 (항목명) */}
                    <td className="border border-gray-300 px-3 py-2">
                      {item.itemName}
                    </td>

                    {/* 금액 */}
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {formatCurrency(item.amount)}
                    </td>

                    {/* 분담자 (영수증별 첫 항목에만 표시) */}
                    {isFirstItemOfReceipt && (
                      <td
                        rowSpan={receipt.items.length}
                        className="border border-gray-300 px-3 py-2 text-center align-top"
                      >
                        {userProfiles[receipt.paidBy]?.displayName || receipt.paidByName}
                      </td>
                    )}

                    {/* 인원 */}
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {item.splitAmong.length}
                    </td>

                    {/* 각 참여자별 분담금 */}
                    {participantList.map(participant => {
                      const isSplitter = item.splitAmong.includes(participant.userId);
                      return (
                        <td
                          key={participant.userId}
                          className={`border border-gray-300 px-3 py-2 text-right ${
                            isSplitter ? 'bg-yellow-50' : ''
                          }`}
                        >
                          {isSplitter ? formatCurrency(item.perPerson) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                );

                isFirstDateRow = false;
              });
            });

            return dateRows;
          })}

          {/* 지출 합계 */}
          <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
            <td colSpan="3" className="border border-gray-300 px-3 py-2 text-center">
              지출 합계
            </td>
            <td className="border border-gray-300 px-3 py-2 text-right">
              {formatCurrency(receipts.reduce((sum, r) => sum + r.totalAmount, 0))}
            </td>
            <td colSpan="2" className="border border-gray-300"></td>
            {participantList.map(participant => (
              <td
                key={participant.userId}
                className="border border-gray-300 px-3 py-2 text-right bg-yellow-100"
              >
                {formatCurrency(participantOwedAmounts[participant.userId] || 0)}
              </td>
            ))}
          </tr>

          {/* 낸 돈 */}
          <tr className="bg-blue-50">
            <td colSpan="6" className="border border-gray-300 px-3 py-2 text-center font-semibold">
              낸 돈
            </td>
            {participantList.map(participant => (
              <td
                key={participant.userId}
                className="border border-gray-300 px-3 py-2 text-right font-semibold"
              >
                {formatCurrency(participantPaidAmounts[participant.userId] || 0)}
              </td>
            ))}
          </tr>

          {/* 정산 결과 */}
          <tr className="bg-blue-50 font-bold">
            <td colSpan="6" className="border border-gray-300 px-3 py-2 text-center">
              정산 결과
            </td>
            {participantList.map(participant => {
              const balance = participant.balance;
              const amount = Math.abs(balance);
              const isPaymentConfirmed = participant.paymentConfirmed === true;
              const isTransferCompleted = participant.transferCompleted === true;
              const needsPayment = balance < 0;
              const needsReceive = balance > 0;

              return (
                <td
                  key={participant.userId}
                  className={`border border-gray-300 px-3 py-2 text-right ${
                    needsReceive
                      ? isTransferCompleted ? 'text-gray-500' : 'text-green-600'
                      : needsPayment
                      ? isPaymentConfirmed ? 'text-gray-500' : 'text-orange-600'
                      : 'text-gray-600'
                  }`}
                >
                  {balance !== 0 ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={(isPaymentConfirmed && needsPayment) || (isTransferCompleted && needsReceive) ? 'line-through' : ''}>
                        {needsReceive ? '+' : ''}{formatCurrency(amount)}
                      </span>
                      {isPaymentConfirmed && needsPayment && (
                        <span className="text-xs text-green-600 font-semibold">
                          ✓ 입금확인
                        </span>
                      )}
                      {isTransferCompleted && needsReceive && (
                        <span className="text-xs text-green-600 font-semibold">
                          ✓ 송금완료
                        </span>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default SettlementTableView;

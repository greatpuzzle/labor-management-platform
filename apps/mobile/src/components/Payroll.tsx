import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { api, WorkRecord } from '@shared/api';
import { cn } from './ui/utils';

interface PayrollProps {
  employeeId: string;
  employeeName: string;
}

export function Payroll({ employeeId, employeeName }: PayrollProps) {
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // 해당 월의 근무 기록 로드
  useEffect(() => {
    const loadWorkRecords = async () => {
      if (!employeeId) return;

      setLoading(true);
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const records = await api.getWorkRecordsByEmployee(employeeId, { year, month });
        setWorkRecords(records);
      } catch (error: any) {
        console.error('[Payroll] Failed to load work records:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkRecords();
  }, [employeeId, currentMonth]);

  // 해당 월의 모든 날짜 생성
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    // 빈 칸 추가 (첫 주의 시작일 전)
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // 날짜 추가
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // 해당 날짜의 근무 기록 찾기
  const getWorkRecordForDate = (day: number): WorkRecord | undefined => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return workRecords.find(r => r.date === dateStr);
  };

  // 근무 일수 계산
  const workedDays = workRecords.filter(r => r.status === 'COMPLETED').length;

  const days = getDaysInMonth(currentMonth);

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20 p-4">
      <Card className="w-full p-6 mb-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
          </h2>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="text-center">
              <p className="text-sm text-slate-600">근무 일수</p>
              <p className="text-3xl font-bold text-[#00C950]">{workedDays}일</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 캘린더 */}
      <Card className="w-full p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-slate-900">
            {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day, index) => (
            <div
              key={index}
              className={cn(
                'text-center text-sm font-semibold py-2',
                index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-slate-600'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={index} className="aspect-square" />;
            }

            const workRecord = getWorkRecordForDate(day);
            const isToday =
              day === new Date().getDate() &&
              currentMonth.getMonth() === new Date().getMonth() &&
              currentMonth.getFullYear() === new Date().getFullYear();
            const isWorked = workRecord?.status === 'COMPLETED';
            const isInProgress = workRecord?.status === 'IN_PROGRESS';
            const isNotStarted = workRecord?.status === 'NOT_STARTED';

            return (
              <div
                key={index}
                className={cn(
                  'aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-colors',
                  isToday && 'border-[#00C950] bg-green-50',
                  !isToday && !isWorked && !isInProgress && !isNotStarted && 'border-slate-200 bg-white',
                  isWorked && 'border-[#00C950] bg-green-100',
                  isInProgress && 'border-yellow-400 bg-yellow-50',
                  isNotStarted && 'border-slate-300 bg-slate-100'
                )}
              >
                <span
                  className={cn(
                    'text-sm font-medium',
                    isToday && 'text-[#00C950] font-bold',
                    !isToday && isWorked && 'text-slate-900',
                    !isToday && (isInProgress || isNotStarted) && 'text-slate-600',
                    !isToday && !isWorked && !isInProgress && !isNotStarted && 'text-slate-400'
                  )}
                >
                  {day}
                </span>
                {isWorked && (
                  <CheckCircle2 className="h-4 w-4 text-[#00C950] mt-0.5" />
                )}
                {isInProgress && (
                  <div className="h-2 w-2 rounded-full bg-yellow-400 mt-0.5" />
                )}
                {isNotStarted && (
                  <XCircle className="h-4 w-4 text-slate-400 mt-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#00C950]" />
            <span className="text-xs text-slate-600">근무 완료</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-yellow-400" />
            <span className="text-xs text-slate-600">근무 중</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-600">미완료</span>
          </div>
        </div>
      </Card>
    </div>
  );
}


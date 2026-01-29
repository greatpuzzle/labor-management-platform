import React, { useState, useEffect, useMemo } from 'react';
import { Employee, companies } from '@shared/data';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Calendar, Clock, User, CheckCircle2, Download, Building2, Bell, Loader2, ChevronLeft, ChevronRight, FileText, XCircle, AlertCircle } from "lucide-react";
import { api, WorkRecord as ApiWorkRecord, WorkSchedule } from '@shared/api';
import { toast } from 'sonner';
import { User as UserType } from "@shared/data";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../components/ui/hover-card";
import { Progress } from "../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

interface WorkRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number; // 분 단위
  status: 'not_started' | 'in_progress' | 'completed';
  notes: string;
}

interface Company {
  id: string;
  name: string;
  ceo: string;
  address: string;
  phone: string;
  businessNumber: string | null;
  stampImageUrl: string | null;
}

interface WorkRecordsDashboardProps {
  employees: Employee[];
  user: UserType;
  allCompanies?: Company[];
  selectedCompanyId: string;
  onCompanyChange?: (companyId: string) => void;
}

// 주간 데이터 타입
interface WeeklyEmployeeData {
  employeeId: string;
  employeeName: string;
  currentStatus: 'working' | 'off' | 'absent' | 'not_started';
  weeklyData: {
    [dayKey: string]: {
      status: 'completed' | 'in_progress' | 'scheduled' | 'absent' | 'none';
      duration?: number;
      elapsedTime?: number;
      tasks: string[];
      workRecord?: WorkRecord;
    };
  };
  weeklyTotalMinutes: number;
  weeklyTargetMinutes: number;
}

// 주의 시작일 계산 (월요일 기준)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일 기준
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// 주의 끝일 계산 (금요일)
function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 4); // 금요일
  return d;
}

// 날짜를 YYYY-MM-DD 형식으로 (로컬 시간 기준)
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 날짜 문자열을 YYYY-MM-DD 형식으로 정규화 (ISO 문자열이나 Date 객체 모두 처리)
function normalizeDateString(dateStr: string | Date): string {
  if (dateStr instanceof Date) {
    return formatDateKey(dateStr);
  }
  // ISO 문자열이면 날짜 부분만 추출
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  // 이미 YYYY-MM-DD 형식이면 그대로 반환
  return dateStr;
}

// 계약 기간 파싱 (형식: "2024.01.01 ~ 2024.12.31")
function parseContractPeriod(period: string): { start: Date; end: Date } | null {
  try {
    const match = period.match(/(\d{4})\.(\d{2})\.(\d{2})\s*~\s*(\d{4})\.(\d{2})\.(\d{2})/);
    if (!match) return null;
    
    const [, startYear, startMonth, startDay, endYear, endMonth, endDay] = match;
    const start = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));
    start.setHours(0, 0, 0, 0);
    const end = new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay));
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  } catch {
    return null;
  }
}

// 선택된 주간이 계약 기간 내에 있는지 확인
function isWeekInContractPeriod(weekStart: Date, contractPeriod: string): boolean {
  const parsed = parseContractPeriod(contractPeriod);
  if (!parsed) return false;
  
  const weekEnd = getWeekEnd(weekStart);
  
  // 주간의 시작일(월요일)이 계약 기간 내에 있거나
  // 주간의 끝일(금요일)이 계약 기간 내에 있으면 표시
  // 또는 계약 기간이 주간을 완전히 포함하는 경우도 표시
  return (
    (weekStart >= parsed.start && weekStart <= parsed.end) ||
    (weekEnd >= parsed.start && weekEnd <= parsed.end) ||
    (parsed.start >= weekStart && parsed.end <= weekEnd)
  );
}

// 요일 이름
const DAY_NAMES = ['월', '화', '수', '목', '금'];

export function WorkRecordsDashboard({
  employees,
  user,
  allCompanies = [],
  selectedCompanyId,
  onCompanyChange
}: WorkRecordsDashboardProps) {
  const companyId = selectedCompanyId;

  const currentCompany = user.role === 'SUPER_ADMIN'
    ? allCompanies.find(c => c.id === companyId)
    : user.company;

  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([]);
  const [schedules, setSchedules] = useState<{ [employeeId: string]: WorkSchedule[] }>({});
  const [loading, setLoading] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{ lastWeeklyScheduleSentAt?: string | null } | null>(null);
  
  // 날짜별 근무 기록 수정 모달 상태
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateObj, setSelectedDateObj] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<string>('13:00');
  const [endTime, setEndTime] = useState<string>('16:30');
  const [isSaving, setIsSaving] = useState(false);

  // 주간 선택
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => getWeekStart(new Date()));

  // 선택된 주간이 계약 기간 내에 있고 계약 체결 완료된 근로자만 필터링
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      // 회사 ID 일치 확인
      if (e.companyId !== companyId) return false;
      
      // 계약 체결 완료된 근로자만 표시
      if (e.status !== 'completed') return false;
      
      // 계약 기간이 없으면 표시하지 않음
      if (!e.contractPeriod) return false;
      
      // 선택된 주간이 계약 기간 내에 있는지 확인
      return isWeekInContractPeriod(selectedWeekStart, e.contractPeriod);
    });
  }, [employees, companyId, selectedWeekStart]);

  // 실시간 업데이트를 위한 타이머
  const [currentTime, setCurrentTime] = useState(new Date());

  // 실시간 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 업데이트
    return () => clearInterval(timer);
  }, []);

  // 회사 정보 조회 (lastWeeklyScheduleSentAt 포함)
  useEffect(() => {
    if (companyId) {
      api.getCompany(companyId)
        .then(company => {
          setCompanyInfo({ lastWeeklyScheduleSentAt: company.lastWeeklyScheduleSentAt });
        })
        .catch(error => {
          console.error('Failed to fetch company info:', error);
        });
    }
  }, [companyId]);

  // 다음주 월요일 오전 7시까지 비활성화 여부 계산
  const isButtonDisabled = useMemo(() => {
    if (!companyInfo?.lastWeeklyScheduleSentAt) return false;
    
    const lastSentDate = new Date(companyInfo.lastWeeklyScheduleSentAt);
    const lastSentWeekStart = getWeekStart(lastSentDate);
    
    // 선택된 주의 시작일
    const selectedWeekStartNormalized = new Date(selectedWeekStart);
    selectedWeekStartNormalized.setHours(0, 0, 0, 0);
    const lastSentWeekStartNormalized = new Date(lastSentWeekStart);
    lastSentWeekStartNormalized.setHours(0, 0, 0, 0);
    
    // 마지막 업무 지시가 선택된 주와 같은 주인지 확인
    if (selectedWeekStartNormalized.getTime() !== lastSentWeekStartNormalized.getTime()) {
      return false; // 다른 주면 비활성화하지 않음
    }
    
    // 마지막 업무 지시가 이루어진 주의 다음주 월요일 오전 7시
    const nextMonday7AM = new Date(lastSentWeekStart);
    nextMonday7AM.setDate(nextMonday7AM.getDate() + 7); // 다음주 월요일
    nextMonday7AM.setHours(7, 0, 0, 0); // 오전 7시
    
    // 현재 시간이 다음주 월요일 오전 7시 이전이면 비활성화
    return currentTime < nextMonday7AM;
  }, [companyInfo, currentTime, selectedWeekStart]);

  // 버튼 텍스트 결정
  const buttonText = useMemo(() => {
    if (isButtonDisabled) {
      return '업무지시 완료';
    }
    return '주간 업무지시하기';
  }, [isButtonDisabled]);

  // 주간 날짜 배열 생성
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(selectedWeekStart);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0); // 시간을 명시적으로 0시 0분 0초로 설정
      dates.push(d);
    }
    return dates;
  }, [selectedWeekStart]);

  // 오늘 날짜 (로컬 시간 기준)
  // currentTime을 기반으로 계산하여 날짜 변경 시 자동 업데이트
  const today = useMemo(() => {
    const year = currentTime.getFullYear();
    const month = currentTime.getMonth();
    const day = currentTime.getDate();

    return formatDateKey(new Date(year, month, day, 0, 0, 0, 0));
  }, [currentTime]);

  // 근무 기록 및 스케줄 로드
  useEffect(() => {
    const loadData = async () => {
      if (!companyId) {
        setWorkRecords([]);
        setSchedules({});
        return;
      }

      setLoading(true);
      try {
        // 근무 기록 로드
        const apiRecords = await api.getWorkRecordsByCompany(companyId);
        const converted: WorkRecord[] = apiRecords.map((record: any) => {
          const employeeName = record.employee?.name ||
            employees.find(e => e.id === record.employeeId)?.name ||
            '알 수 없음';

          return {
            id: record.id,
            employeeId: record.employeeId,
            employeeName: employeeName,
            date: record.date,
            startTime: record.startTime,
            endTime: record.endTime || undefined,
            duration: record.duration || undefined,
            status: (record.status || 'NOT_STARTED').toLowerCase().replace('_', '_') as 'not_started' | 'in_progress' | 'completed',
            notes: record.notes || '',
          };
        });
        
        setWorkRecords(converted);

        // 각 직원의 주간 스케줄 로드
        const schedulesMap: { [employeeId: string]: WorkSchedule[] } = {};
        for (const emp of filteredEmployees) {
          try {
            const weeklySchedule = await api.getWeeklySchedule(emp.id, selectedWeekStart);
            schedulesMap[emp.id] = weeklySchedule;
          } catch (error) {
            schedulesMap[emp.id] = [];
          }
        }
        setSchedules(schedulesMap);
      } catch (error: any) {
        console.error('Failed to load data:', error);
        toast.error('데이터를 불러오는데 실패했습니다.');
        setWorkRecords([]);
        setSchedules({});
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [companyId, selectedWeekStart]);

  // 주간 직원 데이터 계산
  const weeklyEmployeeData: WeeklyEmployeeData[] = useMemo(() => {
    return filteredEmployees.map(emp => {
      const empRecords = workRecords.filter(r => r.employeeId === emp.id);
      const empSchedules = schedules[emp.id] || [];

      // 현재 상태 결정 (오늘 기록 기반)
      const todayRecord = empRecords.find(r => r.date === today);
      let currentStatus: 'working' | 'off' | 'absent' | 'not_started' = 'not_started';

      if (todayRecord) {
        if (todayRecord.status === 'in_progress') {
          currentStatus = 'working';
        } else if (todayRecord.status === 'completed') {
          currentStatus = 'off';
        }
      }

      // 주간 데이터 구성
      const weeklyData: WeeklyEmployeeData['weeklyData'] = {};
      let weeklyTotalMinutes = 0;

      // 근로계약 일자 파싱 (각 직원마다 한 번만 파싱)
      const contractStartDate = emp.contractPeriod 
        ? parseContractPeriod(emp.contractPeriod)?.start 
        : null;

      weekDates.forEach((date, index) => {
        const dateKey = formatDateKey(date);
        const record = empRecords.find(r => r.date === dateKey);
        // 날짜 형식 정규화하여 비교 (ISO 문자열이나 YYYY-MM-DD 형식 모두 처리)
        const schedule = empSchedules.find(s => normalizeDateString(s.date) === dateKey);
        const isToday = dateKey === today;
        // 날짜 비교를 위해 시간을 0시 0분 0초로 설정
        const dateForComparison = new Date(date);
        dateForComparison.setHours(0, 0, 0, 0);
        const todayForComparison = new Date();
        todayForComparison.setHours(0, 0, 0, 0);
        const isPast = dateForComparison < todayForComparison && !isToday;
        const isFuture = dateForComparison > todayForComparison;

        // 근로계약 일자 이전 날짜인지 확인
        const isBeforeContractStart = contractStartDate 
          ? date < contractStartDate 
          : false;

        let status: 'completed' | 'in_progress' | 'scheduled' | 'absent' | 'none' = 'none';
        let duration = 0;
        let elapsedTime = 0;

        // 업무 내용: WorkSchedule의 tasks와 WorkRecord의 notes 모두 포함
        let tasks: string[] = [];

        // 스케줄에서 업무 목록 가져오기
        if (schedule?.tasks && schedule.tasks.length > 0) {
          tasks = [...schedule.tasks];
        }

        // WorkRecord의 notes에서 업무 내용 추가 (줄 단위로 파싱)
        if (record?.notes) {
          const notesTasks = record.notes
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
          if (notesTasks.length > 0) {
            tasks = [...tasks, ...notesTasks];
          }
        }

        if (record) {
          if (record.status === 'completed') {
            status = 'completed';
            duration = record.duration || 0;
            weeklyTotalMinutes += duration;
          } else if (record.status === 'in_progress') {
            status = 'in_progress';
            // 실시간 경과 시간 계산
            const start = new Date(record.startTime);
            elapsedTime = Math.floor((currentTime.getTime() - start.getTime()) / 60000);
          }
        } else if (isPast && schedule && !isBeforeContractStart) {
          // 과거인데 스케줄은 있었지만 근무 기록이 없으면 결근
          // 단, 근로계약 일자 이전 날짜는 제외 (기본 상태로 유지)
          status = 'absent';
        } else if (isFuture || isToday) {
          if (schedule) {
            status = 'scheduled';
          }
        }
        // 근로계약 일자 이전 날짜는 status가 'none'으로 유지됨

        weeklyData[dateKey] = {
          status,
          duration,
          elapsedTime,
          tasks,
          workRecord: record,
        };
      });

      // 주간 목표 시간 (기본 17.5시간 = 3.5시간 x 5일)
      const weeklyTargetMinutes = 17.5 * 60;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        currentStatus,
        weeklyData,
        weeklyTotalMinutes,
        weeklyTargetMinutes,
      };
    });
  }, [filteredEmployees, workRecords, schedules, weekDates, today, currentTime]);

  // 주간 이동
  const goToPreviousWeek = () => {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setSelectedWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setSelectedWeekStart(newStart);
  };

  const goToCurrentWeek = () => {
    setSelectedWeekStart(getWeekStart(new Date()));
  };

  // 주간 포맷
  const weekRangeText = useMemo(() => {
    const end = getWeekEnd(selectedWeekStart);
    const startMonth = selectedWeekStart.getMonth() + 1;
    const startDay = selectedWeekStart.getDate();
    const endMonth = end.getMonth() + 1;
    const endDay = end.getDate();

    if (startMonth === endMonth) {
      return `${startMonth}월 ${startDay}일 ~ ${endDay}일`;
    }
    return `${startMonth}월 ${startDay}일 ~ ${endMonth}월 ${endDay}일`;
  }, [selectedWeekStart]);

  // 시간 포맷
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}분`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatElapsedTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  // 일주일 단위 근무 알림 보내기
  const handleSendWeeklyNotifications = async () => {
    if (!companyId) {
      toast.error('회사를 선택해주세요.');
      return;
    }

    if (isButtonDisabled) {
      toast.error('다음주 월요일 오전 7시까지 업무 지시가 비활성화되어 있습니다.');
      return;
    }

    setSendingNotifications(true);

    try {
      const employeeData = await api.getEmployeesByCompany(companyId);

      if (!employeeData || employeeData.length === 0) {
        toast.error('선택한 회사에 근로자가 없습니다.');
        setSendingNotifications(false);
        return;
      }

      const completedEmployees = employeeData.filter(emp => emp.contractStatus === 'COMPLETED');

      if (completedEmployees.length === 0) {
        toast.error('계약이 완료된 근로자가 없습니다.');
        setSendingNotifications(false);
        return;
      }

      const confirmed = window.confirm(
        `선택된 회사의 계약 완료 근로자 ${completedEmployees.length}명에게 일주일치 근무 스케줄을 생성하고 오늘 날짜에 대한 푸시 알림을 보내시겠습니까?`
      );

      if (!confirmed) {
        setSendingNotifications(false);
        return;
      }

      // 새로운 API 엔드포인트 사용 (회사 전체에 대한 업무 지시)
      const result = await api.createWeeklyScheduleForCompany(companyId, selectedWeekStart);

      if (result.success > 0) {
        toast.success(
          `일주일치 근무 스케줄 생성 완료! ${result.success}명에게 알림을 보냈습니다.${result.failed > 0 ? ` (실패: ${result.failed}명)` : ''}`,
          { duration: 5000 }
        );
        
        // 회사 정보 새로고침 (lastWeeklyScheduleSentAt 업데이트)
        const updatedCompany = await api.getCompany(companyId);
        setCompanyInfo({ lastWeeklyScheduleSentAt: updatedCompany.lastWeeklyScheduleSentAt });
        
        // 데이터 새로고침
        const newSchedulesMap: { [employeeId: string]: WorkSchedule[] } = {};
        for (const emp of filteredEmployees) {
          try {
            const weeklySchedule = await api.getWeeklySchedule(emp.id, selectedWeekStart);
            newSchedulesMap[emp.id] = weeklySchedule;
          } catch (error) {
            newSchedulesMap[emp.id] = [];
          }
        }
        setSchedules(newSchedulesMap);
      }

      if (result.failed > 0 && result.success === 0) {
        toast.error(`알림 전송에 실패했습니다. (${result.errors.slice(0, 3).map(e => e.employeeName).join(', ')})`);
      }
    } catch (error: any) {
      toast.error('알림 전송 중 오류가 발생했습니다.');
    } finally {
      setSendingNotifications(false);
    }
  };

  // 주간 업무보고서 다운로드
  const handleDownloadWeeklyReport = async () => {
    if (!companyId) {
      toast.error('회사를 선택해주세요.');
      return;
    }

    setDownloadingReport(true);
    try {
      const blob = await api.exportWorkRecordsToExcel(companyId, selectedWeekStart.getFullYear());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `주간_업무보고서_${weekRangeText.replace(/\s/g, '_').replace(/~/g, '-')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('주간 업무보고서가 다운로드되었습니다.');
    } catch (error: any) {
      toast.error('보고서 다운로드에 실패했습니다.');
    } finally {
      setDownloadingReport(false);
    }
  };

  // 상태 아이콘 및 텍스트
  const getStatusBadge = (status: 'working' | 'off' | 'absent' | 'not_started') => {
    switch (status) {
      case 'working':
        return (
          <Badge className="bg-green-500 text-white gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            근무중
          </Badge>
        );
      case 'off':
        return <Badge variant="secondary" className="bg-slate-100 text-slate-600">퇴근</Badge>;
      case 'absent':
        return <Badge variant="destructive" className="bg-red-500 text-white">결근</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-400">미출근</Badge>;
    }
  };

  // 날짜별 근무 기록 수정 모달 열기
  const handleOpenEditModal = (employeeId: string, dateKey: string, date: Date, existingRecord?: WorkRecord) => {
    setSelectedEmployeeId(employeeId);
    setSelectedDate(dateKey);
    setSelectedDateObj(date);
    
    // 기존 기록이 있으면 시간 설정
    if (existingRecord?.startTime && existingRecord?.endTime) {
      const start = new Date(existingRecord.startTime);
      const end = new Date(existingRecord.endTime);
      setStartTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
      setEndTime(`${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`);
    } else {
      // 기본값: 13:00 ~ 16:30 (3시간 30분)
      setStartTime('13:00');
      setEndTime('16:30');
    }
    
    setEditModalOpen(true);
  };

  // 근무 기록 저장
  const handleSaveWorkRecord = async () => {
    if (!selectedEmployeeId || !selectedDate || !selectedDateObj) return;
    
    setIsSaving(true);
    try {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startDateTime = new Date(selectedDateObj);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      const endDateTime = new Date(selectedDateObj);
      endDateTime.setHours(endHour, endMinute, 0, 0);
      
      // 기존 기록 확인
      const existingRecord = workRecords.find(
        r => r.employeeId === selectedEmployeeId && r.date === selectedDate
      );
      
      if (existingRecord) {
        // 기존 기록 업데이트
        await api.updateWorkRecord(existingRecord.id, {
          endTime: endDateTime.toISOString(),
          notes: '',
        });
      } else {
        // 새 기록 생성
        await api.createWorkRecord(selectedEmployeeId, {
          startTime: startDateTime.toISOString(),
          notes: '',
        });
        
        // 생성 후 바로 종료 처리
        const newRecords = await api.getWorkRecordsByEmployee(selectedEmployeeId, {
          year: selectedDateObj.getFullYear(),
          month: selectedDateObj.getMonth() + 1,
        });
        const todayRecord = newRecords.find(r => r.date === selectedDate);
        if (todayRecord) {
          await api.updateWorkRecord(todayRecord.id, {
            endTime: endDateTime.toISOString(),
            notes: '',
          });
        }
      }
      
      // 데이터 새로고침
      const apiRecords = await api.getWorkRecordsByCompany(companyId);
      const converted: WorkRecord[] = apiRecords.map((record: any) => {
        const employeeName = record.employee?.name ||
          employees.find(e => e.id === record.employeeId)?.name ||
          '알 수 없음';
        return {
          id: record.id,
          employeeId: record.employeeId,
          employeeName: employeeName,
          date: record.date,
          startTime: record.startTime,
          endTime: record.endTime || undefined,
          duration: record.duration || undefined,
          status: (record.status || 'NOT_STARTED').toLowerCase().replace('_', '_') as 'not_started' | 'in_progress' | 'completed',
          notes: record.notes || '',
        };
      });
      setWorkRecords(converted);
      
      toast.success('근무 기록이 저장되었습니다.');
      setEditModalOpen(false);
    } catch (error: any) {
      console.error('Failed to save work record:', error);
      toast.error(error.response?.data?.message || '근무 기록 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 셀 렌더링
  const renderDayCell = (employeeId: string, data: WeeklyEmployeeData['weeklyData'][string], dateKey: string, dayIndex: number) => {
    const isToday = dateKey === today;
    const date = weekDates[dayIndex];
    // 날짜 비교를 위해 시간을 0시 0분 0초로 설정
    const dateForComparison = new Date(date);
    dateForComparison.setHours(0, 0, 0, 0);
    const todayForComparison = new Date();
    todayForComparison.setHours(0, 0, 0, 0);
    const isPast = dateForComparison < todayForComparison && !isToday;
    const isFuture = dateForComparison > todayForComparison;

    let bgClass = '';
    let borderClass = '';
    let content = null;

    switch (data.status) {
      case 'completed':
        bgClass = 'bg-green-50';
        content = (
          <div className="flex items-center justify-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">{formatDuration(data.duration || 0)}</span>
          </div>
        );
        break;
      case 'in_progress':
        bgClass = 'bg-blue-50';
        borderClass = 'ring-2 ring-blue-400 ring-inset';
        content = (
          <div className="flex items-center justify-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-blue-700">
              {formatElapsedTime(data.elapsedTime || 0)} / 3.5h
            </span>
          </div>
        );
        break;
      case 'scheduled':
        bgClass = 'bg-slate-50';
        content = (
          <div className="flex items-center justify-center gap-1">
            <FileText className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-500">대기</span>
          </div>
        );
        break;
      case 'absent':
        bgClass = 'bg-red-50';
        content = (
          <div className="flex items-center justify-center gap-1">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-600">결근</span>
          </div>
        );
        break;
      default:
        bgClass = 'bg-slate-50';
        content = (
          <div className="flex items-center justify-center">
            <span className="text-sm text-slate-400">-</span>
          </div>
        );
    }

    // 모든 셀에 호버 카드 표시 (업무 내용이 없어도 상태 정보 표시)
    return (
      <HoverCard>
        <TableCell
          className={`cursor-pointer transition-all hover:bg-opacity-80 ${bgClass} ${borderClass} ${isToday ? 'font-semibold' : ''}`}
          onClick={() => handleOpenEditModal(employeeId, dateKey, date, data.workRecord)}
        >
          <HoverCardTrigger asChild>
            <div className="w-full h-full flex items-center justify-center">
              {content}
            </div>
          </HoverCardTrigger>
        </TableCell>
        <HoverCardContent className="w-72" side="top">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">업무 내용</h4>
              <Badge variant="outline" className="text-xs">{DAY_NAMES[dayIndex]}요일</Badge>
            </div>

            {data.tasks.length > 0 ? (
              <ul className="space-y-1">
                {data.tasks.map((task, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">등록된 업무 내용이 없습니다</p>
            )}

            {data.workRecord && (
              <div className="pt-2 border-t text-xs text-slate-500 space-y-1">
                {data.status === 'completed' && (
                  <div>근무 시간: {formatDuration(data.duration || 0)}</div>
                )}
                {data.status === 'in_progress' && (
                  <div>진행 중: {formatElapsedTime(data.elapsedTime || 0)} 경과</div>
                )}
              </div>
            )}

            {data.status === 'scheduled' && (
              <div className="pt-2 border-t text-xs text-slate-500">
                예정된 근무입니다
              </div>
            )}

            {data.status === 'absent' && (
              <div className="pt-2 border-t text-xs text-red-500">
                결근 처리되었습니다
              </div>
            )}

            {data.status === 'none' && !data.workRecord && (
              <div className="pt-2 border-t text-xs text-slate-400">
                해당 날짜에 근무 기록이 없습니다
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  // 회사 미선택 시 안내
  if (!currentCompany && user.role === 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">회사를 선택해주세요</h3>
          <p className="text-slate-500">
            위 드롭다운에서 조회할 회사를 선택하세요.
          </p>
        </div>
      </div>
    );
  }

  // 통계 계산
  const totalWorkingEmployees = weeklyEmployeeData.filter(e => e.currentStatus === 'working').length;
  const totalCompletedToday = weeklyEmployeeData.filter(e => e.currentStatus === 'off').length;
  const totalAbsentToday = weeklyEmployeeData.filter(e => {
    const todayData = e.weeklyData[today];
    return todayData?.status === 'absent';
  }).length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-6 border-b pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {user.role === 'SUPER_ADMIN' ? (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">Super Admin</Badge>
              ) : (
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Admin</Badge>
              )}
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">주간 근무 현황</h2>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-slate-500">주간 근무 현황을 한눈에 확인하세요</p>
              {user.role === 'SUPER_ADMIN' && allCompanies.length > 0 && onCompanyChange && (
                <Select value={companyId} onValueChange={onCompanyChange}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="회사를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {/* 버튼들 */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                onClick={handleSendWeeklyNotifications}
                disabled={sendingNotifications || !companyId || isButtonDisabled}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingNotifications ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    전송 중...
                  </>
                ) : (
                  <>
                    <Bell className="mr-2 h-4 w-4" />
                    {buttonText}
                  </>
                )}
              </Button>
              <Button
                onClick={handleDownloadWeeklyReport}
                disabled={downloadingReport || !companyId}
                variant="outline"
              >
                {downloadingReport ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    다운로드 중...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    주간 보고서 다운로드
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">현재 근무중</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalWorkingEmployees}명</div>
            <p className="text-xs text-muted-foreground mt-1">실시간</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 퇴근</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalCompletedToday}명</div>
            <p className="text-xs text-muted-foreground mt-1">근무 완료</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 결근</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalAbsentToday}명</div>
            <p className="text-xs text-muted-foreground mt-1">미출근</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 근로자</CardTitle>
            <User className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredEmployees.length}명</div>
            <p className="text-xs text-muted-foreground mt-1">{currentCompany?.name}</p>
          </CardContent>
        </Card>
      </div>

      {/* 주간 선택 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              주간 근무 현황
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                이번 주
              </Button>
              <span className="text-sm font-medium min-w-[160px] text-center">{weekRangeText}</span>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[140px] font-semibold">근로자명</TableHead>
                    <TableHead className="w-[100px] font-semibold text-center">상태</TableHead>
                    {weekDates.map((date, idx) => {
                      const dateKey = formatDateKey(date);
                      const isToday = dateKey === today;

                      return (
                        <TableHead
                          key={dateKey}
                          className={`w-[120px] text-center font-semibold ${isToday ? 'bg-blue-100 text-blue-700' : ''}`}
                        >
                          <div>{DAY_NAMES[idx]}</div>
                          <div className="text-xs font-normal">
                            {date.getMonth() + 1}/{date.getDate()}
                            {isToday && <span className="ml-1">(오늘)</span>}
                          </div>
                          {/* 디버깅: dateKey 표시 */}
                          <div className="text-[10px] text-gray-400">{dateKey}</div>
                        </TableHead>
                      );
                    })}
                    <TableHead className="w-[150px] font-semibold text-center">주간 요약</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyEmployeeData.length > 0 ? (
                    weeklyEmployeeData.map((empData) => (
                      <TableRow key={empData.employeeId} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{empData.employeeName}</TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(empData.currentStatus)}
                        </TableCell>
                        {weekDates.map((date, idx) => {
                          const dateKey = formatDateKey(date);
                          const dayData = empData.weeklyData[dateKey] || {
                            status: 'none' as const,
                            tasks: [],
                          };
                          return renderDayCell(emp.employeeId, dayData, dateKey, idx);
                        })}
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {formatDuration(empData.weeklyTotalMinutes)} / {formatDuration(empData.weeklyTargetMinutes)}
                            </div>
                            <Progress
                              value={Math.min((empData.weeklyTotalMinutes / empData.weeklyTargetMinutes) * 100, 100)}
                              className="h-2"
                            />
                            <div className="text-xs text-slate-500">
                              {Math.round((empData.weeklyTotalMinutes / empData.weeklyTargetMinutes) * 100)}% 달성
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                        등록된 근로자가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 범례 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium text-slate-600">범례:</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-50 rounded flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <span>완료</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-50 rounded ring-2 ring-blue-400 ring-inset flex items-center justify-center">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </div>
              <span>근무중</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-50 rounded flex items-center justify-center">
                <FileText className="h-4 w-4 text-slate-400" />
              </div>
              <span>예정</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-50 rounded flex items-center justify-center">
                <XCircle className="h-4 w-4 text-red-500" />
              </div>
              <span>결근</span>
            </div>
            <span className="text-slate-400 ml-4">* 각 셀에 마우스를 올리면 상세 업무 내용을 확인할 수 있습니다</span>
          </div>
        </CardContent>
      </Card>

      {/* 날짜별 근무 기록 수정 모달 */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>근무 기록 {selectedDateObj ? `${selectedDateObj.getMonth() + 1}월 ${selectedDateObj.getDate()}일` : ''}</DialogTitle>
            <DialogDescription>
              {selectedEmployeeId && employees.find(e => e.id === selectedEmployeeId)?.name}님의 근무 시간을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">출근 시간</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">퇴근 시간</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            {startTime && endTime && (
              <div className="text-sm text-slate-600">
                근무 시간: {(() => {
                  const [startH, startM] = startTime.split(':').map(Number);
                  const [endH, endM] = endTime.split(':').map(Number);
                  const startMinutes = startH * 60 + startM;
                  const endMinutes = endH * 60 + endM;
                  const duration = endMinutes - startMinutes;
                  const hours = Math.floor(duration / 60);
                  const minutes = duration % 60;
                  return `${hours}시간 ${minutes}분`;
                })()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveWorkRecord} disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

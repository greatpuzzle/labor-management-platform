import React, { useState, useEffect } from 'react';
import { Employee, companies } from '@shared/data';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Calendar, Clock, User, CheckCircle2, Download, Building2, Bell, Loader2 } from "lucide-react";
import { api, WorkRecord as ApiWorkRecord } from '@shared/api';
import { toast } from 'sonner';
import { User as UserType } from "@shared/data";

interface WorkRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number; // 분 단위
  status: 'in_progress' | 'completed';
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

export function WorkRecordsDashboard({ 
  employees, 
  user, 
  allCompanies = [], 
  selectedCompanyId, 
  onCompanyChange 
}: WorkRecordsDashboardProps) {
  // Use selectedCompanyId as companyId
  const companyId = selectedCompanyId;
  
  // Get current company info
  const currentCompany = user.role === 'SUPER_ADMIN'
    ? allCompanies.find(c => c.id === companyId)
    : user.company;

  // Filter employees by company (only show employees from selected company)
  const filteredEmployees = employees.filter(e => e.companyId === companyId);
  
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [sendingNotifications, setSendingNotifications] = useState(false);

  // Load work records from API
  useEffect(() => {
    const loadWorkRecords = async () => {
      if (!companyId) {
        setWorkRecords([]);
        return;
      }

      setLoading(true);
      try {
        console.log(`[WorkRecords] Loading work records for company: ${companyId}`);
        const apiRecords = await api.getWorkRecordsByCompany(companyId);
        console.log(`[WorkRecords] API response:`, apiRecords);

        // API 응답에 employee 정보가 포함되어 있으면 사용, 없으면 employees 배열에서 찾기
        const converted: WorkRecord[] = apiRecords.map((record: any) => {
          // API 응답에 employee 정보가 포함되어 있는지 확인
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
            status: (record.status || 'IN_PROGRESS').toLowerCase() as 'in_progress' | 'completed',
            notes: record.notes || '',
          };
        });

        setWorkRecords(converted);
        console.log(`✅ 근로 기록 로드 완료: ${converted.length}건`, converted);
      } catch (error: any) {
        console.error('Failed to load work records:', error);
        console.error('Error details:', error.response?.data || error.message);
        toast.error(`근무 기록을 불러오는데 실패했습니다: ${error.response?.data?.message || error.message}`);
        setWorkRecords([]);
      } finally {
        setLoading(false);
      }
    };

    loadWorkRecords();
  }, [companyId]); // employees 의존성 제거 (무한 루프 방지)

  // 필터링된 기록
  const filteredRecords = workRecords.filter(record => {
    const matchesDate = selectedDate === "all" || record.date === selectedDate;
    const matchesEmployee = selectedEmployeeId === "all" || record.employeeId === selectedEmployeeId;
    return matchesDate && matchesEmployee;
  });

  // 날짜별 통계
  const dateOptions = Array.from(new Set(workRecords.map(r => r.date)))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}시간 ${mins}분`;
  };

  // Excel 다운로드
  const handleExcelDownload = async () => {
    try {
      const blob = await api.exportWorkRecordsToExcel(companyId, new Date().getFullYear());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `고용부담금_신고_${new Date().getFullYear()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Excel 파일이 다운로드되었습니다.');
    } catch (error: any) {
      console.error('Failed to download Excel:', error);
      toast.error('Excel 다운로드에 실패했습니다.');
    }
  };

  // 통계 계산
  const totalRecords = filteredRecords.length;
  const totalMinutes = filteredRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
  const averageMinutes = totalRecords > 0 ? Math.floor(totalMinutes / totalRecords) : 0;

  // 일주일 단위 근무 알림 보내기
  const handleSendWeeklyNotifications = async () => {
    if (!companyId) {
      toast.error('회사를 선택해주세요.');
      return;
    }

    setSendingNotifications(true);
    
    try {
      // 근무현황 탭에서 선택한 회사의 직원을 직접 조회
      const employeeData = await api.getEmployeesByCompany(companyId);
      
      if (!employeeData || employeeData.length === 0) {
        toast.error('선택한 회사에 근로자가 없습니다.');
        setSendingNotifications(false);
        return;
      }

      // 계약이 완료된 근로자만 필터링
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

      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      // 각 근로자에게 일주일치 스케줄 생성 (오늘 날짜 기준)
      for (const employee of completedEmployees) {
        try {
          await api.createWeeklySchedule(employee.id);
          successCount++;
        } catch (error: any) {
          failCount++;
          errors.push(`${employee.name}: ${error.response?.data?.message || error.message}`);
          console.error(`Failed to create weekly schedule for ${employee.name}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(
          `일주일치 근무 스케줄 생성 완료! ${successCount}명에게 알림을 보냈습니다.${failCount > 0 ? ` (실패: ${failCount}명)` : ''}`,
          { duration: 5000 }
        );
      }

      if (failCount > 0 && successCount === 0) {
        toast.error(`알림 전송에 실패했습니다. (${errors.slice(0, 3).join(', ')})`);
      } else if (failCount > 0) {
        console.warn('일부 근로자에게 알림 전송 실패:', errors);
      }
    } catch (error: any) {
      console.error('Failed to send weekly notifications:', error);
      toast.error('알림 전송 중 오류가 발생했습니다.');
    } finally {
      setSendingNotifications(false);
    }
  };

  // If no company is selected (especially for super admin), show a message
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

  return (
    <div className="space-y-6">
      {/* Top Section: Header & Company Selector */}
      <div className="flex flex-col gap-6 border-b pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {user.role === 'SUPER_ADMIN' ? (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">Super Admin</Badge>
              ) : (
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Admin</Badge>
              )}
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">근무 현황</h2>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-slate-500">근로자 근무 기록 조회 및 관리</p>
              {/* 회사 선택 드롭다운 - 오른쪽에 배치 */}
              {user.role === 'SUPER_ADMIN' && allCompanies.length > 0 && onCompanyChange && (
                <div className="flex items-center gap-2">
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
                </div>
              )}
            </div>
            {/* 일주일 단위 근무 알림 보내기 버튼 */}
            <div className="flex items-center gap-2 mt-2">
              <Button
                onClick={handleSendWeeklyNotifications}
                disabled={sendingNotifications || !companyId}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {sendingNotifications ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    전송 중...
                  </>
                ) : (
                  <>
                    <Bell className="mr-2 h-4 w-4" />
                    일주일 단위 근무 알림 보내기
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 근무 기록</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}건</div>
            <p className="text-xs text-muted-foreground mt-1">
              선택한 기간 내 기록
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 근무 시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalMinutes)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              누적 근무 시간
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 근무 시간</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(averageMinutes)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              1회 평균
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>근무 기록 조회</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">날짜 선택</label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <SelectValue placeholder="날짜 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 기간</SelectItem>
                  {dateOptions.map(date => (
                    <SelectItem key={date} value={date}>
                      {formatDate(date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">근로자 선택</label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="근로자 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 근로자</SelectItem>
                  {filteredEmployees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 기록 테이블 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>상세 기록</CardTitle>
          <Button onClick={handleExcelDownload} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Excel 다운로드
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  <TableHead>근로자</TableHead>
                  <TableHead>시작 시간</TableHead>
                  <TableHead>종료 시간</TableHead>
                  <TableHead>근무 시간</TableHead>
                  <TableHead>업무 내용</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map(record => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {formatDate(record.date)}
                      </TableCell>
                      <TableCell>{record.employeeName}</TableCell>
                      <TableCell>{formatTime(record.startTime)}</TableCell>
                      <TableCell>
                        {record.endTime ? formatTime(record.endTime) : '-'}
                      </TableCell>
                      <TableCell>
                        {record.duration ? formatDuration(record.duration) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                          {record.notes}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.status === 'completed' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> 완료
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                            <Clock className="h-3 w-3" /> 근무중
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                      조회된 근무 기록이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

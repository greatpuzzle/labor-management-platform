import * as React from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Download, FileSpreadsheet, Building2 } from "lucide-react"
import { User, Employee } from "@shared/data"
import { toast } from "sonner"
import * as XLSX from 'xlsx'
import { api } from "@shared/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

interface Company {
  id: string;
  name: string;
  ceo: string;
  address: string;
  phone: string;
  businessNumber: string | null;
  stampImageUrl: string | null;
}

interface DocumentDownloadDashboardProps {
  user: User;
  employees: Employee[]; // 이 prop은 더 이상 사용하지 않지만 호환성을 위해 유지
  allCompanies?: Company[];
  selectedCompanyId: string;
  onCompanyChange?: (companyId: string) => void;
}

// API Employee를 내부 Employee 형식으로 변환
const convertApiEmployee = (apiEmp: any): Employee => {
  return {
    id: apiEmp.id,
    companyId: apiEmp.companyId,
    name: apiEmp.name,
    phone: apiEmp.phone,
    dob: apiEmp.dob,
    workingHours: apiEmp.workingHours,
    salary: apiEmp.salary,
    contractPeriod: apiEmp.contractPeriod,
    disabilityLevel: apiEmp.disabilityLevel === 'SEVERE' ? '중증' : '경증',
    disabilityType: apiEmp.disabilityType,
    disabilityRecognitionDate: apiEmp.disabilityRecognitionDate,
    emergencyContactName: apiEmp.emergencyContactName,
    emergencyContactPhone: apiEmp.emergencyContactPhone,
    documentUrl: apiEmp.documentUrl,
    sensitiveInfoConsent: apiEmp.sensitiveInfoConsent,
    contractStatus: apiEmp.contractStatus,
  };
};

export function DocumentDownloadDashboard({
  user,
  employees: _employees, // 더 이상 사용하지 않음
  allCompanies = [],
  selectedCompanyId,
  onCompanyChange
}: DocumentDownloadDashboardProps) {
  // 서류 다운로드 탭 전용 직원 목록 state
  const [documentsEmployees, setDocumentsEmployees] = React.useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = React.useState(false);

  // Get current company info
  const currentCompany = user.role === 'SUPER_ADMIN'
    ? allCompanies.find(c => c.id === selectedCompanyId)
    : user.company

  // selectedCompanyId가 변경될 때마다 해당 회사의 직원을 로드
  // 계약관리 탭과 독립적으로 작동
  React.useEffect(() => {
    const loadDocumentsEmployees = async () => {
      // 회사 ID 결정: 슈퍼 관리자는 selectedCompanyId, 일반 관리자는 user.companyId
      const companyIdToLoad = user.role === 'SUPER_ADMIN' 
        ? selectedCompanyId 
        : (user.companyId || selectedCompanyId);

      if (!companyIdToLoad) {
        setDocumentsEmployees([]);
        return;
      }

      setLoadingEmployees(true);
      try {
        const employeeData = await api.getEmployeesByCompany(companyIdToLoad);
        const convertedEmployees = employeeData.map(convertApiEmployee);
        setDocumentsEmployees(convertedEmployees);
      } catch (error: any) {
        console.error('Failed to load employees for documents:', error);
        toast.error('직원 목록을 불러오는데 실패했습니다.');
        setDocumentsEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadDocumentsEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId, user?.companyId, user?.role]);

  // Filter employees by company (documentsEmployees 사용)
  const filteredEmployees = documentsEmployees.filter(e => e.companyId === selectedCompanyId)

  // If no company is selected (especially for super admin), show a message
  if (!currentCompany && user.role === 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">회사를 선택해주세요</h3>
          <p className="text-slate-500">
            위 드롭다운에서 다운로드할 회사를 선택하세요.
          </p>
        </div>
      </div>
    );
  }

  // 로딩 중일 때 표시
  if (loadingEmployees) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-500">직원 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 장애 유형 매핑 함수 (두 번째 이미지 참고)
  const mapDisabilityType = (disabilityType: string): string => {
    const mapping: { [key: string]: string } = {
      '지체장애': '10',
      '뇌병변장애': '20',
      '시각장애': '30',
      '청각장애': '40',
      '언어장애': '50',
      '지적장애': '60',
      '정신장애': '70',
      '자폐성장애': '80',
      '신장장애': '90',
      '심장장애': 'A0',
      '호흡기장애': 'B0',
      '간장애': 'C0',
      '안면장애': 'D0',
      '장루요루장애': 'E0',
      '뇌전증장애': 'F0',
      '국가유공': 'G0',
    };
    return mapping[disabilityType] || disabilityType;
  }

  // 근로자 명단 Excel 다운로드
  const handleDownloadEmployeeList = () => {
    if (!currentCompany) return;

    if (filteredEmployees.length === 0) {
      toast.error("다운로드할 근로자가 없습니다.");
      return;
    }

    // 헤더 정의
    const headers = [
      '사업자등록번호', '주민등록번호', '주민순번', '근로자명', '연락처',
      '장애인정구분', '장애유형', '상이등급', '중증여부', '장애인정일',
      '입사일', '퇴사일', '근무직종', '임금', '타지원금\n명칭', '타지원금\n수령시작일', '타지원금\n수령종료일'
    ];

    // 월별 헤더 추가 (1월~12월)
    for (let month = 1; month <= 12; month++) {
      headers.push(
        `${month}월최저`,
        `${month}월최저예외`,
        `${month}월임금`,
        `${month}월중증여부`,
        `${month}월2배수여부`,
        `${month}월타지원금`,
        `${month}월고용보험`
      );
    }

    // 데이터 행 생성
    const rows = filteredEmployees.map(emp => {
      // 중증여부: 중증이면 Y, 경증이면 N
      const isSevere = emp.disabilityLevel === '중증' ? 'Y' : 'N';

      // 장애 유형 코드로 변환
      const disabilityTypeCode = mapDisabilityType(emp.disabilityType);

      // 국가유공(G0)이 아닌 경우 장애인정구분 설정
      const isNationalMerit = disabilityTypeCode === 'G0';
      const disabilityClassification = isNationalMerit ? '' : '1';

      // 계약기간에서 입사일/퇴사일 파싱 (예: "2026.01.01 ~ 2026.12.31")
      // 점(.) 제거 후 숫자만 (예: "2026.01.01" -> "20260101")
      // 퇴사일이 현재 날짜보다 큰 경우(미래) 빈 문자열로 처리
      let startDate = '';
      let endDate = '';
      if (emp.contractPeriod) {
        const parts = emp.contractPeriod.split('~').map(s => s.trim());
        if (parts.length === 2) {
          // 점(.) 제거
          startDate = parts[0].replace(/\./g, '');
          const originalEndDate = parts[1];
          const endDateFormatted = originalEndDate.replace(/\./g, '');
          
          // 퇴사일이 현재 날짜보다 큰지 확인
          // 날짜 형식: "YYYY.MM.DD" -> Date 객체로 변환
          const parseDateForComparison = (dateStr: string): Date | null => {
            if (!dateStr) return null;
            const parts = dateStr.split('.');
            if (parts.length === 3) {
              return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
            return null;
          };
          
          const endDateObj = parseDateForComparison(originalEndDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // 시간 부분 제거하여 날짜만 비교
          
          // 퇴사일이 현재 날짜보다 크면(미래) 빈 문자열로 처리
          if (endDateObj && endDateObj > today) {
            endDate = '';
          } else {
            endDate = endDateFormatted;
          }
        }
      }

      // 장애인정일에서 점(.) 제거 (예: "2025.06.10" -> "20250610")
      const disabilityRecognitionDate = emp.disabilityRecognitionDate 
        ? emp.disabilityRecognitionDate.replace(/\./g, '') 
        : '';

      // 임금에서 쉼표(,) 및 문자 제거 후 숫자만 추출 (예: "월 2,500,000원" -> "2500000")
      const extractSalary = (salaryStr: string): string => {
        if (!salaryStr) return '';
        // 숫자만 추출
        const numbers = salaryStr.replace(/[^0-9]/g, '');
        return numbers || '';
      };

      const salary = extractSalary(emp.salary || '');

      // 기본 데이터
      const row: string[] = [
        currentCompany.businessNumber || '',  // 사업자등록번호
        '',                                   // 주민등록번호 (개인정보라 빈값)
        '1',                                  // 주민순번
        emp.name || '',                       // 근로자명
        emp.phone || '',                      // 연락처
        disabilityClassification,             // 장애인정구분
        disabilityTypeCode,                   // 장애유형
        isNationalMerit ? '' : '00',          // 상이등급 (국가유공이 아닐 때만)
        isSevere,                             // 중증여부
        disabilityRecognitionDate,            // 장애인정일 (점 제거)
        startDate,                            // 입사일 (점 제거)
        endDate,                              // 퇴사일 (점 제거)
        '1',                                  // 근무직종 (기본값)
        salary,                               // 임금 (쉼표, 문자 제거)
        '',                                   // 타지원금 명칭
        '',                                   // 타지원금 수령시작일
        '',                                   // 타지원금 수령종료일
      ];

      // 월별 데이터 추가 (1월~12월)
      // 현재 연도 - 1을 기준 연도로 사용
      const targetYear = new Date().getFullYear() - 1;

      // 입사일/퇴사일을 Date 객체로 파싱 (원본 형식 사용: "2026.01.01")
      // 엑셀에는 점이 제거된 형식으로 저장하지만, 계산용으로는 원본 형식 사용
      const parseDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        // 점이 있는 경우만 처리 (원본 형식)
        if (dateStr.includes('.')) {
          const parts = dateStr.split('.');
          if (parts.length === 3) {
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          }
        }
        return null;
      };

      // 원본 계약기간에서 입사일/퇴사일 추출 (점 포함 형식)
      const originalStartDate = emp.contractPeriod ? emp.contractPeriod.split('~')[0].trim() : '';
      const originalEndDate = emp.contractPeriod ? emp.contractPeriod.split('~')[1].trim() : '';
      const startDateObj = parseDate(originalStartDate);
      const endDateObj = parseDate(originalEndDate);

      for (let month = 1; month <= 12; month++) {
        // 해당 월이 입사일~퇴사일 사이인지 확인
        // targetYear년 해당 월의 마지막 날까지 포함
        const monthStart = new Date(targetYear, month - 1, 1);
        const monthEnd = new Date(targetYear, month, 0); // 해당 월의 마지막 날

        let isWithinContract = false;
        if (startDateObj && endDateObj) {
          // 해당 월이 계약기간과 겹치는지 확인
          isWithinContract = monthEnd >= startDateObj && monthStart <= endDateObj;
        }

        // 월별 임금도 숫자만 (쉼표 제거)
        const monthSalary = isWithinContract ? salary : '0';

        row.push(
          'N',           // N월최저 (기본값)
          'N',           // N월최저예외 (기본값)
          monthSalary,   // N월임금 (입사~퇴사 사이면 임금, 아니면 0) - 숫자만
          isSevere,      // N월중증여부
          'Y',           // N월2배수여부 (기본값)
          'N',           // N월타지원금 (기본값)
          'Y'            // N월고용보험 (기본값)
        );
      }

      return row;
    });

    // 워크북 생성 (aoa_to_sheet 사용 - 모든 값을 문자열로)
    const wb = XLSX.utils.book_new();
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData, { cellStyles: true });

    // 모든 셀을 텍스트 형식으로 설정
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        // 셀 형식을 텍스트로 설정
        ws[cellAddress].z = '@';
        ws[cellAddress].t = 's';
        // 값을 문자열로 변환
        if (ws[cellAddress].v !== undefined && ws[cellAddress].v !== null) {
          ws[cellAddress].v = String(ws[cellAddress].v);
        }
      }
    }

    // 컬럼 너비 설정
    const colWidths = headers.map(() => ({ wch: 15 }));
    ws['!cols'] = colWidths;

    // 시트 이름을 Sheet1로 설정
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // 파일 다운로드
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${currentCompany.name}_근로자명단_${today}.xlsx`);

    toast.success("Excel 파일이 다운로드되었습니다!");
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
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">서류 다운로드</h2>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-slate-500">근로자 관련 서류를 다운로드할 수 있습니다</p>
              {/* 회사 선택 드롭다운 - 오른쪽에 배치 */}
              {user.role === 'SUPER_ADMIN' && allCompanies.length > 0 && onCompanyChange && (
                <div className="flex items-center gap-2">
                  <Select value={selectedCompanyId} onValueChange={onCompanyChange}>
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
                  <Badge variant="outline" className="font-normal text-slate-500">{filteredEmployees.length}명</Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 다운로드 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 근로자 명단 다운로드 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">근로자 명단</CardTitle>
                  <CardDescription className="mt-1">
                    Excel 형식으로 다운로드
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-slate-600">
                <p className="mb-2">다음 정보가 포함됩니다:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>성명, 생년월일, 전화번호</li>
                  <li>장애정도, 장애유형, 장애인정일</li>
                  <li>비상연락망 정보</li>
                  <li>계약기간, 근로시간, 급여</li>
                  <li>계약상태</li>
                </ul>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-slate-500">
                  총 {filteredEmployees.length}명
                </span>
                <Button
                  onClick={handleDownloadEmployeeList}
                  disabled={filteredEmployees.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  다운로드
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 향후 추가 가능한 다른 다운로드 카드들 */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <FileSpreadsheet className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-400">추가 서류</CardTitle>
                  <CardDescription className="mt-1">
                    향후 추가 예정
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">
              추가 서류 다운로드 기능은 향후 제공될 예정입니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


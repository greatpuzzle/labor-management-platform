import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"
import { Checkbox } from "./ui/checkbox"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  FileText,
  PenTool,
  CircleCheck,
  CircleAlert,
  Send,
  Settings,
  Check,
  X,
  ZoomIn,
  ZoomOut,
  ChevronsUpDown,
  Building2,
  Stamp,
  Link as LinkIcon,
  Clock,
  FileDown,
  Trash2
} from "lucide-react"
import * as XLSX from 'xlsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "./ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs"
import { User, Employee } from "@shared/data" // Import types
import { toast } from "sonner"
import { StampManager } from "./StampManager"
import { api } from "@shared/api"

interface Company {
  id: string;
  name: string;
  ceo: string;
  address: string;
  phone: string;
  businessNumber: string | null;
  stampImageUrl: string | null;
}

interface ContractDashboardProps {
  stampImage: string | null;
  setStampImage: (image: string | null) => void;
  user: User;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  allCompanies?: Company[];
  selectedCompanyId?: string | null;
  onCompanyChange?: (companyId: string) => void;
}

export function ContractDashboard({
  stampImage,
  setStampImage,
  user,
  employees,
  setEmployees,
  allCompanies = [],
  selectedCompanyId: propSelectedCompanyId,
  onCompanyChange
}: ContractDashboardProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  // Company Selection State (for COMPANY_ADMIN only)
  const [localSelectedCompanyId, setLocalSelectedCompanyId] = React.useState<string>("")

  // Employee Filter State (현재 근로자 / 이전 근로자)
  const [employeeFilter, setEmployeeFilter] = React.useState<'current' | 'previous'>('current')

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [editWorkingHours, setEditWorkingHours] = React.useState("13:00 ~ 16:30")
  const [editSalary, setEditSalary] = React.useState("920,000")
  const [editContractPeriod, setEditContractPeriod] = React.useState("2026.01.02 ~ 2027.01.01")

  // Preview & Sign Modal State
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)
  const [isSigned, setIsSigned] = React.useState(false)
  const [currentPreviewIndex, setCurrentPreviewIndex] = React.useState(0)
  const [zoomLevel, setZoomLevel] = React.useState(0.8)
  const [viewingCompletedContract, setViewingCompletedContract] = React.useState(false)
  const [completedContractData, setCompletedContractData] = React.useState<any | null>(null)
  const [loadingContract, setLoadingContract] = React.useState(false)

  // KakaoTalk Message Preview State
  const [isKakaoPreviewOpen, setIsKakaoPreviewOpen] = React.useState(false)
  const [kakaoPreviewData, setKakaoPreviewData] = React.useState<{
    employeeName: string;
    employeePhone: string;
    message: string;
    contractLink: string;
    appInstallLink: string;
    isMock: boolean;
  } | null>(null)

  // Stamp Management State (Only used for Super Admin here, Company Admin uses Sidebar)
  const [isStampModalOpen, setIsStampModalOpen] = React.useState(false)

  // Employee Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false)
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null)

  // Delete Confirmation Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Initialize view based on user role
  React.useEffect(() => {
    if (user.role === 'COMPANY_ADMIN' && user.companyId) {
      setLocalSelectedCompanyId(user.companyId)
    }
  }, [user])

  // Use prop selectedCompanyId for SUPER_ADMIN, local state for COMPANY_ADMIN
  const activeCompanyId = user.role === 'SUPER_ADMIN'
    ? (propSelectedCompanyId || '')
    : localSelectedCompanyId

  // Derived Data
  const currentCompany = user.role === 'SUPER_ADMIN'
    ? allCompanies.find(c => c.id === activeCompanyId)
    : user.company // COMPANY_ADMIN uses their own company from user object

  // 계약 기간 파싱 함수
  const parseContractPeriod = (period: string): { start: Date; end: Date } | null => {
    try {
      // 형식: "2026.01.02 ~ 2027.01.01"
      const match = period.match(/(\d{4})\.(\d{2})\.(\d{2})\s*~\s*(\d{4})\.(\d{2})\.(\d{2})/)
      if (!match) return null
      
      const [, startYear, startMonth, startDay, endYear, endMonth, endDay] = match
      const start = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay))
      const end = new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay))
      
      return { start, end }
    } catch {
      return null
    }
  }

  // 계약 기간이 현재 유효한지 확인
  const isContractActive = (period: string): boolean => {
    const parsed = parseContractPeriod(period)
    if (!parsed) return false
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(parsed.start)
    start.setHours(0, 0, 0, 0)
    const end = new Date(parsed.end)
    end.setHours(23, 59, 59, 999)
    
    return today >= start && today <= end
  }

  // 회사별 필터링
  const companyFilteredEmployees = employees.filter(e => e.companyId === activeCompanyId)
  
  // 현재/이전 근로자 필터링
  const filteredEmployees = companyFilteredEmployees.filter(employee => {
    if (employeeFilter === 'current') {
      // 현재 근로자: 계약 기간이 현재 시점에 유효한 경우
      return isContractActive(employee.contractPeriod)
    } else {
      // 이전 근로자: 계약 기간이 만료된 경우
      return !isContractActive(employee.contractPeriod)
    }
  })

  // If no company is selected (especially for super admin), show a message
  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">회사를 선택해주세요</h3>
          <p className="text-slate-500">
            {user.role === 'SUPER_ADMIN'
              ? '위 드롭다운에서 관리할 회사를 선택하세요.'
              : '회사 정보를 불러오는 중입니다...'}
          </p>
        </div>
      </div>
    );
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // 모든 근로자 선택 (삭제 기능을 위해 발송/완료된 근로자도 선택 가능)
      const allEmployeeIds = filteredEmployees.map(e => e.id)
      setSelectedIds(new Set(allEmployeeIds))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    // 모든 근로자 선택 가능 (삭제 기능을 위해 발송/완료된 근로자도 선택 가능)
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleUpdateConditions = async () => {
    try {
      // Update selected employees via API
      const updatePromises = Array.from(selectedIds).map(id =>
        api.updateEmployee(id, {
          workingHours: editWorkingHours,
          salary: editSalary,
          contractPeriod: editContractPeriod,
        })
      );

      await Promise.all(updatePromises);

      // Update local state
      const updatedEmployees = employees.map(emp => {
        if (selectedIds.has(emp.id)) {
          return {
            ...emp,
            workingHours: editWorkingHours,
            salary: editSalary,
            contractPeriod: editContractPeriod
          }
        }
        return emp
      });

      setEmployees(updatedEmployees);
      setIsEditModalOpen(false);
      toast.success("근로 조건이 업데이트되었습니다");
    } catch (error: any) {
      console.error('Failed to update conditions:', error);
      toast.error(error.response?.data?.message || "근로 조건 업데이트에 실패했습니다");
    }
  }

  const handleOpenPreview = () => {
    setIsSigned(false)
    setCurrentPreviewIndex(0)
    setZoomLevel(0.8)
    setViewingCompletedContract(false)
    setCompletedContractData(null)
    setIsPreviewOpen(true)
  }
  
  // 계약 완료 상태일 때 계약서 보기 핸들러
  const handleViewCompletedContract = async (employeeId: string) => {
    setLoadingContract(true);
    try {
      const contracts = await api.getContractsByEmployee(employeeId);
      const completedContract = contracts.find((c: any) => c.status === 'COMPLETED' || c.status === 'completed');
      
      if (completedContract && completedContract.pdfUrl) {
        setCompletedContractData(completedContract);
        setViewingCompletedContract(true);
        setSelectedIds(new Set([employeeId]));
        setIsPreviewOpen(true);
        setCurrentPreviewIndex(0);
        setZoomLevel(0.8);
      } else {
        console.warn('[ContractDashboard] Contract found but pdfUrl is missing:', completedContract);
        toast.error('서명된 계약서를 찾을 수 없습니다. 계약서가 서명 완료되지 않았거나 PDF가 저장되지 않았습니다.');
      }
    } catch (error: any) {
      console.error('[ContractDashboard] Failed to load contract:', error);
      toast.error('계약서를 불러오는데 실패했습니다: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingContract(false);
    }
  }

  const handleSign = () => {
    setIsSigned(true)
  }

  const handleSend = async () => {
    try {
      // Send contract to selected employees via API
      const selectedEmployees = employees.filter(emp => selectedIds.has(emp.id));
      
      // 발송/완료된 근로자가 포함되어 있는지 확인
      const processedEmployees = selectedEmployees.filter(
        emp => emp.status === 'sent' || emp.status === 'completed'
      )
      
      if (processedEmployees.length > 0) {
        toast.error("발송할 수 없는 근로자가 포함되어 있습니다", {
          description: `${processedEmployees.map(e => e.name).join(', ')}님의 계약서는 이미 발송되었거나 체결이 완료되었습니다.`,
        })
        return
      }
      
      // 발송 전 상태의 근로자만 필터링
      const draftEmployees = selectedEmployees.filter(emp => emp.status === 'draft')
      
      if (draftEmployees.length === 0) {
        toast.error("발송 가능한 근로자가 없습니다", {
          description: "발송 전 상태의 근로자만 선택할 수 있습니다.",
        })
        return
      }
      
      const sendPromises = draftEmployees.map(emp =>
        api.sendContract(emp.id, {
          workingHours: emp.workingHours,
          salary: emp.salary,
          contractPeriod: emp.contractPeriod,
        })
      );

      const results = await Promise.all(sendPromises);

      // Update local state
      const updatedEmployees = employees.map(emp => {
        if (selectedIds.has(emp.id) && emp.status === 'draft') {
          return { ...emp, status: 'sent' as const };
        }
        return emp;
      });

      setEmployees(updatedEmployees);

      // 카카오톡 메시지 미리보기 데이터 준비 (첫 번째 근로자 기준)
      if (results.length > 0) {
        const firstResult = results[0] as any;
        const firstEmployee = draftEmployees[0];
        const notification = firstResult.notification || {};
        
        // 계약서 링크 생성
        const contractLink = firstResult.links?.contractView || 
          (firstResult.contract ? `${import.meta.env.VITE_MOBILE_APP_URL || 'http://192.168.45.78:5174'}/contract/${firstResult.contract.id}` : '');
        
        // 메시지 내용 생성 (버튼만 제공하므로 링크는 메시지에 포함하지 않음)
        const message = `[그레이트퍼즐] 근로계약서가 발송되었습니다.\n\n${firstEmployee.name}님, 근로계약서를 확인하고 서명해주세요.\n\n문의: 그레이트퍼즐 고객센터`;
        
        setKakaoPreviewData({
          employeeName: firstEmployee.name,
          employeePhone: firstEmployee.phone,
          message: message,
          contractLink: contractLink,
          appInstallLink: firstResult.links?.appInstall || `${import.meta.env.VITE_MOBILE_APP_URL || 'http://192.168.45.78:5174'}/download.html`,
          isMock: notification.mock !== false, // 기본값 true (API 키가 없으면 mock)
        });
        setIsKakaoPreviewOpen(true);
      }

      toast.success("계약서가 발송되었습니다", {
        description: `${draftEmployees.length}명의 근로자에게 전자계약서를 전송했습니다. ${results[0]?.notification?.mock ? '(개발 모드: 카카오톡 메시지는 실제 전송되지 않았습니다)' : ''}`,
        duration: 5000,
      });

      setIsPreviewOpen(false);
      setSelectedIds(new Set()); // Clear selection after sending
    } catch (error: any) {
      console.error('Failed to send contracts:', error);
      toast.error(error.response?.data?.message || "계약서 발송에 실패했습니다");
    }
  }

  const handleCopyInviteLink = () => {
    // 모바일 앱 URL (근로자 정보 입력 페이지)
    // 기본값은 localhost, 네트워크 접근이 필요한 경우 환경변수로 설정
    const mobileAppUrl = import.meta.env.VITE_MOBILE_APP_URL || 'http://localhost:5174';
    // Use dedicated invite page that saves to localStorage and redirects
    const link = `${mobileAppUrl}/invite.html?invite=${activeCompanyId}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
            toast.success("초대 링크가 복사되었습니다", {
                description: "근로자에게 링크를 공유하세요.",
                duration: 3000,
            });
        }).catch((err) => {
            fallbackCopyTextToClipboard(link);
        });
    } else {
        fallbackCopyTextToClipboard(link);
    }
  }

  const fallbackCopyTextToClipboard = (text: string) => {
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
            toast.success("초대 링크가 복사되었습니다", {
                description: "근로자에게 링크를 공유하세요.",
                duration: 3000,
            });
        } else {
            throw new Error("Copy command failed");
        }
    } catch (err) {
        console.error('Fallback copy failed', err);
        toast.error("링크 복사에 실패했습니다", {
            description: "URL을 직접 복사해주세요: " + text,
            duration: 5000,
        });
    }
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

  const handleExportToExcel = () => {
    const company = allCompanies.find(c => c.id === activeCompanyId) || currentCompany;
    if (!company) return;

    if (filteredEmployees.length === 0) {
      toast.error("다운로드할 근로자가 없습니다.");
      return;
    }

    // 첫 번째 이미지의 컬럼 구조에 맞춘 Excel 데이터 준비
    const excelData = filteredEmployees.map(emp => {
      // 중증여부: 중증이면 Y, 경증이면 N
      const isSevere = emp.disabilityLevel === '중증' ? 'Y' : 'N';
      
      // 장애 유형 코드로 변환
      const disabilityTypeCode = mapDisabilityType(emp.disabilityType);
      
      // 국가유공(G0)이 아닌 경우 장애인정구분과 상이등급 설정
      const isNationalMerit = disabilityTypeCode === 'G0';
      const disabilityClassification = isNationalMerit ? '' : '1'; // 장애인정구분
      const disabilityGrade = isNationalMerit ? '' : '00'; // 상이등급

      // 예시 이미지의 기본값 적용
      return {
        'Column Name': '', // 빈 값
        'Pricing Model': 'Fixed Price',
        'Min Qty': '1',
        'Max Qty': '999999999',
        'UOM': 'EA',
        'Unit Price': '10',
        'Currency': 'USD',
        'Effective Date': '01-01-2023',
        'Expiration Date': '12-31-9999',
        'Discount Type': 'None',
        'Discount Value': '0',
        'Discount UOM': 'None',
        'Discount Currency': 'None',
        'Discount Effective Date': '01-01-2023',
        'Discount Expiration Date': '12-31-9999',
        'Tier Type': 'None',
        'Tier Min Qty': '0',
        'Tier Max Qty': '0',
        'Tier UOM': 'None',
        'Tier Unit Price': '0',
        'Tier Currency': 'None',
        'Tier Effective Date': '01-01-2023',
        'Tier Expiration Date': '12-31-9999',
        'Tier Discount Type': 'None',
        'Tier Discount Value': '0',
        'Tier Discount UOM': 'None',
        'Tier Discount Currency': 'None',
        'Tier Discount Effective Date': '01-01-2023',
        'Tier Discount Expiration Date': '12-31-9999',
        'Custom Field 1': emp.name || '', // 성명
        'Custom Field 2': emp.dob || '', // 생년월일
        'Custom Field 3': emp.phone || '', // 전화번호
        'Custom Field 4': disabilityTypeCode, // 장애유형 (코드)
        'Custom Field 5': isSevere, // 중증여부: Y (중증인 경우)
        'Custom Field 6': '1', // 근무직종: 1
        'Custom Field 7': 'N', // N월 최저: N
        'Custom Field 8': 'N', // N월 최저예외: N
        'Custom Field 9': isSevere, // N월 중증여부: Y (중증인 경우)
        'Custom Field 10': 'Y', // N월 2배수 여부: Y
        'Custom Field 11': 'N', // N월 타지원금: N
        'Custom Field 12': 'Y', // N월 고용보험: Y
        'Custom Field 13': emp.disabilityRecognitionDate || '', // 장애인정일
        'Custom Field 14': disabilityClassification, // 장애인정구분: 국가유공(G0)이 아닌 경우 '1', 그 외 ''
        'Custom Field 15': disabilityGrade, // 상이등급: 국가유공(G0)이 아닌 경우 '00', 그 외 ''
        'Custom Field 16': emp.emergencyContactName || '', // 비상연락망(성명)
        'Custom Field 17': emp.emergencyContactPhone || '', // 비상연락망(전화)
        'Custom Field 18': emp.contractPeriod || '', // 계약기간
        'Custom Field 19': emp.workingHours || '', // 근로시간
        'Custom Field 20': emp.salary || '', // 급여
      };
    });

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // 모든 셀을 텍스트 형식으로 설정
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        
        // 셀 형식을 텍스트로 설정
        ws[cellAddress].z = '@'; // 텍스트 형식
        // 값이 숫자로 저장된 경우 문자열로 변환
        if (typeof ws[cellAddress].v === 'number') {
          ws[cellAddress].v = String(ws[cellAddress].v);
          ws[cellAddress].t = 's'; // 문자열 타입
        }
      }
    }

    // 컬럼 너비 설정 (첫 번째 이미지의 컬럼 수에 맞춤)
    const colWidths = Array(50).fill(15); // 50개 컬럼, 각 15 너비
    ws['!cols'] = colWidths.map(w => ({ wch: w }));

    // 시트 이름을 Sheet1로 설정
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // 파일 다운로드
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${company.name}_근로자명단_${today}.xlsx`);

    toast.success("Excel 파일이 다운로드되었습니다!");
  }

  const handleDeleteEmployees = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      // Delete selected employees via API
      const deletePromises = Array.from(selectedIds).map(id =>
        api.deleteEmployee(id)
      );

      await Promise.all(deletePromises);

      // Update local state
      const updatedEmployees = employees.filter(emp => !selectedIds.has(emp.id));
      setEmployees(updatedEmployees);

      toast.success(`${selectedIds.size}명의 근로자가 삭제되었습니다.`);
      setSelectedIds(new Set());
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to delete employees:', error);
      toast.error(error.response?.data?.message || "근로자 삭제에 실패했습니다");
    } finally {
      setIsDeleting(false);
    }
  }

  const allSelected = filteredEmployees.length > 0 && selectedIds.size === filteredEmployees.length
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredEmployees.length

  const selectedEmployees = employees.filter(e => selectedIds.has(e.id))
  const previewEmployee = selectedEmployees[currentPreviewIndex] || selectedEmployees[0]

  // 선택된 근로자 중 발송/체결된 근로자가 있는지 확인
  const hasProcessedEmployees = selectedEmployees.some(
    emp => emp.status === 'completed' || emp.status === 'sent'
  )
  // 선택된 근로자 중 발송 가능한(draft) 근로자만 있는지 확인
  const hasDraftEmployees = selectedEmployees.some(emp => emp.status === 'draft')

  const today = new Date()
  
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
                 <h2 className="text-2xl font-bold tracking-tight text-slate-900">{user.name}님, 환영합니다!</h2>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-slate-500">기업별 근로자 및 계약 관리 대시보드</p>
                {/* 회사 선택 드롭다운 - 오른쪽에 배치 */}
                {user.role === 'SUPER_ADMIN' && allCompanies.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Select value={activeCompanyId} onValueChange={onCompanyChange}>
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
             {/* 회사 관리자는 회사명 표시 */}
             {user.role === 'COMPANY_ADMIN' && (
               <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                 {currentCompany?.name || ''}
                 <Badge variant="outline" className="font-normal text-slate-500">{filteredEmployees.length}명</Badge>
               </h3>
             )}
             {/* 현재/이전 근로자 필터 */}
             <Tabs value={employeeFilter} onValueChange={(value) => setEmployeeFilter(value as 'current' | 'previous')}>
               <TabsList className="grid w-full grid-cols-2">
                 <TabsTrigger value="current">현재 근로자</TabsTrigger>
                 <TabsTrigger value="previous">이전 근로자</TabsTrigger>
               </TabsList>
             </Tabs>
        </div>
        
        <div className="flex items-center gap-2">
           {/* 초대 링크 복사 */}
           <Button
             variant="outline"
             className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
             onClick={handleCopyInviteLink}
           >
              <LinkIcon className="mr-2 h-4 w-4" />
              초대 링크
           </Button>

           {/* Excel 다운로드 */}
           <Button
             variant="outline"
             className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
             onClick={handleExportToExcel}
             disabled={filteredEmployees.length === 0}
           >
              <FileDown className="mr-2 h-4 w-4" />
              Excel 다운로드
           </Button>

           {/* 직인 관리 버튼 - ONLY VISIBLE TO SUPER ADMIN in Dashboard */}
           {user.role === 'SUPER_ADMIN' && (
             <Button
               variant="outline"
               className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
               onClick={() => setIsStampModalOpen(true)}
             >
                <Stamp className="mr-2 h-4 w-4" />
                직인 관리
             </Button>
           )}

           {/* 삭제 버튼 */}
           <Button
             variant="outline"
             className="bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300"
             disabled={selectedIds.size === 0}
             onClick={() => setIsDeleteDialogOpen(true)}
           >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
           </Button>

           {/* 근로조건 수정 */}
           <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                disabled={selectedIds.size === 0 || hasProcessedEmployees}
                title={hasProcessedEmployees ? "발송/체결된 근로자는 근로조건을 수정할 수 없습니다" : ""}
              >
                <Settings className="mr-2 h-4 w-4" />
                근로조건 수정
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>근로조건 수정</DialogTitle>
                <DialogDescription>
                  선택된 {selectedIds.size}명의 근로자에 대해 일괄 적용할 근로조건을 입력하세요.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contractPeriod" className="text-right">
                    계약 기간
                  </Label>
                  <Input
                    id="contractPeriod"
                    value={editContractPeriod}
                    onChange={(e) => setEditContractPeriod(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="workingHours" className="text-right">
                    근로시간
                  </Label>
                  <Input
                    id="workingHours"
                    value={editWorkingHours}
                    onChange={(e) => setEditWorkingHours(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="salary" className="text-right">
                    급여
                  </Label>
                  <Input
                    id="salary"
                    value={editSalary}
                    onChange={(e) => setEditSalary(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={handleUpdateConditions}>확인</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

           {/* 서명 및 발송 */}
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <Button
              variant={selectedIds.size > 0 && hasDraftEmployees ? "default" : "outline"}
              className={selectedIds.size > 0 && hasDraftEmployees ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-slate-500"}
              disabled={selectedIds.size === 0 || !hasDraftEmployees}
              onClick={handleOpenPreview}
              title={!hasDraftEmployees && selectedIds.size > 0 ? "발송 전 상태의 근로자만 발송할 수 있습니다" : ""}
            >
              <Send className="mr-2 h-4 w-4" />
              서명 및 발송
            </Button>
            {/* Modal for Preview - Maximized size for better visibility */}
            <DialogContent className="w-[98vw] max-w-[98vw] sm:max-w-[98vw] h-[98vh] flex flex-col p-0 gap-0 bg-slate-50 overflow-hidden rounded-lg border shadow-2xl">
               {/* Toolbar */}
               <div className="px-6 py-4 border-b flex justify-between items-center bg-white shadow-sm shrink-0 z-50">
                 <div className="flex items-center gap-4">
                   <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100 hidden sm:block shadow-sm">
                      <FileText className="h-6 w-6 text-blue-600" />
                   </div>
                   <div>
                     <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                       {viewingCompletedContract ? '서명된 계약서' : '계약서 미리보기'}
                     </DialogTitle>
                     <DialogDescription className="text-sm text-slate-500 mt-1 hidden sm:block">
                       <span className="font-semibold text-slate-900">{currentCompany.name}</span> - 
                       {viewingCompletedContract 
                         ? `${previewEmployee?.name}님의 서명 완료된 계약서`
                         : `${selectedEmployees.length}명의 선택된 근로자 중 ${previewEmployee?.name}님의 계약서`
                       }
                     </DialogDescription>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-3 sm:gap-4">
                    {/* Zoom Controls */}
                    <div className="flex items-center bg-white rounded-lg p-1 border shadow-sm">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-md" onClick={() => setZoomLevel(prev => Math.max(0.4, prev - 0.1))}>
                        <ZoomOut className="h-4 w-4 text-slate-600" />
                      </Button>
                      <span className="text-xs font-semibold w-12 text-center text-slate-700 select-none">{Math.round(zoomLevel * 100)}%</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-md" onClick={() => setZoomLevel(prev => Math.min(1.2, prev + 0.1))}>
                        <ZoomIn className="h-4 w-4 text-slate-600" />
                      </Button>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

                    {/* 계약 완료 상태가 아닐 때만 도장 날인/발송 버튼 표시 */}
                    {previewEmployee && previewEmployee.status !== 'completed' && !viewingCompletedContract && (
                      <>
                        {!isSigned ? (
                          <Button onClick={handleSign} className="bg-blue-600 hover:bg-blue-700 shadow-sm whitespace-nowrap px-4 py-2 h-10 font-medium text-sm">
                            <PenTool className="mr-2 h-4 w-4" />
                            도장 날인
                          </Button>
                        ) : (
                          <Button onClick={handleSend} className="bg-green-600 hover:bg-green-700 shadow-sm animate-in fade-in zoom-in-95 duration-200 whitespace-nowrap px-4 py-2 h-10 font-medium text-sm">
                            <Send className="mr-2 h-4 w-4" />
                            발송
                          </Button>
                        )}
                      </>
                    )}
                    
                    <DialogClose asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 ml-1 rounded-full h-10 w-10">
                        <X className="h-5 w-5" />
                      </Button>
                    </DialogClose>
                 </div>
               </div>
               
               {/* Document Preview Area */}
               <div className="flex-1 overflow-auto bg-slate-100/80 relative flex justify-center py-10">
                  {previewEmployee && (
                    <>
                      {/* 계약 완료 상태일 때 서명된 계약서 PDF 표시 - 발송 전 상태와 동일한 UI 스타일 사용 */}
                      {viewingCompletedContract && completedContractData?.pdfUrl ? (
                        <div 
                          className="bg-white shadow-2xl mx-auto origin-top transition-all duration-300 ease-out border border-slate-200"
                          style={{ 
                            width: '210mm', 
                            height: '297mm',
                            transform: `scale(${zoomLevel})`,
                            marginBottom: `${(zoomLevel - 1) * 297}mm`,
                          }}
                        >
                          {completedContractData.pdfUrl.startsWith('data:application/pdf') ? (
                            <iframe
                              src={completedContractData.pdfUrl}
                              className="border-0 w-full h-full"
                              style={{
                                width: '210mm',
                                height: '297mm',
                                minHeight: '297mm',
                              }}
                              title="서명된 계약서"
                            />
                          ) : completedContractData.pdfUrl.startsWith('data:image') ? (
                            <img
                              src={completedContractData.pdfUrl}
                              alt="서명된 계약서"
                              className="w-full h-auto"
                              style={{
                                width: '210mm',
                                height: 'auto',
                                display: 'block',
                              }}
                            />
                          ) : (
                            <div className="w-full h-full p-4 text-center text-slate-500 flex items-center justify-center" style={{ width: '210mm', height: '297mm' }}>
                              <div>
                                <p>계약서를 불러올 수 없습니다.</p>
                                <p className="text-sm mt-2">PDF/이미지 형식이 올바르지 않습니다.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : viewingCompletedContract && !completedContractData?.pdfUrl ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center text-slate-500">
                            <p className="text-lg font-medium mb-2">서명된 계약서를 불러올 수 없습니다</p>
                            <p className="text-sm">계약서가 아직 서명 완료되지 않았거나 PDF가 저장되지 않았습니다.</p>
                          </div>
                        </div>
                      ) : (
                        /* 발송 전 상태일 때 계약서 미리보기 */
                        <div 
                          className="bg-white shadow-2xl mx-auto origin-top transition-all duration-300 ease-out border border-slate-200"
                          style={{ 
                            width: '210mm', 
                            height: '297mm',
                            transform: `scale(${zoomLevel})`,
                            marginBottom: `${(zoomLevel - 1) * 297}mm` 
                          }}
                        >
                          {/* A4 Content Container */}
                          <div className="w-full h-full px-[20mm] py-[15mm] flex flex-col relative text-slate-900 font-serif">
                            
                            {/* Header */}
                            <div className="border-[2px] border-black py-3 px-2 text-center mb-6 shrink-0">
                               <h1 className="text-[18px] font-bold tracking-widest text-black">표준근로계약서(기간의 정함이 있는 경우)</h1>
                            </div>
                            
                            {/* Main Content Area */}
                            <div className="flex flex-col justify-start gap-1">
                                <p className="leading-7 mb-5 text-[12.5px] text-justify shrink-0">
                                  <span className="font-bold border-b border-black inline-block min-w-[80px] text-center px-1">{currentCompany.name}</span> (이하 "사업주"라 함)과(와) <span className="font-bold border-b border-black inline-block min-w-[60px] text-center px-1">{previewEmployee.name}</span> (이하 "근로자"라 함)은 다음과 같이 근로계약을 체결한다.
                                </p>

                            <div className="space-y-3 text-[12.5px] leading-6">
                              {/* 1. 계약기간 */}
                              <div className="flex items-baseline">
                                 <span className="font-bold mr-1 w-5 shrink-0">1.</span>
                                 <span className="font-bold mr-2 w-24 shrink-0">근로계약기간 :</span>
                                 <span className="border-b border-slate-200 pb-0.5 flex-1">{previewEmployee.contractPeriod}</span>
                              </div>

                              {/* 2. 근무장소 */}
                              <div className="flex items-baseline">
                                 <span className="font-bold mr-1 w-5 shrink-0">2.</span>
                                 <span className="font-bold mr-2 w-24 shrink-0">근 무 장 소 :</span>
                                 <span className="flex-1">본사 지정장소</span>
                              </div>

                              {/* 3. 업무내용 */}
                              <div className="flex items-baseline">
                                 <span className="font-bold mr-1 w-5 shrink-0">3.</span>
                                 <span className="font-bold mr-2 w-24 shrink-0">업무의 내용 :</span>
                                 <span className="flex-1">소프트웨어 개발 및 운영 지원</span>
                              </div>

                              {/* 4. 소정근로시간 */}
                              <div className="flex items-baseline">
                                 <span className="font-bold mr-1 w-5 shrink-0">4.</span>
                                 <span className="font-bold mr-2 w-24 shrink-0">소정근로시간 :</span>
                                 <span className="flex-1">{previewEmployee.workingHours || '13시 00분부터 16시 30분까지 (휴게시간 : 없음)'}</span>
                              </div>

                              {/* 5. 근무일/휴일 */}
                              <div className="flex items-baseline">
                                 <span className="font-bold mr-1 w-5 shrink-0">5.</span>
                                 <span className="font-bold mr-2 w-24 shrink-0">근무일/휴일 :</span>
                                 <span className="flex-1">매주 5일(또는 매일단위)근무, 주휴일 매주 일요일</span>
                              </div>

                              {/* 6. 임금 */}
                              <div>
                                 <div className="flex items-baseline mb-1">
                                    <span className="font-bold mr-1 w-5 shrink-0">6.</span>
                                    <span className="font-bold mr-2 w-24 shrink-0">임  금</span>
                                 </div>
                                 <div className="pl-8 space-y-1">
                                    <p className="flex items-center">
                                      <span className="w-28 text-slate-700">- 월(일, 시간)급 :</span>
                                      <span className="font-bold border-b border-black inline-block min-w-[100px] text-center px-2">{previewEmployee.salary}</span> 
                                      <span className="ml-1">원</span>
                                    </p>
                                    <div className="flex items-center gap-1">
                                      <span className="w-28 text-slate-700">- 상여금 :</span>
                                      <span className="text-[12.5px]">있음 ( ) <span className="border-b border-black inline-block w-12"></span> 원,</span>
                                      <span className="text-[12.5px]">없음 ( V )</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="w-28 text-slate-700">- 기타급여(제수당) :</span>
                                      <span className="text-[12.5px]">있음 ( ),</span>
                                      <span className="text-[12.5px]">없음 ( V )</span>
                                    </div>
                                    <p className="flex items-center">
                                      <span className="w-28 text-slate-700">- 임금지급일 :</span>
                                      <span className="text-[12.5px]">매월(매주 또는 매일)</span>
                                      <span className="font-bold border-b border-black inline-block w-6 text-center mx-1">25</span>
                                      <span className="text-[12.5px]">일(휴일의 경우는 전일 지급)</span>
                                    </p>
                                    <p className="flex items-center">
                                      <span className="w-28 text-slate-700">- 지급방법 :</span>
                                      <span className="text-[12.5px]">근로자에게 직접지급( ),</span>
                                      <span className="text-[12.5px]">예금통장에 입금( V )</span>
                                    </p>
                                 </div>
                              </div>
                              
                              {/* 7. 연차 */}
                              <div className="flex items-baseline">
                                 <span className="font-bold mr-1 w-5 shrink-0">7.</span>
                                 <span className="font-bold mr-2 w-24 shrink-0">연차유급휴가 :</span>
                                 <span className="flex-1">근로기준법에서 정하는 바에 따라 부여함</span>
                              </div>

                              {/* 8. 사회보험 */}
                              <div>
                                 <div className="flex items-baseline mb-1">
                                    <span className="font-bold mr-1 w-5 shrink-0">8.</span>
                                    <span className="font-bold mr-2 shrink-0">사회보험 적용여부(해당란에 체크)</span>
                                 </div>
                                 <div className="pl-8 flex gap-4 text-[12.5px]">
                                   <span className="flex items-center gap-1.5"><div className="border border-black w-3.5 h-3.5 flex items-center justify-center"><Check className="h-3 w-3" /></div> 고용보험</span>
                                   <span className="flex items-center gap-1.5"><div className="border border-black w-3.5 h-3.5 flex items-center justify-center"><Check className="h-3 w-3" /></div> 산재보험</span>
                                   <span className="flex items-center gap-1.5"><div className="border border-black w-3.5 h-3.5 flex items-center justify-center"><Check className="h-3 w-3" /></div> 국민연금</span>
                                   <span className="flex items-center gap-1.5"><div className="border border-black w-3.5 h-3.5 flex items-center justify-center"><Check className="h-3 w-3" /></div> 건강보험</span>
                                 </div>
                              </div>
                              
                              {/* 9. 교부 */}
                              <div className="flex items-baseline">
                                 <span className="font-bold mr-1 w-5 shrink-0">9.</span>
                                 <span className="font-bold mr-2 w-28 shrink-0">근로계약서 교부 :</span>
                                 <span className="leading-tight flex-1">사업주는 근로계약을 체결함과 동시에 본 계약서를 사본하여 근로자에게 교부함(근로기준법 제17조 이행)</span>
                              </div>
                              
                              {/* 10. 이행의무 */}
                              <div className="flex items-baseline">
                                 <span className="font-bold mr-1 w-5 shrink-0">10.</span>
                                 <span className="font-bold mr-2 w-28 shrink-0">성실이행의무 :</span>
                                 <span className="leading-tight flex-1">사업주와 근로자는 각자가 근로계약, 취업규칙, 단체협약을 지키고 성실하게 이행하여야 함</span>
                              </div>

                              {/* 11. 기타 */}
                              <div className="flex items-baseline">
                                 <span className="font-bold mr-1 w-5 shrink-0">11.</span>
                                 <span className="font-bold mr-2 w-24 shrink-0">기  타 :</span>
                                 <span className="flex-1">이 계약에 정함이 없는 사항은 근로기준법령에 의함</span>
                              </div>
                            </div>
                        </div>

                        {/* Footer Signatures */}
                        <div className="mt-8 pt-2 shrink-0">
                          {/* Date */}
                          <div className="text-center mb-8">
                             <p className="text-[15px] font-bold tracking-[0.2em]">
                               {today.getFullYear()}년 {today.getMonth() + 1}월 {today.getDate()}일
                             </p>
                          </div>
                          
                          {/* Signatures */}
                          <div className="flex gap-x-8 text-[12px] justify-between">
                             {/* Left Column: Business Owner */}
                             <div className="flex-1">
                                <div className="flex gap-3">
                                   <span className="font-bold shrink-0 pt-1 w-[50px] text-right text-[12.5px]">(사업주)</span>
                                   <div className="flex-1 flex flex-col gap-1.5">
                                      <div className="flex items-center">
                                         <span className="w-14 text-right mr-2 text-slate-600">사업체명:</span>
                                         <span className="flex-1 border-b border-black px-1 text-center text-[12.5px]">{currentCompany.name}</span>
                                      </div>
                                      <div className="flex items-center">
                                         <span className="w-14 text-right mr-2 text-slate-600">전화:</span>
                                         <span className="flex-1 border-b border-black px-1 text-center text-[12.5px]">{currentCompany.phone}</span>
                                      </div>
                                      <div className="flex items-center">
                                         <span className="w-14 text-right mr-2 text-slate-600">주소:</span>
                                         <span className="flex-1 border-b border-black px-1 truncate text-[11px] text-center">{currentCompany.address}</span>
                                      </div>
                                      <div className="flex items-center relative h-10">
                                         <span className="w-14 text-right mr-2 text-slate-600">대표자:</span>
                                         <span className="flex-1 border-b border-black px-1 text-center font-medium text-[12.5px]">{currentCompany.ceo}</span>
                                         <span className="ml-1 text-slate-400 text-[11px] whitespace-nowrap">(서명)</span>
                                         
                                         {/* Stamp */}
                                         {isSigned && (
                                            <>
                                                {stampImage ? (
                                                     <div className="absolute right-2 top-[-10px] w-14 h-14 rotate-[-3deg] z-10 pointer-events-none">
                                                         <img 
                                                            src={stampImage} 
                                                            alt="회사 직인" 
                                                            className="w-full h-full object-contain mix-blend-multiply opacity-95 contrast-125"
                                                         />
                                                     </div>
                                                ) : (
                                                    <div className="absolute right-2 top-[-10px] w-14 h-14 border-[3px] border-red-600 rounded-full flex items-center justify-center text-red-600 font-bold text-[10px] rotate-[-10deg] opacity-90 animate-in zoom-in-50 duration-500 mix-blend-multiply bg-white/20 z-10 pointer-events-none">
                                                      <div className="text-center leading-[1.1]">
                                                        {currentCompany.name.split('(')[0]}<br/>대표이사<br/>의인
                                                      </div>
                                                    </div>
                                                )}
                                            </>
                                         )}
                                      </div>
                                   </div>
                                </div>
                             </div>

                             {/* Right Column: Worker */}
                             <div className="flex-1">
                                <div className="flex gap-3">
                                   <span className="font-bold shrink-0 pt-1 w-[50px] text-right text-[12.5px]">(근로자)</span>
                                   <div className="flex-1 flex flex-col gap-1.5">
                                      <div className="flex items-center">
                                         <span className="w-12 text-right mr-2 text-slate-600">주소:</span>
                                         <span className="flex-1 border-b border-black px-1 truncate text-[11px] text-center">서울시 마포구 양화로 456</span>
                                      </div>
                                      <div className="flex items-center">
                                         <span className="w-12 text-right mr-2 text-slate-600">연락처:</span>
                                         <span className="flex-1 border-b border-black px-1 text-center text-[12.5px]">{previewEmployee.phone}</span>
                                      </div>
                                      <div className="flex items-center h-10">
                                         <span className="w-12 text-right mr-2 text-slate-600">성명:</span>
                                         <span className="flex-1 border-b border-black px-1 text-center font-medium text-[12.5px]">{previewEmployee.name}</span>
                                         <span className="ml-1 text-slate-400 text-[11px] whitespace-nowrap">(서명)</span>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </div>
                        </div>

                      </div>
                    </div>
                      )}
                    </>
                  )}
               </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={allSelected || (isIndeterminate ? "indeterminate" : false)}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  title="모든 근로자 선택/해제"
                />
              </TableHead>
              <TableHead>성명</TableHead>
              <TableHead>전화번호</TableHead>
              <TableHead>생년월일</TableHead>
              <TableHead>계약 기간</TableHead>
              <TableHead>근로시간</TableHead>
              <TableHead>급여</TableHead>
              <TableHead>계약 상태</TableHead>
              <TableHead className="w-[100px]">상세</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => {
                return (
                  <TableRow key={employee.id} data-state={selectedIds.has(employee.id) && "selected"}>
                    <TableCell>
                <Checkbox
                  checked={selectedIds.has(employee.id)}
                  onCheckedChange={(checked) => handleSelectOne(employee.id, !!checked)}
                />
                    </TableCell>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.phone}</TableCell>
                  <TableCell>{employee.dob}</TableCell>
                  <TableCell>{employee.contractPeriod}</TableCell>
                  <TableCell>{employee.workingHours}</TableCell>
                  <TableCell>{employee.salary}</TableCell>
                  <TableCell>
                    {employee.status === "completed" && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                        <CircleCheck className="h-3 w-3" /> 계약 완료
                      </Badge>
                    )}
                    {employee.status === "sent" && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                        <Clock className="h-3 w-3" /> 근로자 확인중
                      </Badge>
                    )}
                    {employee.status === "draft" && (
                      <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 gap-1">
                        <CircleAlert className="h-3 w-3" /> 발송 전
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        상세
                      </Button>
                      {employee.status === "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleViewCompletedContract(employee.id)}
                          disabled={loadingContract}
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          {loadingContract ? '로딩...' : '계약서'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
            ) : (
               <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-slate-500">
                     해당 기업에 등록된 근로자가 없습니다.
                  </TableCell>
               </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
            <span className="font-medium">{selectedIds.size} selected</span>
            <div className="h-4 w-px bg-slate-700"></div>
            <button className="hover:text-blue-300 text-sm font-medium" onClick={() => setSelectedIds(new Set())}>Clear selection</button>
        </div>
      )}

      {/* Stamp Management Modal (Reusing the new component) */}
      <StampManager
        isOpen={isStampModalOpen}
        onClose={() => setIsStampModalOpen(false)}
        stampImage={stampImage}
        setStampImage={setStampImage}
      />

      {/* Employee Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              근로자 상세 정보
            </DialogTitle>
            <DialogDescription>
              {selectedEmployee?.name}님의 등록 정보입니다.
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6 py-4">
              {/* 기본 정보 */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 border-b pb-2">기본 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">성명</Label>
                    <p className="text-sm font-medium mt-1">{selectedEmployee.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">전화번호</Label>
                    <p className="text-sm font-medium mt-1">{selectedEmployee.phone}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">생년월일</Label>
                    <p className="text-sm font-medium mt-1">{selectedEmployee.dob}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">계약 상태</Label>
                    <div className="mt-1">
                      {selectedEmployee.status === "completed" && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                          <CircleCheck className="h-3 w-3" /> 계약 완료
                        </Badge>
                      )}
                      {selectedEmployee.status === "sent" && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                          <Clock className="h-3 w-3" /> 근로자 확인중
                        </Badge>
                      )}
                      {selectedEmployee.status === "draft" && (
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 gap-1">
                          <CircleAlert className="h-3 w-3" /> 발송 전
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 장애 정보 */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 border-b pb-2">장애 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">장애 정도</Label>
                    <p className="text-sm font-medium mt-1">
                      <Badge variant={selectedEmployee.disabilityLevel === '중증' ? 'destructive' : 'secondary'}>
                        {selectedEmployee.disabilityLevel}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">장애 유형</Label>
                    <p className="text-sm font-medium mt-1">{selectedEmployee.disabilityType}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-slate-500">장애 인정일</Label>
                    <p className="text-sm font-medium mt-1">{selectedEmployee.disabilityRecognitionDate}</p>
                  </div>
                </div>
              </div>

              {/* 비상연락망 */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 border-b pb-2">비상연락망 (보호자)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">보호자 성명</Label>
                    <p className="text-sm font-medium mt-1">{selectedEmployee.emergencyContactName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">보호자 전화번호</Label>
                    <p className="text-sm font-medium mt-1">{selectedEmployee.emergencyContactPhone}</p>
                  </div>
                </div>
              </div>

              {/* 근로 조건 */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 border-b pb-2">근로 조건</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">계약 기간</Label>
                    <p className="text-sm font-medium mt-1">{selectedEmployee.contractPeriod}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">근로 시간</Label>
                    <p className="text-sm font-medium mt-1">{selectedEmployee.workingHours}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">급여</Label>
                    <p className="text-sm font-medium mt-1">{selectedEmployee.salary} 원</p>
                  </div>
                </div>
              </div>

              {/* 증빙서류 */}
              {selectedEmployee.documentUrl && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 border-b pb-2">증빙서류</h3>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">첨부 파일</p>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-600" />
                      {selectedEmployee.documentUrl}
                    </p>
                  </div>
                </div>
              )}

              {/* 민감정보 동의 */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 border-b pb-2">동의 현황</h3>
                <div className="flex items-center gap-2">
                  {selectedEmployee.sensitiveInfoConsent ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                      <Check className="h-3 w-3" /> 민감정보 수집 동의 완료
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 gap-1">
                      <X className="h-3 w-3" /> 미동의
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">닫기</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              정말 삭제하시겠습니까?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                선택된 <span className="font-bold text-slate-900">{selectedIds.size}명</span>의 근로자를 삭제합니다.
              </p>
              <p className="text-red-500 font-medium">
                삭제된 데이터는 복구할 수 없습니다.
              </p>
              {selectedIds.size > 0 && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-2">삭제 대상:</p>
                  <div className="flex flex-wrap gap-1">
                    {employees
                      .filter(emp => selectedIds.has(emp.id))
                      .map(emp => (
                        <Badge key={emp.id} variant="secondary" className="text-xs">
                          {emp.name}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmployees}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 카카오톡 메시지 미리보기 다이얼로그 */}
      <Dialog open={isKakaoPreviewOpen} onOpenChange={setIsKakaoPreviewOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">📱</span>
              카카오톡 메시지 미리보기
            </DialogTitle>
            <DialogDescription>
              계약서 발송 시 근로자에게 전송되는 카카오톡 메시지입니다.
              {kakaoPreviewData?.isMock && (
                <span className="block mt-2 text-orange-600 font-medium">
                  ⚠️ 개발 모드: 실제 카카오톡 메시지는 전송되지 않았습니다. (백엔드 로그 확인)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {kakaoPreviewData && (
            <div className="space-y-4">
              {/* 카카오톡 메시지 스타일 미리보기 */}
              <div className="bg-[#FEE500] rounded-2xl p-4 shadow-lg relative">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-black/10">
                  <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white text-xs font-bold">K</div>
                  <span className="font-semibold text-black">그레이트퍼즐</span>
                </div>
                <div className="text-black whitespace-pre-line leading-relaxed mb-3">
                  {kakaoPreviewData.message}
                </div>
                <div className="bg-black text-white rounded-lg p-3 text-center font-semibold cursor-pointer hover:bg-gray-800 transition-colors"
                     onClick={() => window.open(kakaoPreviewData.contractLink, '_blank')}>
                  계약서 확인하기
                </div>
              </div>

              {/* 수신자 정보 */}
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">수신자:</span>
                  <span className="font-semibold">{kakaoPreviewData.employeeName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">전화번호:</span>
                  <span className="font-semibold">{kakaoPreviewData.employeePhone}</span>
                </div>
              </div>

              {/* 링크 정보 */}
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">계약서 링크:</span>
                  <a href={kakaoPreviewData.contractLink} target="_blank" rel="noopener noreferrer"
                     className="text-xs text-blue-600 hover:underline break-all">
                    {kakaoPreviewData.contractLink}
                  </a>
                </div>
              </div>

              {/* 안내 메시지 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>💡 참고:</strong> 카카오톡 채널 연결이 완료되면 실제로 메시지가 전송됩니다.
                  현재는 개발 모드로 로그만 출력됩니다.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsKakaoPreviewOpen(false)}>
              닫기
            </Button>
            <Button onClick={() => {
              if (kakaoPreviewData) {
                window.open(kakaoPreviewData.contractLink, '_blank');
              }
            }}>
              계약서 링크 테스트
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
  FileDown
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
import { User, Employee, companies } from "@shared/data" // Import types and data
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

  // Stamp Management State (Only used for Super Admin here, Company Admin uses Sidebar)
  const [isStampModalOpen, setIsStampModalOpen] = React.useState(false)

  // Employee Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false)
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null)

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
    : companies.find(c => c.id === activeCompanyId)

  const filteredEmployees = employees.filter(e => e.companyId === activeCompanyId)
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredEmployees.map(e => e.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
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
    setIsPreviewOpen(true)
  }

  const handleSign = () => {
    setIsSigned(true)
  }

  const handleSend = async () => {
    try {
      // Send contract to selected employees via API
      const selectedEmployees = employees.filter(emp => selectedIds.has(emp.id));
      const sendPromises = selectedEmployees.map(emp =>
        api.sendContract(emp.id, {
          workingHours: emp.workingHours,
          salary: emp.salary,
          contractPeriod: emp.contractPeriod,
        })
      );

      await Promise.all(sendPromises);

      // Update local state
      const updatedEmployees = employees.map(emp => {
        if (selectedIds.has(emp.id) && emp.status !== 'completed') {
          return { ...emp, status: 'sent' as const };
        }
        return emp;
      });

      setEmployees(updatedEmployees);

      toast.success("계약서가 발송되었습니다", {
        description: `${selectedIds.size}명의 근로자에게 전자계약서를 전송했습니다.`,
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
    const mobileAppUrl = import.meta.env.VITE_MOBILE_APP_URL || 'http://localhost:5174';
    const link = `${mobileAppUrl}?invite=${activeCompanyId}`;

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

  const handleExportToExcel = () => {
    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) return;

    // Excel 데이터 준비 (한국장애인고용공단 양식)
    const excelData = filteredEmployees.map(emp => ({
      '성명': emp.name,
      '생년월일': emp.dob,
      '전화번호': emp.phone,
      '장애정도': emp.disabilityLevel,
      '장애유형': emp.disabilityType,
      '장애인정일': emp.disabilityRecognitionDate,
      '비상연락망(성명)': emp.emergencyContactName,
      '비상연락망(전화)': emp.emergencyContactPhone,
      '계약기간': emp.contractPeriod,
      '근로시간': emp.workingHours,
      '급여': emp.salary,
      '계약상태': emp.status === 'completed' ? '완료' : emp.status === 'sent' ? '발송' : '작성중',
    }));

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // 컬럼 너비 설정
    ws['!cols'] = [
      { wch: 10 }, // 성명
      { wch: 12 }, // 생년월일
      { wch: 15 }, // 전화번호
      { wch: 10 }, // 장애정도
      { wch: 12 }, // 장애유형
      { wch: 12 }, // 장애인정일
      { wch: 12 }, // 비상연락망(성명)
      { wch: 15 }, // 비상연락망(전화)
      { wch: 20 }, // 계약기간
      { wch: 15 }, // 근로시간
      { wch: 12 }, // 급여
      { wch: 10 }, // 계약상태
    ];

    XLSX.utils.book_append_sheet(wb, ws, '근로자명단');

    // 파일 다운로드
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${company.name}_근로자명단_${today}.xlsx`);

    toast.success("Excel 파일이 다운로드되었습니다!");
  }

  const allSelected = filteredEmployees.length > 0 && selectedIds.size === filteredEmployees.length
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredEmployees.length

  const selectedEmployees = employees.filter(e => selectedIds.has(e.id))
  const previewEmployee = selectedEmployees[currentPreviewIndex] || selectedEmployees[0]

  const today = new Date()
  
  return (
    <div className="space-y-6">
      
      {/* Top Section: Header & Company Selector */}
      <div className="flex flex-col gap-6 border-b pb-6">
         <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 {user.role === 'SUPER_ADMIN' ? (
                   <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">Super Admin</Badge>
                 ) : (
                   <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Admin</Badge>
                 )}
                 <h2 className="text-2xl font-bold tracking-tight text-slate-900">{user.name}님, 환영합니다!</h2>
              </div>
              <p className="text-slate-500">기업별 근로자 및 계약 관리 대시보드</p>
            </div>

            {user.role === 'SUPER_ADMIN' && (
              <div className="w-full md:w-auto flex flex-col gap-2">
                 <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Company</Label>
                 <Popover open={isCompanyComboOpen} onOpenChange={setIsCompanyComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isCompanyComboOpen}
                        className="w-full md:w-[300px] justify-between h-11 bg-white"
                      >
                        {currentCompany ? (
                           <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center border">
                                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                               </div>
                               <span className="font-medium">{currentCompany.name}</span>
                           </div>
                        ) : "기업을 선택하세요..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="기업명 검색..." />
                        <CommandList>
                          <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                          <CommandGroup heading="등록된 기업">
                            {companies.map((company) => (
                              <CommandItem
                                key={company.id}
                                value={company.name}
                                onSelect={() => {
                                  setSelectedCompanyId(company.id)
                                  setSelectedIds(new Set()) // Clear selection on company change
                                  setIsCompanyComboOpen(false)
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedCompanyId === company.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <div className="flex flex-col">
                                   <span>{company.name}</span>
                                   <span className="text-xs text-slate-400">담당자: {company.ceo}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                 </Popover>
              </div>
            )}
         </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
             {/* 슈퍼 관리자는 드롭다운, 회사 관리자는 회사명 표시 */}
             {user.role === 'SUPER_ADMIN' && allCompanies.length > 0 ? (
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
             ) : (
               <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                 {currentCompany?.name || ''}
                 <Badge variant="outline" className="font-normal text-slate-500">{filteredEmployees.length}명</Badge>
               </h3>
             )}
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

           {/* 근로조건 수정 */}
           <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                disabled={selectedIds.size === 0}
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
              variant={selectedIds.size > 0 ? "default" : "outline"}
              className={selectedIds.size > 0 ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-slate-500"}
              disabled={selectedIds.size === 0}
              onClick={handleOpenPreview}
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
                     <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">계약서 미리보기</DialogTitle>
                     <DialogDescription className="text-sm text-slate-500 mt-1 hidden sm:block">
                       <span className="font-semibold text-slate-900">{currentCompany.name}</span> - 
                       {selectedEmployees.length}명의 선택된 근로자 중 <span className="font-medium text-slate-900">{previewEmployee?.name}</span>님의 계약서
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
                                 <span className="flex-1">본사 사무실</span>
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
                                 <span className="flex-1">13시 00분부터 16시 30분까지 (휴게시간 : 없음)</span>
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
              filteredEmployees.map((employee) => (
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
                          onClick={() => {
                            // Open contract preview for completed contracts
                            setSelectedIds(new Set([employee.id]));
                            setIsPreviewOpen(true);
                            setCurrentPreviewIndex(0);
                          }}
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          계약서
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
    </div>
  )
}

import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./components/ui/sidebar"
import { AppSidebar } from "./components/AppSidebar"
import { ContractDashboard } from "./components/ContractDashboard"
import { WorkRecordsDashboard } from "./components/WorkRecordsDashboard"
import { DocumentDownloadDashboard } from "./components/DocumentDownloadDashboard"
import { Login } from "./components/Login"
import { EmployeeRegistration } from "./components/EmployeeRegistration"
import { EmployeeContractApp } from "./components/EmployeeContractApp"
import { Separator } from "./components/ui/separator"
import { Toaster } from "./components/ui/sonner"
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./components/ui/breadcrumb"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select"
import { LogOut, Building2 } from 'lucide-react';
import { Button } from './components/ui/button';
import { api, Employee as ApiEmployee } from '@shared/api';
// 테스트 링크 유틸리티 (개발자 도구에서 사용 가능)
import '../utils/showTestLinks';

interface User {
  id: string;
  name: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN';
  companyId?: string | null;
  email: string;
  phone: string;
  company?: {
    id: string;
    name: string;
    ceo: string;
    address: string;
    phone: string;
    businessNumber: string | null;
    stampImageUrl: string | null;
  };
}

interface Employee {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  dob: string;
  status: "draft" | "sent" | "completed";
  workingHours: string;
  salary: string;
  contractPeriod: string;
  disabilityLevel: '중증' | '경증';
  disabilityType: string;
  disabilityRecognitionDate: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  documentUrl?: string;
  sensitiveInfoConsent: boolean;
}

// Helper function to convert API employee to local employee format
const convertApiEmployee = (apiEmp: ApiEmployee): Employee => ({
  id: apiEmp.id,
  companyId: apiEmp.companyId,
  name: apiEmp.name,
  phone: apiEmp.phone,
  dob: apiEmp.dob,
  status: apiEmp.contractStatus.toLowerCase() as "draft" | "sent" | "completed",
  workingHours: apiEmp.workingHours,
  salary: apiEmp.salary,
  contractPeriod: apiEmp.contractPeriod,
  disabilityLevel: apiEmp.disabilityLevel === 'SEVERE' ? '중증' : '경증',
  disabilityType: apiEmp.disabilityType,
  disabilityRecognitionDate: apiEmp.disabilityRecognitionDate,
  emergencyContactName: apiEmp.emergencyContactName,
  emergencyContactPhone: apiEmp.emergencyContactPhone,
  documentUrl: apiEmp.documentUrl || undefined,
  sensitiveInfoConsent: apiEmp.sensitiveInfoConsent,
});

interface Company {
  id: string;
  name: string;
  ceo: string;
  address: string;
  phone: string;
  businessNumber: string | null;
  stampImageUrl: string | null;
}

// 초기 사용자 상태를 localStorage에서 동기적으로 읽어옴 (깜빡임 방지)
const getInitialUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('accessToken');
  if (storedUser && storedToken) {
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  }
  return null;
};

// 초기 invite 파라미터 확인 (깜빡임 방지)
const getInitialInviteId = (): string | null => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('invite');
};

export default function App() {
  // 초기 상태를 동기적으로 설정하여 첫 렌더링부터 올바른 화면 표시
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stampImage, setStampImage] = useState<string | null>(null);
  const [inviteCompanyId, setInviteCompanyId] = useState<string | null>(getInitialInviteId);
  const [companyName, setCompanyName] = useState<string>('');
  const [initializing, setInitializing] = useState(true); // 초기 데이터 로딩 상태
  const [activeTab, setActiveTab] = useState<string>('contracts');

  // Super Admin - 회사 선택 기능 (각 탭별로 독립적으로 관리)
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [selectedCompanyIdForContracts, setSelectedCompanyIdForContracts] = useState<string | null>(null);
  const [selectedCompanyIdForWorkRecords, setSelectedCompanyIdForWorkRecords] = useState<string | null>(null);
  const [selectedCompanyIdForDocuments, setSelectedCompanyIdForDocuments] = useState<string | null>(null);

  // State for Employee Contract App Flow
  const [showEmployeeContract, setShowEmployeeContract] = useState(false);
  const [currentEmployeeName, setCurrentEmployeeName] = useState("");

  // 초기 데이터 로드 (user는 이미 동기적으로 설정됨)
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      // invite 링크가 있으면 회사명 로드
      if (inviteCompanyId) {
        await loadCompanyName(inviteCompanyId);
      }

      // user가 있으면 추가 데이터 로드
      if (user) {
        try {
          if (user.role === 'SUPER_ADMIN') {
            // 1. 회사 목록 로드
            const companies = await api.getCompanies();
            if (!isMounted) return;

            setAllCompanies(companies);

            // 2. 첫 번째 회사 선택 및 직원 로드 (한 번에 처리)
            if (companies.length > 0) {
              const firstCompanyId = companies[0].id;
              setSelectedCompanyIdForContracts(firstCompanyId);
              setSelectedCompanyIdForWorkRecords(firstCompanyId);
              setSelectedCompanyIdForDocuments(firstCompanyId);

              // 3. 첫 번째 회사의 직원 로드 (Dashboard 표시 전에 완료)
              await loadEmployees(firstCompanyId);
            }
          } else if (user.companyId) {
            setSelectedCompanyIdForContracts(user.companyId);
            setSelectedCompanyIdForWorkRecords(user.companyId);
            setSelectedCompanyIdForDocuments(user.companyId);
            await loadEmployees(user.companyId);
          }
        } catch (error: any) {
          // 401 에러 시 로그아웃 처리
          if (error.response?.status === 401) {
            console.log('[App] Token expired, logging out');
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            if (isMounted) setUser(null);
            return;
          }
        }
      }

      if (isMounted) setInitializing(false);
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, []); // 마운트 시 한 번만 실행

  // 슈퍼 관리자가 계약 관리 탭에서 회사를 변경했을 때 (초기 로드 제외)
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // 초기 로드 시에는 이미 initializeData에서 처리했으므로 스킵
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    if (user?.role === 'SUPER_ADMIN' && selectedCompanyIdForContracts) {
      loadEmployees(selectedCompanyIdForContracts).catch((error: any) => {
        if (error.response?.status === 401) {
          setUser(null);
        }
      });
    }
  }, [selectedCompanyIdForContracts]);


  const loadCompanyName = async (companyId: string) => {
    try {
      const company = await api.getCompany(companyId);
      setCompanyName(company.name);
    } catch (error) {
      console.error('Failed to load company name:', error);
      toast.error('회사 정보를 불러올 수 없습니다.');
    }
  };


  const loadEmployees = async (companyId: string) => {
    try {
      const employeeData = await api.getEmployeesByCompany(companyId);
      const convertedEmployees = employeeData.map(convertApiEmployee);
      setEmployees(convertedEmployees);
    } catch (error: any) {
      console.error('Failed to load employees:', error);
      toast.error('직원 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleLogin = async (email: string, password: string) => {
    console.log('[App] handleLogin called:', { email });
    try {
      const response = await api.login(email, password);
      console.log('[App] Login response:', response);

      const userData: User = {
        id: response.user.id,
        name: response.user.name,
        role: response.user.role,
        companyId: response.user.companyId,
        email: response.user.email,
        phone: response.user.phone,
        company: response.user.company,
      };

      // 슈퍼 관리자인 경우 회사 목록과 직원을 먼저 로드
      if (userData.role === 'SUPER_ADMIN') {
        const companies = await api.getCompanies();
        setAllCompanies(companies);

        if (companies.length > 0) {
          const firstCompanyId = companies[0].id;
          setSelectedCompanyIdForContracts(firstCompanyId);
          setSelectedCompanyIdForWorkRecords(firstCompanyId);
          setSelectedCompanyIdForDocuments(firstCompanyId);
          await loadEmployees(firstCompanyId);
        }
      } else if (userData.companyId) {
        // 일반 관리자는 자신의 회사 직원 로드
        setSelectedCompanyIdForContracts(userData.companyId);
        setSelectedCompanyIdForWorkRecords(userData.companyId);
        setSelectedCompanyIdForDocuments(userData.companyId);
        await loadEmployees(userData.companyId);
      }

      // 모든 데이터 로드 후 user 설정 (깜빡임 방지)
      setUser(userData);
      setIsInitialLoad(true); // 다음 회사 변경 시 useEffect가 동작하도록
      console.log('[App] User state updated:', userData);

      toast.success('로그인 성공!');
    } catch (error: any) {
      console.error('[App] Login failed:', error);
      toast.error(error.response?.data?.message || '로그인에 실패했습니다.');
      throw error; // Re-throw so Login component can handle it
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setEmployees([]);
    setStampImage(null);
    toast.success('로그아웃되었습니다.');
  };

  const handleUpdateUser = async (data: { name?: string; phone?: string; email?: string }) => {
    try {
      const updatedUser = await api.updateMe(data);
      const userData: User = {
        id: updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
        companyId: updatedUser.companyId,
        email: updatedUser.email,
        phone: updatedUser.phone,
        company: updatedUser.company,
      };
      setUser(userData);
      // localStorage에도 업데이트
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success('관리자 정보가 업데이트되었습니다.');
      return userData;
    } catch (error: any) {
      console.error('[App] Update user failed:', error);
      toast.error(error.response?.data?.message || '관리자 정보 업데이트에 실패했습니다.');
      throw error;
    }
  };

  const handleSimulateInvite = () => {
    // For testing - simulate clicking an invite link
    // In production, this would be a real company ID
    if (user?.companyId) {
      setInviteCompanyId(user.companyId);
      loadCompanyName(user.companyId);
    }
  };

  const handleRegisterEmployee = async (data: {
    name: string;
    phone: string;
    dob: string;
    disabilityLevel: '중증' | '경증';
    disabilityType: string;
    disabilityRecognitionDate: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    documentUrl?: string;
    sensitiveInfoConsent: boolean;
  }) => {
    if (!inviteCompanyId) return;

    try {
      const newEmployee = await api.createEmployee(inviteCompanyId, data);
      const convertedEmployee = convertApiEmployee(newEmployee);
      setEmployees(prev => [...prev, convertedEmployee]);
      setCurrentEmployeeName(data.name);
      toast.success('직원 등록이 완료되었습니다!');
    } catch (error: any) {
      console.error('Failed to register employee:', error);
      toast.error(error.response?.data?.message || '직원 등록에 실패했습니다.');
    }
  };

  // 1. Employee Contract App Flow (Priority 1)
  if (showEmployeeContract) {
      return (
        <EmployeeContractApp
            employeeName={currentEmployeeName}
            onClose={() => {
                setShowEmployeeContract(false);
                setInviteCompanyId(null);
                setCurrentEmployeeName("");
            }}
        />
      );
  }

  // 2. Invite/Registration View (Priority 2)
  if (inviteCompanyId) {
     // 회사명 로딩 중
     if (!companyName && initializing) {
       return (
         <div className="min-h-screen flex items-center justify-center bg-slate-50">
           <div className="text-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
             <p className="text-slate-500">로딩 중...</p>
           </div>
         </div>
       );
     }

     // 유효하지 않은 회사
     if (!companyName) {
       return (
         <div className="min-h-screen flex items-center justify-center bg-slate-50">
           <div className="text-center">
             <h1 className="text-2xl font-bold text-slate-900 mb-2">유효하지 않은 링크</h1>
             <p className="text-slate-500">올바른 초대 링크인지 확인해주세요.</p>
             <Button className="mt-4" onClick={() => setInviteCompanyId(null)}>홈으로 이동</Button>
           </div>
         </div>
       );
     }

     return (
        <EmployeeRegistration
          companyName={companyName}
          onSubmit={handleRegisterEmployee}
          onHome={() => setShowEmployeeContract(true)}
        />
     );
  }

  // 3. 초기화 중이고 user가 있으면 로딩 화면 표시 (깜빡임 방지)
  if (initializing && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 4. Login View
  if (!user) {
    return <Login onLogin={handleLogin} onSimulateInvite={handleSimulateInvite} />;
  }

  // 5. Admin Dashboard
  return (
    <SidebarProvider>
      <AppSidebar
        user={user}
        onLogout={handleLogout}
        onUpdateUser={handleUpdateUser}
        stampImage={stampImage}
        setStampImage={setStampImage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 bg-white">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {activeTab === 'contracts' ? '계약 관리' : 
                     activeTab === 'work-records' ? '근무 현황' : 
                     activeTab === 'documents' ? '서류 다운로드' : '계약 관리'}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-8 bg-slate-50/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="contracts" className="mt-0">
              <ContractDashboard
                stampImage={stampImage}
                setStampImage={setStampImage}
                user={user}
                employees={employees}
                setEmployees={setEmployees}
                allCompanies={allCompanies}
                selectedCompanyId={selectedCompanyIdForContracts}
                onCompanyChange={setSelectedCompanyIdForContracts}
              />
            </TabsContent>
            <TabsContent value="work-records" className="mt-0">
              <WorkRecordsDashboard
                employees={employees}
                user={user}
                allCompanies={allCompanies}
                selectedCompanyId={
                  user.role === 'SUPER_ADMIN'
                    ? (selectedCompanyIdForWorkRecords || '')
                    : (user.companyId || '')
                }
                onCompanyChange={setSelectedCompanyIdForWorkRecords}
              />
            </TabsContent>
            <TabsContent value="documents" className="mt-0">
              <DocumentDownloadDashboard
                user={user}
                employees={employees}
                allCompanies={allCompanies}
                selectedCompanyId={
                  user.role === 'SUPER_ADMIN'
                    ? (selectedCompanyIdForDocuments || '')
                    : (user.companyId || '')
                }
                onCompanyChange={setSelectedCompanyIdForDocuments}
              />
            </TabsContent>
          </Tabs>
        </div>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}

import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./components/ui/sidebar"
import { AppSidebar } from "./components/AppSidebar"
import { ContractDashboard } from "./components/ContractDashboard"
import { WorkRecordsDashboard } from "./components/WorkRecordsDashboard"
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stampImage, setStampImage] = useState<string | null>(null);
  const [inviteCompanyId, setInviteCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('contracts');

  // Super Admin - 회사 선택 기능
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // State for Employee Contract App Flow
  const [showEmployeeContract, setShowEmployeeContract] = useState(false);
  const [currentEmployeeName, setCurrentEmployeeName] = useState("");

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // 슈퍼 관리자인 경우 모든 회사 로드
        if (parsedUser.role === 'SUPER_ADMIN') {
          loadAllCompanies();
        } else if (parsedUser.companyId) {
          // 일반 관리자는 자신의 회사 직원 로드
          loadEmployees(parsedUser.companyId);
        }
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
    }
    setLoading(false);
  }, []);

  // 슈퍼 관리자가 회사를 선택했을 때
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' && selectedCompanyId) {
      loadEmployees(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  // Check for invite link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      setInviteCompanyId(invite);
      // Load company name
      loadCompanyName(invite);
    }
  }, []);

  const loadCompanyName = async (companyId: string) => {
    try {
      const company = await api.getCompany(companyId);
      setCompanyName(company.name);
    } catch (error) {
      console.error('Failed to load company name:', error);
      toast.error('회사 정보를 불러올 수 없습니다.');
    }
  };

  const loadAllCompanies = async () => {
    try {
      const companies = await api.getCompanies();
      setAllCompanies(companies);
      // 첫 번째 회사를 기본으로 선택
      if (companies.length > 0) {
        setSelectedCompanyId(companies[0].id);
      }
    } catch (error: any) {
      console.error('Failed to load companies:', error);
      toast.error('회사 목록을 불러오는데 실패했습니다.');
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
      setUser(userData);
      console.log('[App] User state updated:', userData);

      // 슈퍼 관리자인 경우 모든 회사 로드
      if (userData.role === 'SUPER_ADMIN') {
        await loadAllCompanies();
      } else if (userData.companyId) {
        // 일반 관리자는 자신의 회사 직원 로드
        await loadEmployees(userData.companyId);
      }

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
     if (!companyName && loading) {
       return (
         <div className="min-h-screen flex items-center justify-center bg-slate-50">
           <div className="text-center">
             <p className="text-slate-500">로딩 중...</p>
           </div>
         </div>
       );
     }

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

  // 3. Login View (Priority 3)
  if (!user) {
    return <Login onLogin={handleLogin} onSimulateInvite={handleSimulateInvite} />;
  }

  // 4. Admin Dashboard (Priority 4)
  return (
    <SidebarProvider>
      <AppSidebar
        user={user}
        onLogout={handleLogout}
        stampImage={stampImage}
        setStampImage={setStampImage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <SidebarInset className="ml-[16rem]">
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
                  <BreadcrumbPage>{activeTab === 'contracts' ? '계약 관리' : '근무 현황'}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-8 bg-slate-50/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="contracts">계약 관리</TabsTrigger>
              <TabsTrigger value="work-records">근무 현황</TabsTrigger>
            </TabsList>
            <TabsContent value="contracts" className="mt-6">
              <ContractDashboard
                stampImage={stampImage}
                setStampImage={setStampImage}
                user={user}
                employees={employees}
                setEmployees={setEmployees}
                allCompanies={allCompanies}
                selectedCompanyId={selectedCompanyId}
                onCompanyChange={setSelectedCompanyId}
              />
            </TabsContent>
            <TabsContent value="work-records" className="mt-6">
              <WorkRecordsDashboard
                employees={employees}
                companyId={
                  user.role === 'SUPER_ADMIN'
                    ? (selectedCompanyId || '')
                    : (user.companyId || '')
                }
              />
            </TabsContent>
          </Tabs>
        </div>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}

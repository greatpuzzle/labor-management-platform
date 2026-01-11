import axios, { AxiosInstance, AxiosError } from 'axios';

// Use window for environment variable in browser, fallback to default
const getApiBaseUrl = () => {
  // 1. 명시적으로 window 객체에 설정된 경우 (최우선)
  if (typeof window !== 'undefined' && (window as any).VITE_API_URL) {
    console.log('[API Client] Using window.VITE_API_URL:', (window as any).VITE_API_URL);
    return (window as any).VITE_API_URL;
  }
  
  // 2. Vite 환경 변수로 설정된 경우
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    console.log('[API Client] Using import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // 3. 네트워크 접속 감지 (모바일 기기에서 접속하는 경우)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const hostname = window.location.hostname;
    
    // 백엔드 서버 IP는 항상 192.168.45.78 (컴퓨터의 실제 IP)
    // 모바일 앱 서버가 어떤 IP에서 접속되든 백엔드는 고정된 IP 사용
    const backendIP = '192.168.45.78';
    
    // 네트워크 IP 범위 확인 (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (hostname.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/)) {
      console.log('[API Client] Network access detected, using backend IP:', backendIP);
      return `http://${backendIP}:3000`;
    }
    
    // 기타 경우 (도메인 등)
    console.log('[API Client] Using hostname-based URL:', hostname);
    return `http://${hostname}:3000`;
  }

  // 4. 기본값 (로컬 개발)
  console.log('[API Client] Using default localhost URL');
  return 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();
console.log('[API Client] Using API Base URL:', API_BASE_URL);

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: 'SUPER_ADMIN' | 'COMPANY_ADMIN';
    companyId: string | null;
    company?: {
      id: string;
      name: string;
      ceo: string;
      address: string;
      phone: string;
      businessNumber: string | null;
      stampImageUrl: string | null;
    };
  };
  accessToken: string;
}

export interface Company {
  id: string;
  name: string;
  ceo: string;
  address: string;
  phone: string;
  businessNumber?: string | null;
  stampImageUrl?: string | null;
}

export interface Employee {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  dob: string;
  workingHours: string;
  salary: string;
  contractPeriod: string;
  disabilityLevel: 'SEVERE' | 'MILD';
  disabilityType: string;
  disabilityRecognitionDate: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  documentUrl?: string | null;
  residentNumber?: string | null;
  sensitiveInfoConsent: boolean;
  contractStatus: 'DRAFT' | 'SENT' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export interface WorkRecord {
  id: string;
  employeeId: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  duration?: number | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkSchedule {
  id: string;
  employeeId: string;
  date: string;
  tasks: string[];
  createdAt: string;
  updatedAt: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request 인터셉터: JWT 자동 추가
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response 인터셉터: 에러 핸들링
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // 인증 실패 시 토큰 제거 및 로그인 페이지로 리다이렉트
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  // ========== Auth ==========

  async login(email: string, password: string): Promise<LoginResponse> {
    console.log('[API Client] Login attempt:', { email, baseURL: API_BASE_URL });
    try {
      const response = await this.client.post<LoginResponse>('/api/auth/login', {
        email,
        password,
      });

      console.log('[API Client] Login success:', response.data);

      // 토큰 저장
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      return response.data;
    } catch (error: any) {
      console.error('[API Client] Login failed:', error);
      console.error('[API Client] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
        },
      });
      throw error;
    }
  }

  async getMe(): Promise<LoginResponse['user']> {
    const response = await this.client.get<{ user: LoginResponse['user'] }>('/api/auth/me');
    return response.data.user;
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }

  // ========== Companies ==========

  async getCompanies(): Promise<Company[]> {
    const response = await this.client.get<Company[]>('/api/companies');
    return response.data;
  }

  async getCompany(id: string): Promise<Company> {
    const response = await this.client.get<Company>(`/api/companies/${id}`);
    return response.data;
  }

  async createInviteLink(companyId: string): Promise<{ inviteLink: string }> {
    const response = await this.client.post<{ inviteLink: string }>(
      `/api/companies/${companyId}/invite-link`
    );
    return response.data;
  }

  // ========== Employees ==========

  async createEmployee(
    companyId: string,
    data: {
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
    }
  ): Promise<Employee> {
    // 프론트엔드 타입을 백엔드 타입으로 변환
    const payload = {
      ...data,
      disabilityLevel: data.disabilityLevel === '중증' ? 'SEVERE' : 'MILD',
    };

    const response = await this.client.post<Employee>(
      `/api/companies/${companyId}/employees`,
      payload
    );
    return response.data;
  }

  async getEmployeesByCompany(companyId: string): Promise<Employee[]> {
    const response = await this.client.get<Employee[]>(
      `/api/companies/${companyId}/employees`
    );
    return response.data;
  }

  async getEmployee(id: string): Promise<Employee> {
    const response = await this.client.get<Employee>(`/api/employees/${id}`);
    return response.data;
  }

  async updateEmployee(
    id: string,
    data: Partial<{
      workingHours: string;
      salary: string;
      contractPeriod: string;
    }>
  ): Promise<Employee> {
    const response = await this.client.patch<Employee>(`/api/employees/${id}`, data);
    return response.data;
  }

  async deleteEmployee(id: string): Promise<void> {
    await this.client.delete(`/api/employees/${id}`);
  }

  // ========== Notifications ==========

  async previewKakaoMessage(employeeName: string, employeePhone: string, contractId?: string) {
    const response = await this.client.get('/api/notifications/preview', {
      params: {
        employeeName,
        employeePhone,
        contractId,
      },
    });
    return response.data;
  }

  async testKakaoMessage(employeeName: string, employeePhone: string, contractId?: string) {
    const response = await this.client.post('/api/notifications/test', {
      employeeName,
      employeePhone,
      contractId,
    });
    return response.data;
  }

  // ========== Contracts ==========

  async sendContract(
    employeeId: string,
    data: {
      workingHours: string;
      salary: string;
      contractPeriod: string;
    }
  ): Promise<{ employee: Employee; contract: any; message: string }> {
    const response = await this.client.post(
      `/api/employees/${employeeId}/contracts/send`,
      data
    );
    return response.data;
  }

  async signContract(
    contractId: string,
    signatureBase64: string,
    pdfBase64: string
  ): Promise<{ employee: Employee; contract: any; message: string }> {
    const response = await this.client.post(
      `/api/contracts/${contractId}/sign`,
      { signatureBase64, pdfBase64 }
    );
    return response.data;
  }

  async getContractsByEmployee(employeeId: string): Promise<any[]> {
    const response = await this.client.get(`/api/employees/${employeeId}/contracts`);
    return response.data;
  }

  async getContract(id: string): Promise<any> {
    const response = await this.client.get(`/api/contracts/${id}`);
    return response.data;
  }

  // ========== Work Records ==========

  async createWorkRecord(
    employeeId: string,
    data: { startTime: string; notes?: string }
  ): Promise<WorkRecord> {
    const response = await this.client.post<WorkRecord>(
      `/api/employees/${employeeId}/work-records`,
      data
    );
    return response.data;
  }

  async updateWorkRecord(
    id: string,
    data: { endTime: string; notes?: string }
  ): Promise<WorkRecord> {
    const response = await this.client.patch<WorkRecord>(
      `/api/work-records/${id}`,
      data
    );
    return response.data;
  }

  async getWorkRecordsByEmployee(
    employeeId: string,
    query?: { year?: number; month?: number }
  ): Promise<WorkRecord[]> {
    const params = new URLSearchParams();
    if (query?.year) params.append('year', query.year.toString());
    if (query?.month) params.append('month', query.month.toString());

    const response = await this.client.get<WorkRecord[]>(
      `/api/employees/${employeeId}/work-records?${params.toString()}`
    );
    return response.data;
  }

  async getWorkRecordsByCompany(
    companyId: string,
    query?: { year?: number; month?: number }
  ): Promise<WorkRecord[]> {
    const params = new URLSearchParams();
    if (query?.year) params.append('year', query.year.toString());
    if (query?.month) params.append('month', query.month.toString());

    const response = await this.client.get<WorkRecord[]>(
      `/api/companies/${companyId}/work-records?${params.toString()}`
    );
    return response.data;
  }

  async exportWorkRecordsToExcel(
    companyId: string,
    year?: number
  ): Promise<Blob> {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const response = await this.client.get(
      `/api/companies/${companyId}/work-records/export?${params.toString()}`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  // ========== Work Schedules ==========

  async getTodaySchedule(employeeId: string): Promise<WorkSchedule | null> {
    const response = await this.client.get<WorkSchedule | null>(
      `/api/work-schedules/${employeeId}/today`
    );
    return response.data;
  }

  async getWeeklySchedule(
    employeeId: string,
    startDate?: Date
  ): Promise<WorkSchedule[]> {
    const params = new URLSearchParams();
    if (startDate) {
      params.append('startDate', startDate.toISOString().split('T')[0]);
    }

    const response = await this.client.get<WorkSchedule[]>(
      `/api/work-schedules/${employeeId}/weekly?${params.toString()}`
    );
    return response.data;
  }

  async createWeeklySchedule(
    employeeId: string,
    startDate?: Date
  ): Promise<WorkSchedule[]> {
    const params = new URLSearchParams();
    if (startDate) {
      params.append('startDate', startDate.toISOString().split('T')[0]);
    }

    const response = await this.client.post<WorkSchedule[]>(
      `/api/work-schedules/${employeeId}/weekly?${params.toString()}`
    );
    return response.data;
  }

  // ========== Current Work Record ==========

  async getCurrentWorkRecord(employeeId: string): Promise<WorkRecord | null> {
    const records = await this.getWorkRecordsByEmployee(employeeId);
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = records.find(r => r.date === today);
    return todayRecord || null;
  }

  // ========== Files ==========

  async uploadFile(file: File, type: 'document' | 'signature' | 'pdf' | 'stamp'): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<{ url: string }>(
      `/api/files/upload?type=${type}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  // ========== Push Notifications ==========

  async registerPushToken(
    employeeId: string,
    token: string,
    platform: 'android' | 'ios'
  ): Promise<void> {
    await this.client.post(`/api/employees/${employeeId}/push-token`, {
      token,
      platform,
    });
  }

  async unregisterPushToken(employeeId: string): Promise<void> {
    await this.client.delete(`/api/employees/${employeeId}/push-token`);
  }

  // ========== Send Push Notification (Admin only) ==========
  
  async sendPushNotification(
    employeeId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    await this.client.post(`/api/employees/${employeeId}/push-notification`, {
      title,
      body,
      data,
    });
  }
}

export const api = new ApiClient();

import axios, { AxiosInstance, AxiosError } from 'axios';

// Use window for environment variable in browser, fallback to default
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && (window as any).VITE_API_URL) {
    return (window as any).VITE_API_URL;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
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
  startTime: string;
  endTime?: string | null;
  duration?: number | null;
  status: 'IN_PROGRESS' | 'COMPLETED';
  notes: string;
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
    console.log('[API Client] Login attempt:', { email });
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
    } catch (error) {
      console.error('[API Client] Login failed:', error);
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
    employeeId: string,
    signatureBase64: string
  ): Promise<{ employee: Employee; contract: any; message: string }> {
    const response = await this.client.post(
      `/api/employees/${employeeId}/contracts/sign`,
      { signatureBase64 }
    );
    return response.data;
  }

  async getContractsByEmployee(employeeId: string): Promise<any[]> {
    const response = await this.client.get(`/api/employees/${employeeId}/contracts`);
    return response.data;
  }

  // ========== Work Records ==========

  async createWorkRecord(
    employeeId: string,
    data: { startTime: string }
  ): Promise<WorkRecord> {
    const response = await this.client.post<WorkRecord>(
      `/api/employees/${employeeId}/work-records`,
      data
    );
    return response.data;
  }

  async updateWorkRecord(
    id: string,
    data: { endTime: string }
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
}

export const api = new ApiClient();

export type Company = {
  id: string
  name: string
  ceo: string
  address: string
  phone: string
}

export type Employee = {
  id: string
  companyId: string
  name: string
  phone: string
  dob: string
  status: "draft" | "sent" | "completed"
  workingHours: string
  salary: string
  contractPeriod: string
}

export type UserRole = 'super_admin' | 'company_admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  companyId?: string; // Only for company_admin
  email: string;
  phone: string;
}

export const companies: Company[] = [
  { id: "c1", name: "(주)스타트업", ceo: "홍길동", address: "서울시 강남구 테헤란로 123", phone: "02-1234-5678" },
  { id: "c2", name: "(주)그레이트퍼즐", ceo: "이명문", address: "서울시 성동구 성수이로 99", phone: "02-9876-5432" },
  { id: "c3", name: "(주)퓨처테크", ceo: "박미래", address: "경기도 판교역로 123", phone: "031-111-2222" },
  { id: "c4", name: "(주)글로벌트레이드", ceo: "최세계", address: "인천광역시 연수구 송도대로 55", phone: "032-555-7777" },
]

const names = ["김철수", "이영희", "박지성", "최동원", "정마음", "홍길동", "강감찬", "유지현", "이순신", "장영실", "신사임당", "허준", "김유신", "계백", "을지문덕", "강우석", "조수미", "박찬호", "손흥민", "김연아", "아이유", "유재석", "강호동", "신동엽", "이효리", "비", "싸이", "봉준호", "박찬욱", "송강호"];

const generatePhone = () => `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
const generateDOB = () => {
  const year = Math.floor(Math.random() * (2000 - 1970 + 1)) + 1970;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const initialEmployees: Employee[] = [
  // (주)스타트업 (c1) - 6명
  { id: "101", companyId: "c1", name: "김태양", phone: "010-1111-1234", dob: "1995-05-05", status: "draft", workingHours: "09:00 ~ 18:00", salary: "2,500,000", contractPeriod: "2026.01.01 ~ 2026.12.31" },
  { id: "102", companyId: "c1", name: "이바다", phone: "010-2222-2345", dob: "1993-08-15", status: "draft", workingHours: "09:00 ~ 18:00", salary: "2,600,000", contractPeriod: "2026.01.01 ~ 2026.12.31" },
  { id: "103", companyId: "c1", name: "박하늘", phone: "010-3333-3456", dob: "1998-02-20", status: "draft", workingHours: "09:00 ~ 18:00", salary: "2,400,000", contractPeriod: "2026.01.01 ~ 2026.12.31" },
  { id: "104", companyId: "c1", name: "최구름", phone: "010-4444-4567", dob: "1990-11-11", status: "draft", workingHours: "09:00 ~ 18:00", salary: "3,000,000", contractPeriod: "2026.01.01 ~ 2026.12.31" },
  { id: "105", companyId: "c1", name: "정별", phone: "010-5555-5678", dob: "1996-07-07", status: "draft", workingHours: "09:00 ~ 18:00", salary: "2,500,000", contractPeriod: "2026.01.01 ~ 2026.12.31" },
  { id: "106", companyId: "c1", name: "한달", phone: "010-6666-6789", dob: "1994-12-25", status: "draft", workingHours: "09:00 ~ 18:00", salary: "2,700,000", contractPeriod: "2026.01.01 ~ 2026.12.31" },

  // (주)그레이트퍼즐 (c2) - 8명
  { id: "201", companyId: "c2", name: "강산", phone: "010-7777-7890", dob: "1988-03-01", status: "draft", workingHours: "10:00 ~ 19:00", salary: "3,200,000", contractPeriod: "2026.02.01 ~ 2027.01.31" },
  { id: "202", companyId: "c2", name: "조강", phone: "010-8888-8901", dob: "1991-09-09", status: "draft", workingHours: "10:00 ~ 19:00", salary: "3,100,000", contractPeriod: "2026.02.01 ~ 2027.01.31" },
  { id: "203", companyId: "c2", name: "윤슬", phone: "010-9999-9012", dob: "1997-01-01", status: "draft", workingHours: "10:00 ~ 19:00", salary: "2,800,000", contractPeriod: "2026.02.01 ~ 2027.01.31" },
  { id: "204", companyId: "c2", name: "장비", phone: "010-1010-1122", dob: "1985-05-05", status: "draft", workingHours: "10:00 ~ 19:00", salary: "3,500,000", contractPeriod: "2026.02.01 ~ 2027.01.31" },
  { id: "205", companyId: "c2", name: "관우", phone: "010-1212-1313", dob: "1984-04-04", status: "draft", workingHours: "10:00 ~ 19:00", salary: "3,600,000", contractPeriod: "2026.02.01 ~ 2027.01.31" },
  { id: "206", companyId: "c2", name: "유비", phone: "010-1414-1515", dob: "1983-03-03", status: "draft", workingHours: "10:00 ~ 19:00", salary: "4,000,000", contractPeriod: "2026.02.01 ~ 2027.01.31" },
  { id: "207", companyId: "c2", name: "제갈량", phone: "010-1616-1717", dob: "1986-06-06", status: "draft", workingHours: "10:00 ~ 19:00", salary: "3,800,000", contractPeriod: "2026.02.01 ~ 2027.01.31" },
  { id: "208", companyId: "c2", name: "조운", phone: "010-1818-1919", dob: "1989-08-08", status: "draft", workingHours: "10:00 ~ 19:00", salary: "3,300,000", contractPeriod: "2026.02.01 ~ 2027.01.31" },

  // (주)퓨처테크 (c3) - 5명
  { id: "301", companyId: "c3", name: "스티브", phone: "010-2020-2121", dob: "1990-10-10", status: "draft", workingHours: "08:00 ~ 17:00", salary: "4,500,000", contractPeriod: "2026.03.01 ~ 2027.02.28" },
  { id: "302", companyId: "c3", name: "빌", phone: "010-2222-2323", dob: "1988-12-12", status: "draft", workingHours: "08:00 ~ 17:00", salary: "4,800,000", contractPeriod: "2026.03.01 ~ 2027.02.28" },
  { id: "303", companyId: "c3", name: "일론", phone: "010-2424-2525", dob: "1992-02-02", status: "draft", workingHours: "08:00 ~ 17:00", salary: "5,000,000", contractPeriod: "2026.03.01 ~ 2027.02.28" },
  { id: "304", companyId: "c3", name: "마크", phone: "010-2626-2727", dob: "1994-04-04", status: "draft", workingHours: "08:00 ~ 17:00", salary: "4,600,000", contractPeriod: "2026.03.01 ~ 2027.02.28" },
  { id: "305", companyId: "c3", name: "제프", phone: "010-2828-2929", dob: "1985-05-15", status: "draft", workingHours: "08:00 ~ 17:00", salary: "5,200,000", contractPeriod: "2026.03.01 ~ 2027.02.28" },

  // (주)글로벌트레이드 (c4) - 7명
  { id: "401", companyId: "c4", name: "김무역", phone: "010-3030-3131", dob: "1980-01-01", status: "draft", workingHours: "09:00 ~ 18:00", salary: "3,000,000", contractPeriod: "2026.01.01 ~ 2026.12.31" },
  { id: "402", companyId: "c4", name: "이수출", phone: "010-3232-3333", dob: "1982-02-02", status: "draft", workingHours: "09:00 ~ 18:00", salary: "2,900,000", contractPeriod: "2026.01.01 ~ 2026.12.31" },
  { id: "403", companyId: "c4", name: "박수입", phone: "010-3434-3535", dob: "1985-05-05", status: "draft", workingHours: "09:00 ~ 18:00", salary: "3,100,000", contractPeriod: "2026.01.01 ~ 2026.12.31" },
  { id: "404", companyId: "c4", name: "최통관", phone: "010-3636-3737", dob: "1990-09-09", status: "draft", workingHours: "09:00 ~ 18:00", salary: "2,800,000", contractPeriod: "2026.01.01 ~ 2026.12.31" },
  { id: "405", companyId: "c4", name: "정해운", phone: "010-3838-3939", dob: "1992-12-12", status: "draft", workingHours: "09:00 ~ 18:00", salary: "2,700,000", contractPeriod: "2026.01.01 ~ 2026.12.31" },
  { id: "406", companyId: "c4", name: "강선박", phone: "010-4040-4141", dob: "1988-08-08", status: "draft", workingHours: "09:00 ~ 18:00", salary: "3,300,000", contractPeriod: "2026.01.01 ~ 2026.12.31" },
  { id: "407", companyId: "c4", name: "한물류", phone: "010-4242-4343", dob: "1995-05-05", status: "draft", workingHours: "09:00 ~ 18:00", salary: "2,600,000", contractPeriod: "2026.01.01 ~ 2026.12.31" },
];

import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

interface EmployeeWorkData {
  employee: any;
  workRecords: any[];
  company: any;
}

@Injectable()
export class ExcelExportService {
  async generateEmploymentReport(
    employeesData: EmployeeWorkData[],
    year: number,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('고용부담금 신고');

    // 헤더 정의
    const headers = [
      '사업자등록번호',
      '주민등록번호',
      '주민순번',
      '근로자명',
      '연락처',
      '장애인정구분',
      '장애유형',
      '상이등급',
      '중증여부',
      '장애인정일',
      '입사일',
      '퇴사일',
      '근무직종',
      '임금',
      '타지원금명칭',
      '타지원금수령시작일',
      '타지원금수령종료일',
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
        `${month}월고용보험`,
      );
    }

    // 헤더 행 추가
    worksheet.addRow(headers);

    // 각 직원의 데이터 추가
    for (let idx = 0; idx < employeesData.length; idx++) {
      const { employee, workRecords, company } = employeesData[idx];

      // 월별 근무 데이터 집계
      const monthlyData = this.aggregateMonthlyData(workRecords, year);

      const row = [
        company.businessNumber || '', // 사업자등록번호
        employee.residentNumber || '', // 주민등록번호
        idx + 1, // 주민순번
        employee.name,
        employee.phone,
        employee.disabilityLevel === 'SEVERE' ? '1' : '2', // 장애인정구분 (1:중증, 2:경증)
        this.getDisabilityTypeCode(employee.disabilityType), // 장애유형 코드
        '', // 상이등급
        employee.disabilityLevel === 'SEVERE' ? 'Y' : 'N', // 중증여부
        employee.disabilityRecognitionDate.replace(/-/g, ''), // 장애인정일 (YYYYMMDD)
        this.extractDate(employee.createdAt), // 입사일 (근로자 등록일)
        '', // 퇴사일
        '', // 근무직종
        this.extractSalary(employee.salary), // 임금
        '', // 타지원금명칭
        '', // 타지원금수령시작일
        '', // 타지원금수령종료일
      ];

      // 월별 데이터 추가 (1월~12월)
      for (let month = 1; month <= 12; month++) {
        const data = monthlyData[month] || {};
        row.push(
          data.minimumWage || 'N', // X월최저
          data.minimumWageException || 'N', // X월최저예외
          data.salary || 0, // X월임금
          data.isSevere || 'N', // X월중증여부
          data.isDoubleCount || 'N', // X월2배수여부
          data.otherSupport || 'N', // X월타지원금
          data.employmentInsurance || 'N', // X월고용보험
        );
      }

      worksheet.addRow(row);
    }

    // 엑셀 파일을 Buffer로 변환
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private aggregateMonthlyData(workRecords: any[], year: number) {
    const monthlyData: { [month: number]: any } = {};

    for (let month = 1; month <= 12; month++) {
      // 해당 월의 근무 기록 필터링
      const monthRecords = workRecords.filter((record) => {
        const recordDate = new Date(record.startTime);
        return (
          recordDate.getFullYear() === year &&
          recordDate.getMonth() + 1 === month
        );
      });

      if (monthRecords.length > 0) {
        // 해당 월에 근무가 있음
        const firstRecord = monthRecords[0];
        const employee = firstRecord.employee;

        // 총 근무 시간 계산 (분 단위)
        const totalMinutes = monthRecords.reduce((sum, record) => {
          return sum + (record.duration || 0);
        }, 0);

        // 총 임금 (월 임금을 그대로 사용)
        const monthlySalary = this.extractSalary(employee.salary);

        monthlyData[month] = {
          minimumWage: 'N',
          minimumWageException: 'N',
          salary: monthlySalary,
          isSevere: employee.disabilityLevel === 'SEVERE' ? 'Y' : 'N',
          isDoubleCount: 'N',
          otherSupport: 'N',
          employmentInsurance: 'Y', // 근무가 있으면 고용보험 Y
        };
      } else {
        // 해당 월에 근무가 없음
        monthlyData[month] = {
          minimumWage: 'N',
          minimumWageException: 'N',
          salary: 0,
          isSevere: 'N',
          isDoubleCount: 'N',
          otherSupport: 'N',
          employmentInsurance: 'N',
        };
      }
    }

    return monthlyData;
  }

  private extractDate(dateString: string | Date): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  private extractSalary(salaryString: string): number {
    if (!salaryString) return 0;
    // "월 2,300,000원" -> 2300000
    const numbers = salaryString.replace(/[^0-9]/g, '');
    return parseInt(numbers, 10) || 0;
  }

  private getDisabilityTypeCode(disabilityType: string): string {
    // 장애 유형을 코드로 변환
    const disabilityCodeMap: { [key: string]: string } = {
      '지체장애': '지체-10',
      '뇌병변장애': '뇌병변-20',
      '시각장애': '시각-30',
      '청각장애': '청각-40',
      '언어장애': '언어-50',
      '지적장애': '지적-60',
      '정신장애': '정신-70',
      '자폐성장애': '자폐성-80',
      '신장장애': '신장-90',
      '심장장애': '심장-A0',
      '호흡기장애': '호흡기-B0',
      '간장애': '간-C0',
      '안면장애': '안면-D0',
      '장루요루장애': '장루요루-E0',
      '뇌전증장애': '뇌전증-F0',
    };

    // 정확히 일치하는 경우
    if (disabilityCodeMap[disabilityType]) {
      return disabilityCodeMap[disabilityType];
    }

    // 부분 일치 검색 (예: "지체" -> "지체-10")
    for (const [key, value] of Object.entries(disabilityCodeMap)) {
      if (disabilityType.includes(key.replace('장애', ''))) {
        return value;
      }
    }

    // 매칭되지 않는 경우 원본 반환
    return disabilityType;
  }
}

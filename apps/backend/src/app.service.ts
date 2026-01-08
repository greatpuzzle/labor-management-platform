import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: '🚀 장애인 근로관리 플랫폼 백엔드 API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: {
          login: 'POST /api/auth/login',
          me: 'GET /api/auth/me (인증 필요)',
        },
        docs: {
          health: 'GET /api/health',
          apiInfo: 'GET /api',
        },
      },
      testAccounts: {
        superAdmin: {
          email: 'admin@ecospott.com',
          password: 'password123',
          role: 'SUPER_ADMIN',
        },
        companyAdmin: {
          email: 'company@ecospott.com',
          password: 'password123',
          role: 'COMPANY_ADMIN',
          company: '(주)에코스팟',
        },
      },
    };
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
    };
  }
}

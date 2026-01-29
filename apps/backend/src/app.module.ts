import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { EmployeesModule } from './employees/employees.module';
import { ContractsModule } from './contracts/contracts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WorkRecordsModule } from './work-records/work-records.module';
import { WorkSchedulesModule } from './work-schedules/work-schedules.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';
import { VerificationModule } from './verification/verification.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    EmployeesModule,
    ContractsModule,
    NotificationsModule,
    WorkRecordsModule,
    WorkSchedulesModule,
    PushNotificationsModule,
    VerificationModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

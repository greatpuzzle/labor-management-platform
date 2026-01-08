import { Module } from '@nestjs/common';
import { WorkRecordsController } from './work-records.controller';
import { WorkRecordsService } from './work-records.service';
import { ExcelExportService } from './excel-export.service';

@Module({
  controllers: [WorkRecordsController],
  providers: [WorkRecordsService, ExcelExportService],
  exports: [WorkRecordsService],
})
export class WorkRecordsModule {}

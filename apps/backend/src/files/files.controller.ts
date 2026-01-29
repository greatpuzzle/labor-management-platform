import {
  Controller,
  Post,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { Public } from '../auth/decorators/public.decorator';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @Public()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, `file-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB 제한
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: string,
  ) {
    if (!file) {
      throw new BadRequestException('파일이 업로드되지 않았습니다.');
    }

    if (!type || !['document', 'signature', 'pdf', 'stamp'].includes(type)) {
      throw new BadRequestException('유효하지 않은 파일 타입입니다.');
    }

    // 파일 URL 생성 (서버 주소 + 파일 경로)
    const baseUrl = process.env.API_BASE_URL || 'http://43.200.44.109:3002';
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;

    return {
      url: fileUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      type: file.mimetype,
    };
  }
}

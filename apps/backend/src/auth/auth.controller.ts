import { Controller, Post, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    return { user: await this.authService.getMe(req.user.id) };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return { user: await this.authService.updateMe(req.user.id, updateUserDto) };
  }
}

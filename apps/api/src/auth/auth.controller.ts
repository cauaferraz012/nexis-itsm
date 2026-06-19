import { Controller, Post, Body, Get, UseGuards, UnauthorizedException, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('users')
  async getUsers(@Request() req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Apenas administradores podem listar usuários.');
    }
    return this.authService.getAllUsers();
  }
}

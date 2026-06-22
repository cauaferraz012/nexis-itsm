import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(data: any) {
    // Bloqueio de e-mails públicos (exigir corporativo)
    const publicDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br', 'live.com', 'icloud.com'];
    const emailDomain = data.email.split('@')[1]?.toLowerCase();
    
    if (publicDomains.includes(emailDomain)) {
      throw new UnauthorizedException('Apenas e-mails corporativos são permitidos.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Usuário já existe.');
    }

    // Lógica para criação de Admin
    let role = 'USER';
    if (data.role === 'ADMIN') {
      if (data.adminKey !== 'NEXIS-TI-2026') {
        throw new UnauthorizedException('Chave de Segurança de TI inválida.');
      }
      role = 'ADMIN';
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: role,
      },
    });

    return this.login(user);
  }

  async login(userOrData: any) {
    let user = userOrData;
    
    if (!user.id) {
      // It's a login request
      user = await this.prisma.user.findUnique({
        where: { email: userOrData.email },
      });

      if (!user) {
        throw new UnauthorizedException('Credenciais inválidas.');
      }

      const isPasswordValid = await bcrypt.compare(userOrData.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciais inválidas.');
      }
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' }
    });
  }
}

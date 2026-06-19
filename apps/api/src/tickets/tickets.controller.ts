import { Controller, Post, Body, Get, UseGuards, Request, Param, Patch, UnauthorizedException, UseInterceptors, UploadedFile, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      }
    })
  }))
  async createTicket(
    @Request() req: any,
    @Body() body: { title: string; description: string; priority: string; type?: string; category?: string; authorId?: string },
    @UploadedFile() file?: Express.Multer.File
  ) {
    let authorId = req.user.userId;
    
    // Se for ADMIN e enviar authorId, ele pode abrir chamado em nome de outro
    if (req.user.role === 'ADMIN' && body.authorId) {
      authorId = body.authorId;
    }

    const attachmentUrl = file ? `/uploads/${file.filename}` : undefined;

    return this.ticketsService.create({
      title: body.title,
      description: body.description,
      priority: body.priority || 'MEDIUM',
      type: body.type || 'INCIDENT',
      category: body.category || 'OUTROS',
      authorId,
      attachmentUrl,
    });
  }

  @Get()
  async getTickets(@Request() req: any) {
    const userId = req.user.userId;
    return this.ticketsService.findAll(userId);
  }

  @Get('admin/stats')
  async getAdminStats(@Request() req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Apenas administradores podem ver as estatísticas.');
    }
    return this.ticketsService.getAdminStats();
  }

  @Get('admin/all')
  async getAllTickets(@Request() req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Apenas administradores podem ver todos os chamados.');
    }
    return this.ticketsService.findAllAdmin();
  }

  @Get(':id')
  async getTicketDetails(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    const ticket = await this.ticketsService.findOne(id, userId);
    
    if (!ticket) {
      throw new UnauthorizedException('Chamado não encontrado ou você não tem acesso.');
    }
    
    // Se não for ADMIN e não for o autor, proíbe.
    if (req.user.role !== 'ADMIN' && ticket.authorId !== userId) {
      throw new UnauthorizedException('Você não tem acesso a este chamado.');
    }

    return ticket;
  }

  @Patch(':id/assign')
  async assignTicket(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Apenas administradores podem assumir chamados.');
    }
    const adminId = req.user.userId;
    return this.ticketsService.assignTicket(id, adminId);
  }

  @Post(':id/comments')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      }
    })
  }))
  async addComment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { text: string },
    @UploadedFile() file?: Express.Multer.File
  ) {
    const userId = req.user.userId;
    const attachmentUrl = file ? `/uploads/${file.filename}` : undefined;
    return this.ticketsService.addComment(id, body.text, userId, attachmentUrl);
  }

  @Patch(':id/status')
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    const userId = req.user.userId;
    return this.ticketsService.updateStatus(id, body.status, userId);
  }

  @Delete('admin/clear-all')
  async clearAllTickets(@Request() req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Apenas administradores podem apagar tudo.');
    }
    return this.ticketsService.clearAll();
  }
}

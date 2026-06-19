import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async create(data: {
    title: string;
    description: string;
    priority: string;
    type: string;
    category: string;
    authorId: string;
    attachmentUrl?: string;
  }) {
    const now = new Date();
    let hoursToAdd = 24; // Default MEDIUM
    if (data.priority === 'URGENT') hoursToAdd = 2;
    else if (data.priority === 'HIGH') hoursToAdd = 8;
    else if (data.priority === 'LOW') hoursToAdd = 48;

    const slaDeadline = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);

    const ticket = await this.prisma.ticket.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        type: data.type,
        category: data.category,
        status: 'OPEN',
        authorId: data.authorId,
        attachmentUrl: data.attachmentUrl,
        slaDeadline,
        slaStatus: 'RUNNING',
      },
      include: {
        author: { select: { email: true } }
      }
    });

    this.emailService.sendTicketCreated(ticket.id, ticket.author.email, ticket.title);

    return ticket;
  }

  async findAll(userId: string) {
    return this.prisma.ticket.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getAdminStats() {
    const total = await this.prisma.ticket.count();
    
    // Group by status
    const statusCounts = await this.prisma.ticket.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Group by priority
    const priorityCounts = await this.prisma.ticket.groupBy({
      by: ['priority'],
      _count: { priority: true },
    });

    // Group by type
    const typeCounts = await this.prisma.ticket.groupBy({
      by: ['type'],
      _count: { type: true },
    });

    // Format data for Recharts (Array of objects with name and value)
    const formattedStatus = statusCounts.map(item => ({
      name: item.status,
      value: item._count.status
    }));

    const formattedPriority = priorityCounts.map(item => ({
      name: item.priority,
      value: item._count.priority
    }));

    const formattedType = typeCounts.map(item => ({
      name: item.type,
      value: item._count.type
    }));

    // Find latest 5 tickets
    const recentTickets = await this.prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { author: { select: { name: true } } }
    });

    return {
      total,
      byStatus: formattedStatus,
      byPriority: formattedPriority,
      byType: formattedType,
      recent: recentTickets
    };
  }

  async findAllAdmin() {
    return this.prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { name: true, email: true } },
        assignee: { select: { name: true, id: true } },
      },
    });
  }

  async findOne(ticketId: string, userId: string) {
    // Para simplificar, estamos ignorando userId aqui caso o admin precise ver chamados de outros,
    // mas na rota original de usuários, o userId filtra. Na rota admin, precisamos pegar independente do autor.
    // Vamos corrigir a busca para pegar o ticket pelo ID. Se não achar, o controller pode barrar.
    return this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        author: { select: { name: true, email: true, id: true } },
        assignee: { select: { name: true, id: true } },
        comments: {
          include: { author: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async assignTicket(ticketId: string, adminId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Chamado não encontrado');
    if (ticket.status === 'RESOLVED') throw new NotFoundException('Chamado já resolvido');
    
    // Assign and change status to IN_PROGRESS automatically
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { assigneeId: adminId, status: 'IN_PROGRESS' },
    });
  }

  async addComment(ticketId: string, text: string, authorId: string, attachmentUrl?: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { author: { select: { email: true, id: true } } }
    });

    if (!ticket) {
      throw new NotFoundException('Chamado não encontrado');
    }

    if (ticket.status === 'RESOLVED') {
      throw new NotFoundException('Este chamado está resolvido e não aceita novos comentários.');
    }

    const comment = await this.prisma.comment.create({
      data: {
        text,
        ticketId,
        authorId,
        attachmentUrl,
      },
      include: {
        author: { select: { name: true, role: true } },
      },
    });

    // Se o autor do ticket for o autor do comentário E o status for WAITING, volta para IN_PROGRESS
    if (authorId === ticket.author.id && ticket.status === 'WAITING') {
      await this.updateStatus(ticketId, 'IN_PROGRESS', authorId);
    }

    if (comment.author.role === 'ADMIN') {
      this.emailService.sendEmail(
        ticket.author.email,
        `Nova mensagem no chamado #${ticket.id.split('-')[0]}`,
        `A equipe de TI adicionou um comentário no seu chamado "${ticket.title}".\n\nMensagem: ${text}`
      );
    }

    return comment;
  }

  async updateStatus(ticketId: string, status: string, userId: string) {
    const ticketInfo = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticketInfo) throw new NotFoundException('Chamado não encontrado');
    if (ticketInfo.status === 'RESOLVED') throw new NotFoundException('Este chamado já está resolvido.');

    let updateData: any = { status };
    const now = new Date();

    if (status === 'WAITING') {
      // Pausa o SLA
      updateData.slaStatus = 'PAUSED';
      updateData.slaPausedAt = now;
    } else if (status === 'RESOLVED') {
      // Para o SLA e checa se estourou
      if (ticketInfo.slaDeadline) {
        updateData.slaStatus = now <= ticketInfo.slaDeadline ? 'MET' : 'BREACHED';
      }
      updateData.slaPausedAt = null;
    } else if (status === 'IN_PROGRESS' || status === 'OPEN') {
      // Retoma SLA se estava pausado
      if (ticketInfo.slaPausedAt && ticketInfo.slaDeadline) {
        const pausedTimeMs = now.getTime() - ticketInfo.slaPausedAt.getTime();
        const newDeadline = new Date(ticketInfo.slaDeadline.getTime() + pausedTimeMs);
        updateData.slaDeadline = newDeadline;
      }
      // Se estourou, continua estourado, senão continua RUNNING
      if (ticketInfo.slaDeadline && now > ticketInfo.slaDeadline) {
         updateData.slaStatus = 'BREACHED';
      } else {
         updateData.slaStatus = 'RUNNING';
      }
      updateData.slaPausedAt = null;
    }

    const ticket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: { author: { select: { email: true } } }
    });

    this.emailService.sendTicketUpdated(ticket.id, ticket.author.email, ticket.title, status);

    return ticket;
  }

  async clearAll() {
    await this.prisma.comment.deleteMany({});
    await this.prisma.ticket.deleteMany({});
    return { success: true, message: 'Todos os chamados foram apagados.' };
  }
}

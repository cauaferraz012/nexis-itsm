import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class KbService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: string) {
    if (query) {
      return this.prisma.article.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { content: { contains: query } },
          ],
        },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.article.findMany({
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.article.findUnique({
      where: { id },
      include: { author: { select: { name: true } } },
    });
  }

  async create(data: { title: string; content: string; category: string; authorId: string }) {
    return this.prisma.article.create({
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.article.delete({
      where: { id },
    });
  }
}

import { Controller, Get, Param, Query, UseGuards, Post, Body, Request, Delete, UnauthorizedException } from '@nestjs/common';
import { KbService } from './kb.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('kb')
export class KbController {
  constructor(private readonly kbService: KbService) {}

  @Get()
  async getArticles(@Query('q') query?: string) {
    return this.kbService.findAll(query);
  }

  @Get(':id')
  async getArticleDetails(@Param('id') id: string) {
    return this.kbService.findOne(id);
  }

  @Post()
  async createArticle(@Request() req: any, @Body() body: { title: string; content: string; category: string }) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Apenas administradores podem criar artigos.');
    }
    return this.kbService.create({
      title: body.title,
      content: body.content,
      category: body.category || 'GERAL',
      authorId: req.user.userId,
    });
  }

  @Delete(':id')
  async deleteArticle(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Apenas administradores podem excluir artigos.');
    }
    return this.kbService.remove(id);
  }
}

import { Module } from '@nestjs/common';
import { KbService } from './kb.service';
import { KbController } from './kb.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [KbController],
  providers: [KbService, PrismaService],
})
export class KbModule {}

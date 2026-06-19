import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendEmail(to: string, subject: string, body: string) {
    // Simulador de envio de e-mail local (Mock) para o MVP
    this.logger.log('\n=========================================');
    this.logger.log('📧 NOVO E-MAIL DISPARADO PELO SISTEMA 📧');
    this.logger.log(`📍 Para: ${to}`);
    this.logger.log(`📌 Assunto: ${subject}`);
    this.logger.log('-----------------------------------------');
    this.logger.log(`\n${body}\n`);
    this.logger.log('=========================================\n');
    
    // Retorna true fingindo que o envio foi um sucesso
    return true;
  }

  async sendTicketCreated(ticketId: string, authorEmail: string, title: string) {
    const body = `Olá!\n\nSeu chamado #${ticketId.split('-')[0]} ("${title}") foi recebido com sucesso pela nossa equipe de TI.\n\nVocê será notificado assim que houver atualizações.\n\nAtenciosamente,\nEquipe ITSM Pro`;
    return this.sendEmail(authorEmail, 'Seu chamado foi aberto com sucesso!', body);
  }

  async sendTicketUpdated(ticketId: string, authorEmail: string, title: string, status: string) {
    const statusText = status === 'RESOLVED' ? 'Resolvido' : status === 'IN_PROGRESS' ? 'Em Andamento' : 'Aberto';
    const body = `Olá!\n\nO status do seu chamado #${ticketId.split('-')[0]} ("${title}") foi atualizado para: ${statusText}.\n\nAcesse o painel para ver mais detalhes.\n\nAtenciosamente,\nEquipe ITSM Pro`;
    return this.sendEmail(authorEmail, 'Atualização no seu Chamado', body);
  }
}

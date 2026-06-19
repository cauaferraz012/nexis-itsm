import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed: Start');

  // Verifica se o usuário Admin existe
  let admin = await prisma.user.findUnique({ where: { email: 'admin@itsm.com' } });
  
  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    admin = await prisma.user.create({
      data: {
        name: 'Administrador TI',
        email: 'admin@itsm.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('Admin user created.');
  }

  // Criação de Artigos da Base de Conhecimento
  const articlesCount = await prisma.article.count();
  
  if (articlesCount === 0) {
    console.log('Seeding articles...');
    
    await prisma.article.createMany({
      data: [
        {
          title: 'Como redefinir sua senha de e-mail',
          content: 'Para redefinir sua senha, acesse o portal Office 365, clique em "Esqueci minha senha" e siga os passos de verificação utilizando seu telefone cadastrado ou aplicativo Authenticator.',
          category: 'Acessos',
          authorId: admin.id,
        },
        {
          title: 'Configurando a VPN no Home Office',
          content: 'Baixe o cliente VPN pelo portal da empresa. Insira o endereço vpn.empresa.com. Use suas credenciais normais do Windows e confirme o acesso pelo aplicativo de duplo fator no seu celular.',
          category: 'Redes',
          authorId: admin.id,
        },
        {
          title: 'O que fazer quando o monitor secundário não liga?',
          content: '1. Verifique se os cabos HDMI/DisplayPort estão bem encaixados.\n2. Veja se a luz de energia do monitor está ligada.\n3. Pressione a tecla Windows + P e certifique-se de que a opção "Estender" está selecionada.',
          category: 'Hardware',
          authorId: admin.id,
        },
        {
          title: 'Solicitação de Férias: Passo a Passo',
          content: 'Acesse o portal do RH (Caminho: Intranet > RH > Férias). Preencha os dias desejados com pelo menos 30 dias de antecedência. O seu gestor direto receberá uma notificação para aprovação.',
          category: 'RH',
          authorId: admin.id,
        }
      ]
    });
    console.log('Articles seeded.');
  }

  console.log('Seed: Finished');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

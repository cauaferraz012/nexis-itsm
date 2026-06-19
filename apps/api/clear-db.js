const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.comment.deleteMany({});
  await prisma.ticket.deleteMany({});
  console.log('✅ Todos os chamados e comentários foram apagados com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

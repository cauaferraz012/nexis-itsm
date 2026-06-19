const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
  const tickets = await prisma.ticket.findMany({ where: { slaDeadline: null } });
  for (const t of tickets) {
    let hoursToAdd = 24;
    if (t.priority === 'URGENT') hoursToAdd = 2;
    else if (t.priority === 'HIGH') hoursToAdd = 8;
    else if (t.priority === 'LOW') hoursToAdd = 48;
    
    const deadline = new Date(t.createdAt.getTime() + hoursToAdd * 60 * 60 * 1000);
    
    // update status based on whether it is resolved
    let slaStatus = 'RUNNING';
    if (t.status === 'RESOLVED') {
       slaStatus = t.updatedAt <= deadline ? 'MET' : 'BREACHED';
    } else if (t.status === 'WAITING') {
       slaStatus = 'PAUSED';
    } else {
       if (new Date() > deadline) slaStatus = 'BREACHED';
    }

    await prisma.ticket.update({
      where: { id: t.id },
      data: { slaDeadline: deadline, slaStatus }
    });
  }
  console.log('Backfill completo para ' + tickets.length + ' chamados.');
}

backfill().catch(console.error).finally(() => prisma.$disconnect());

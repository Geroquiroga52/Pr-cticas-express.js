// Utilizamos el cliente de Prisma para interactuar con la base de datos
require("dotenv").config();   
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })   

async function main() {
  // Creación de usuarios de demostración
  const users = [
    { name: 'Ger', email: 'usuario1@ejemplo.com' },
    { name: 'Pal', email: 'usuario2@ejemplo.com' },
    { name: 'An', email: 'usuario3@ejemplo.com' }
  ];

  for (const user of users) {
    await prisma.user.create({
      data: user
    });
  }

  console.log('Usuarios de demostración creados con éxito');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
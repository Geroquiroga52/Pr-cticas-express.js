const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

exports.getUserAppointments = async (userId) => {
    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                userId: parseInt(userId)
            },
            include: { timeBlock: true }
        });
        return appointments;
    } catch (error) {
        throw new Error("Error al obtener el historial de citas");
    }
};
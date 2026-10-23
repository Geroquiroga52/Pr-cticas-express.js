const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

exports.createReservation = async (data) => {
    const conflict = await prisma.appointment.findFirst({
        where: {
            date: new Date(data.date),
            timeBlockId: data.timeBlockId
        }
    });
    if (conflict) {
        throw new Error('El horario ya esta en uso');
    }
    return prisma.appointment.create({
        data: {
            date: new Date(data.date),
            timeBlock: {
                connect: { id: data.timeBlockId }
            },
            user: {
                connect: { id: data.userId }   // ✅
            }
        }
    });
};

exports.getReservation = (id) => {
    return prisma.appointment.findUnique({
        where: { id: parseInt(id, 10) }
    });
};

exports.updateReservation = async (id, data) => {
    const conflict = await prisma.appointment.findFirst({
        where: {
            date: data.date,
            timeBlockId: data.timeBlockId,
            id: { not: parseInt(id, 10) }
        }
    });
    if (conflict) {
            throw new Error('El horario ya está ocupado');
        }
    return prisma.appointment.update({
        where: { id: parseInt(id, 10) },
        data
    });
};

exports.deleteReservation = async (id) => {
    return await prisma.appointment.delete({
        where: {
            id: parseInt(id, 10)
        }
    });
};
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Seeding...')

  // 1. Clean up existing data (Optional: Be careful in production!)
  await prisma.maintenanceRequest.deleteMany()
  await prisma.equipment.deleteMany()
  await prisma.user.deleteMany()
  await prisma.team.deleteMany()

  // 2. Create Teams
  const itTeam = await prisma.team.create({
    data: { name: 'IT Support', description: 'Computers, Printers, and Networks' }
  })

  const mechTeam = await prisma.team.create({
    data: { name: 'Mechanics', description: 'Heavy Machinery and Vehicles' }
  })

  // 3. Create Users
  const password = await bcrypt.hash('password123', 10)

  // Admin
  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@gearguard.com',
      password,
      role: Role.Admin
    }
  })

  // IT Technician
  const tech1 = await prisma.user.create({
    data: {
      name: 'Alice IT',
      email: 'alice@gearguard.com',
      password,
      role: Role.Technician,
      teamId: itTeam.id
    }
  })

  // Mechanic
  const tech2 = await prisma.user.create({
    data: {
      name: 'Bob Mechanic',
      email: 'bob@gearguard.com',
      password,
      role: Role.Technician,
      teamId: mechTeam.id
    }
  })

  // 4. Create Equipment
  await prisma.equipment.create({
    data: {
      name: 'Office Printer HP',
      serialNumber: 'PRT-001',
      location: 'Floor 2, Hallway',
      status: 'Active',
      maintenanceTeamId: itTeam.id, // Auto-assigned to IT
      department: 'HR'
    }
  })

  const cncMachine = await prisma.equipment.create({
    data: {
      name: 'CNC Milling Machine',
      serialNumber: 'CNC-9000',
      location: 'Production Floor',
      status: 'Active',
      maintenanceTeamId: mechTeam.id, // Auto-assigned to Mechanics
      department: 'Production'
    }
  })

  // 5. Create a Maintenance Request (Demo Data)
  await prisma.maintenanceRequest.create({
    data: {
      subject: 'Hydraulic Leak',
      description: 'Oil leaking from main valve',
      type: 'Corrective',
      priority: 'High',
      equipmentId: cncMachine.id,
      teamId: mechTeam.id,
      technicianId: tech2.id, // Assigned to Bob
      status: 'InProgress'
    }
  })

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
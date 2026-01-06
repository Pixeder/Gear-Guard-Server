import { Request, Response } from 'express';
import { prisma } from '../db/prisma.db.js'; // Adjust path
import { apiError, apiResponse, asyncHandler } from '../libs/index.js';

// 1. Add New Equipment
export const createEquipment = asyncHandler(async (req: Request, res: Response) => {
  const { 
    name, 
    serialNumber, 
    location, 
    maintenanceTeamId, // CRITICAL: Who fixes this?
    department,        // Optional: Who owns this?
    assignedUserId     // Optional: Is it a personal laptop?
  } = req.body;

  if (!name || !serialNumber || !maintenanceTeamId) {
    throw new apiError(400, "Name, Serial Number, and Maintenance Team are required");
  }

  // Validate Team Exists
  const team = await prisma.team.findUnique({ where: { id: maintenanceTeamId } });
  if (!team) throw new apiError(404, "Selected Maintenance Team does not exist");

  const equipment = await prisma.equipment.create({
    data: {
      name,
      serialNumber,
      location,
      maintenanceTeamId,
      department,
      assignedUserId
    }
  });

  return res.status(201).json(
    new apiResponse(201, equipment, "Equipment added successfully")
  );
});

// 2. Get All Equipment (with Filter capability)
export const getEquipment = asyncHandler(async (req: Request, res: Response) => {
  // Allow filtering by Department or Team via query params
  // Example: /api/v1/equipment?department=Production
  const { department, maintenanceTeamId } = req.query;

  const filter: any = {};
  if (department) filter.department = String(department);
  if (maintenanceTeamId) filter.maintenanceTeamId = String(maintenanceTeamId);

  const equipmentList = await prisma.equipment.findMany({
    where: filter,
    include: {
      maintenanceTeam: { select: { name: true } }, // Fetch Team Name
      assignedUser: { select: { name: true, email: true } } // Fetch Owner Name
    }
  });

  return res.status(200).json(
    new apiResponse(200, equipmentList, "Equipment list fetched successfully")
  );
});

export const deleteEquipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.$transaction([
      // 1. Delete all tickets associated with this equipment
      prisma.maintenanceRequest.deleteMany({
        where: { equipmentId: id }
      }),
      // 2. Now it is safe to delete the equipment
      prisma.equipment.delete({
        where: { id }
      })
    ]);
    console.log(typeof id.trim());
    
    return res.status(200).json(new apiResponse(200, {}, "Equipment deleted successfully"));
  } catch (error) {
    // Handle case where item doesn't exist or has constraints
    throw new apiError(500, "Failed to delete equipment");
  }
};

export const updateEquipment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, serialNumber, location, department, status, maintenanceTeamId } = req.body;

  // Check if exists
  const exists = await prisma.equipment.findUnique({ where: { id } });
  if (!exists) throw new apiError(404, "Equipment not found");

  const updated = await prisma.equipment.update({
    where: { id },
    data: { name, serialNumber, location, department, status, maintenanceTeamId }
  });

  return res
    .status(200)
    .json(new apiResponse(200, updated, "Equipment updated successfully"));
});
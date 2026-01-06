import { Request, Response } from 'express';
import { prisma } from '../db/prisma.db.js'; // Adjust path
import { apiError, apiResponse, asyncHandler } from '../libs/index.js';

// 1. Create Request (The "Breakdown" & "Routine" Start)
export const createRequest = asyncHandler(async (req: Request, res: Response) => {
  const { 
    subject, 
    description, 
    equipmentId, 
    type,            // "Corrective" or "Preventive"
    priority, 
    scheduledDate    // Required if type is Preventive
  } = req.body;

  if (!subject || !equipmentId) {
    throw new apiError(400, "Subject and Equipment are required");
  }

  // A. Auto-Fill Logic: Find the Team responsible for this Equipment
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId }
  });

  if (!equipment) throw new apiError(404, "Equipment not found");

  // B. Create the Request linked to that Team automatically
  const newRequest = await prisma.maintenanceRequest.create({
    data: {
      subject,
      description,
      type: type || 'Corrective',
      priority: priority || 'Normal',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      
      equipmentId: equipment.id,
      teamId: equipment.maintenanceTeamId, // <--- The Auto-Fill Magic
      
      // Default status is 'New'
    }
  });

  return res.status(201).json(
    new apiResponse(201, newRequest, "Maintenance Request created successfully")
  );
});

// 2. Get Requests (For Kanban Board & Calendar)
export const getRequests = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, status, date } = req.query;

  const filter: any = {};
  if (teamId) filter.teamId = String(teamId);
  if (status) filter.status = String(status);
  
  // Calendar View Filter: Check for requests on a specific day
  if (date) {
    const start = new Date(String(date));
    const end = new Date(String(date));
    end.setHours(23, 59, 59, 999);
    filter.scheduledDate = { gte: start, lte: end };
  }

  const requests = await prisma.maintenanceRequest.findMany({
    where: filter,
    include: {
      equipment: { select: { name: true, serialNumber: true } },
      technician: { select: { name: true, avatar: true } }, // For Avatars on Kanban
      team: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return res.status(200).json(
    new apiResponse(200, requests, "Requests fetched successfully")
  );
});

// 3. Update Request (Move Kanban Card / Assign User)
export const updateRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, technicianId, duration, notes } = req.body;

  // Check if we are moving to SCRAP
  if (status === 'Scrap') {
    // Advanced Logic: Automatically mark the equipment as inactive
    const request = await prisma.maintenanceRequest.findUnique({ where: { id } });
    if (request) {
      await prisma.equipment.update({
        where: { id: request.equipmentId },
        data: { status: 'Scrap' } // Mark machine as dead
      });
    }
  }

  const updatedRequest = await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      status,
      technicianId,
      duration: duration ? Number(duration) : undefined,
      description: notes ? notes : undefined // Append notes if needed
    }
  });

  return res.status(200).json(
    new apiResponse(200, updatedRequest, "Request updated successfully")
  );
});

export const updateRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Expecting: "New" | "InProgress" | "Repaired" | "Scrap"

    // Validate Status against your Enum
    const validStatuses = ['New', 'InProgress', 'Repaired', 'Scrap'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided',
      });
    }

    const updatedRequest = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: status, 
        // Optional: If moving to "Repaired", set duration or closedAt time?
        // updatedAt is handled automatically by Prisma
      },
      include: {
        equipment: true, // Return data needed for UI update
        technician: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: updatedRequest,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update request status',
    });
  }
};
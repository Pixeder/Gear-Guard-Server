import { Request, Response } from 'express';
import { prisma } from '../db/prisma.db.js'; // Adjust path
import { apiError, apiResponse, asyncHandler } from '../libs/index.js';

// 1. Create a New Team (e.g., "IT Support")
export const createTeam = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;

  if (!name) throw new apiError(400, "Team Name is required");

  // Create team
  const team = await prisma.team.create({
    data: { name, description }
  });

  return res.status(201).json(
    new apiResponse(201, team, "Maintenance Team created successfully")
  );
});

// 2. Get All Teams (with member count)
export const getTeams = asyncHandler(async (req: Request, res: Response) => {
  const teams = await prisma.team.findMany({
    include: {
      _count: { select: { members: true, equipment: true } }
    }
  });

  return res.status(200).json(
    new apiResponse(200, teams, "Teams fetched successfully")
  );
});

// 3. Assign a Technician to a Team
export const addMemberToTeam = asyncHandler(async (req: Request, res: Response) => {
  const { teamId, userId } = req.body;

  // Verify both exist
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new apiError(404, "Team not found");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new apiError(404, "User not found");

  // Update user record
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { teamId }
  });

  return res.status(200).json(
    new apiResponse(200, updatedUser, `User assigned to ${team.name}`)
  );
});
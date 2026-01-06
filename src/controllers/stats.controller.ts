import { Request, Response } from 'express';
import { prisma } from '../db/prisma.db.js'; // Adjust path
import { apiError, apiResponse, asyncHandler } from '../libs/index.js';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Run these queries in parallel for speed
    const [
      activeTickets,
      totalEquipment,
      operationalEquipment,
      totalTeams,
      recentActivity
    ] = await Promise.all([
      // 1. Count Active Tickets (DB does the counting)
      prisma.maintenanceRequest.count({
        where: { NOT: { status: { in: ['Repaired', 'Scrap'] } } }
      }),
      // 2. Count All Equipment
      prisma.equipment.count(),
      // 3. Count Operational Equipment
      prisma.equipment.count({
        where: { status: 'InProgress' } // or 'Active', depending on your schema
      }),
      // 4. Count Teams
      prisma.team.count(),
      // 5. Get recent logs (only fetch 5 rows, not all!)
      prisma.maintenanceRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { equipment: true } // Include name for the feed
      })
    ]);

    res.json({
      success: true,
      data: {
        activeTickets,
        totalEquipment,
        operationalEquipment,
        totalTeams,
        recentActivity
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Stats failed' });
  }
};
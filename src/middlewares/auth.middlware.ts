import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.db.js";
import { apiError, asyncHandler } from "../libs/index.js";

// Extend Express Request to include user
// You might need to declare this in a types.d.ts file globally in strict setups, 
// but this works for most local setups.
export interface AuthRequest extends Request {
  user?: any;
}

export const verifyJWT = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Get the token from cookies OR header
    const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new apiError(401, "Unauthorized request");
    }

    // 2. Verify Token
    const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET as string);

    // 3. Find User in Postgres (Prisma)
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        avatar: true 
        // We purposefully exclude 'password' here
      }
    });

    if (!user) {
      throw new apiError(401, "Invalid Access Token");
    }

    // 4. Attach user to request object
    req.user = user;
    next();
    
  } catch (error) {
    if(error instanceof Error){
      throw new apiError(401, error?.message || "Invalid access token");
    } 
    console.log(error)
  }
});
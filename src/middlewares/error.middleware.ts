import { Request, Response, NextFunction } from "express";
import { apiError } from "../libs/apiError.js"; // Ensure .js extension for ESM

// Remove the import that is causing the crash:
// import { Prisma } from '@prisma/client' 

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // 1. Handle our custom API Errors
  if (error instanceof apiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }

  // 2. Handle Prisma Errors (Using property checks instead of instanceof)
  // Prisma errors always have a 'code' starting with 'P' and usually a 'clientVersion'
  if (error.code && typeof error.code === 'string' && error.code.startsWith('P')) {
    
    // P2002: Unique constraint failed
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[]) || "Field";
      return res.status(409).json({
        success: false,
        message: `Conflict: ${target} already exists.`,
        errors: [`The ${target} you entered is already in use.`],
      });
    }

    // P2025: Record not found
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
        errors: ["The requested record does not exist."],
      });
    }

    // Handle generic Validation Errors (Prisma usually throws these without a 'P' code, 
    // but often includes 'Argument' in the message)
    if (error.message && error.message.includes('Argument')) {
        return res.status(400).json({
            success: false,
            message: "Database Validation Error",
            errors: ["Invalid data format provided."],
        });
    }
  }

  // 3. Fallback for unexpected Server Errors
  console.error("❌ UNEXPECTED ERROR:", error);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    errors: process.env.NODE_ENV === "development" ? [error.message] : [],
  });
};
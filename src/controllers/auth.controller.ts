import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { apiError, apiResponse, asyncHandler } from "../libs/index.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

// --- REGISTER ---
export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    if (!email || !name || !password) {
      console.log(
        "[auth.controller.ts] [registerUser] Error: Name, Email, and Password are required"
      );
      throw new apiError(400, "Name, Email, and Password are required");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(
        "[auth.controller.ts] [registerUser] Error: User with this email already exists"
      );
      throw new apiError(409, "User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: "1d",
    });

    const { password: _, ...userWithoutPassword } = user;

    return res
      .status(201)
      .cookie("token", token, cookieOptions)
      .json(
        new apiResponse(
          201,
          userWithoutPassword,
          "User registered successfully"
        )
      );
  }
);

// --- LOGIN ---
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    console.log(
      "[auth.controller.ts] [loginUser] Error: Email and password are required"
    );
    throw new apiError(400, "Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log("[auth.controller.ts] [loginUser] Error: User not found");
    throw new apiError(404, "User not found");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    console.log(
      "[auth.controller.ts] [loginUser] Error: Invalid user credentials"
    );
    throw new apiError(401, "Invalid user credentials");
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
    expiresIn: "1d",
  });

  const { password: _, ...userWithoutPassword } = user;

  return res
    .status(200)
    .cookie("token", token, cookieOptions)
    .json(new apiResponse(200, userWithoutPassword, "Login successful"));
});

// --- LOGOUT ---
export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  return res
    .status(200)
    .clearCookie("token", cookieOptions)
    .json(new apiResponse(200, {}, "Logged out successfully"));
});

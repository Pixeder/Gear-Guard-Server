import { Router } from "express";
import { 
  registerUser, 
  loginUser, 
  logoutUser 
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middlware.js";

const authRouter = Router();

// ============================
// Public Routes (No Auth Needed)
// ============================
authRouter.route("/register").post(registerUser);
authRouter.route("/login").post(loginUser);

// ============================
// Secured Routes (JWT Required)
// ============================
authRouter.route("/logout").post(verifyJWT, logoutUser);

export default authRouter;
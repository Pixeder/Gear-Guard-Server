import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlware.js";
import { 
  createTeam, 
  getTeams, 
  addMemberToTeam 
} from "../controllers/team.controller.js";
import { 
  createEquipment, 
  getEquipment 
} from "../controllers/equipment.controller.js";

const router = Router();

// Apply Auth Middleware to all routes (Only logged in users can see this)
router.use(verifyJWT); 

// --- TEAM ROUTES ---
router.route("/teams").post(createTeam);  // Create Team
router.route("/teams").get(getTeams);     // List Teams
router.route("/teams/assign").post(addMemberToTeam); // Add User to Team

// --- EQUIPMENT ROUTES ---
router.route("/equipment").post(createEquipment); // Add Machine
router.route("/equipment").get(getEquipment);     // List Machines

// ... imports
import { 
  createRequest, 
  getRequests, 
  updateRequest 
} from "../controllers/request.controller.js";

// ... Team and Equipment routes ...

// --- MAINTENANCE REQUEST ROUTES ---
router.route("/requests").post(createRequest); // Create Ticket
router.route("/requests").get(getRequests);    // Get List (Kanban/Calendar data)
router.route("/requests/:id").patch(updateRequest); // Update Status/Assign

export default router;
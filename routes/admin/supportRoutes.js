import express from "express";
import * as supportController from "../../controllers/admin/supportController.js";
import { adminAuth } from "../../middlewares/adminAuth.js";

const router = express.Router();

router.get("/", adminAuth, supportController.getAllTickets);
router.get("/ticket/:id", adminAuth, supportController.getTicketDetails);
router.post("/ticket/:id/respond", adminAuth, supportController.respondToTicket);
router.patch("/ticket/:id/status", adminAuth, supportController.updateTicketStatus);

export default router;

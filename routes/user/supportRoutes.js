import express from "express";
import * as supportController from "../../controllers/user/supportController.js";
import { ensureLoggedIn } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", ensureLoggedIn, supportController.getSupportPage);
router.post("/create", ensureLoggedIn, supportController.createTicket);
router.get("/ticket/:id", ensureLoggedIn, supportController.getTicketDetails);
router.post("/ticket/:id/reply", ensureLoggedIn, supportController.replyToTicket);

export default router;

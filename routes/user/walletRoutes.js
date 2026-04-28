import express from "express";
import { getWallet, createTopupOrder, verifyTopupPayment, getTopupFailure } from "../../controllers/user/walletController.js";
import { ensureLoggedIn } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/wallet", ensureLoggedIn, getWallet);
router.post("/wallet/topup/create", ensureLoggedIn, createTopupOrder);
router.post("/wallet/topup/verify", ensureLoggedIn, verifyTopupPayment);
router.get("/wallet/topup/failure", ensureLoggedIn, getTopupFailure);

export default router;

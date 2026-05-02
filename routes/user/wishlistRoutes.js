import express from "express";
import { ensureLoggedIn } from "../../middlewares/authMiddleware.js";
import { getWishlist } from "../../services/user/wishlistService.js";
import * as wishlistController from "../../controllers/user/wishlistController.js"
const router= express.Router();

router.get("/", ensureLoggedIn, wishlistController.renderWishlistPage);
router.get("/data", ensureLoggedIn, wishlistController.getWishlist);

router.post("/toggle", ensureLoggedIn, wishlistController.toggleWishlist);
router.post("/add", ensureLoggedIn, wishlistController.addToWishlist);
router.post("/remove", ensureLoggedIn, wishlistController.removeFromWishlist);
router.post("/move-to-cart", ensureLoggedIn, wishlistController.moveToCart);
router.post("/move-all-to-cart", ensureLoggedIn, wishlistController.moveAllToCart);

export default router;
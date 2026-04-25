import express from "express"
import { applyCoupon , removeCoupon } from "../../controllers/user/couponController.js";
const router = express.Router();

router.post("/apply-coupon",applyCoupon)
router.post("/remove-coupon",removeCoupon)


export default router;
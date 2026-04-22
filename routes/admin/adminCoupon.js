import express from "express"
import {createCoupon , getCoupon , updateCoupon , toggleCouponStatus, getCouponPage, deleteCoupon} from "../../controllers/admin/couponController.js"
const router= express.Router();

router.get("/marketing/coupons", getCouponPage)
router.get("/marketing/coupons/data", getCoupon)
router.post("/marketing/coupons",createCoupon)
router.put("/marketing/coupons/:id",updateCoupon)
router.patch("/marketing/coupons/:id/status",toggleCouponStatus)
router.delete("/marketing/coupons/:id", deleteCoupon)

export default router;
import express from "express";
import { success } from "zod";
import { fa } from "zod/locales";
import { applyCouponService,removeCouponService } from "../../services/user/couponService.js";


export const applyCoupon = async(req,res)=>{
    try{
        const {code}=req.body
        const userId=req.session.user;

        const result = await applyCouponService(userId,code)
        
    return res.json({
        success:true,
        message:"Coupon Applied Successfuly",
        data:"Result"
    })


    }catch(error){
        return res.status(400).json({
            success:false,
            message:error.message
        })
    }
}




export const removeCoupon = async (req, res) => {
    try {
        const userId = req.session.user;

        const result = await removeCouponService(userId);

        return res.json({
            success: true,
            message: "Coupon removed",
            data: result
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
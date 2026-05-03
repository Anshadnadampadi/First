import * as reviewService from "../../../services/user/reviewService.js";

export const submitReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.session.user;

        console.log(`[REVIEW_SUBMIT] User: ${userId}, Product: ${productId}, Rating: ${rating}`);

        // 1. Basic Validation
        if (!productId || !rating || !comment) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ success: false, message: "Please provide a valid rating between 1 and 5 stars" });
        }

        if (comment.trim().length < 10) {
            return res.status(400).json({ success: false, message: "Review comment must be at least 10 characters long" });
        }

        // 2. Purchase Verification (STRICT)
        const canReview = await reviewService.canUserReview(userId, productId);
        if (!canReview) {
            return res.status(403).json({ 
                success: false, 
                message: "Review access restricted. You can only review products you have purchased and received." 
            });
        }

        // 3. Save Review
        const review = await reviewService.addReview(userId, productId, {
            rating: ratingNum,
            comment: comment.trim(),
            images: []
        });

        console.log(`[REVIEW_SUCCESS] Review ID: ${review._id}`);

        res.json({ 
            success: true, 
            message: "Thank you! Your verified review has been published.",
            review 
        });

    } catch (error) {
        console.error("Submit Review Error:", error);
        res.status(500).json({ success: false, message: "An unexpected error occurred while publishing your review" });
    }
};

export const getReviews = async (req, res) => {
    try {
        const productId = req.params.id; // Corrected from req.params.productId
        console.log(`[REVIEW_FETCH] Product ID: ${productId}`);
        const reviews = await reviewService.getProductReviews(productId);
        const stats = await reviewService.getAverageRating(productId);

        res.json({ success: true, reviews, stats });
    } catch (error) {
        console.error("Get Reviews Error:", error);
        res.status(500).json({ success: false, message: "Failed to load reviews" });
    }
};

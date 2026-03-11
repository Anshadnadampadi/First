// simple session‑based authentication helpers

/**
 * Ensure the user is logged in before allowing access to the route.
 * If not authenticated, redirect to the login page (or send 401 for API).
 */
export const ensureLoggedIn = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    // web request – send to login
    return res.redirect('/login');
};

/**
 * Prevent logged in users from accessing routes like signup/login.
 * If they are already authenticated, send them to the home page.
 */
export const ensureLoggedOut = (req, res, next) => {
    if (req.session && req.session.user) {
        return res.redirect('/');
    
    }
    next();
};


// example usage in routes:
// import { ensureLoggedIn, ensureLoggedOut } from '../middlewares/authMiddleware.js';
//
// router.get('/profile', ensureLoggedIn, userProfileHandler);
// router.get('/signup', ensureLoggedOut, getSignup);


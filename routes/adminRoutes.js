import express from 'express';
import { getAdminLogin,
      postAdminLogin, 
      getAdminDashboard
     ,getAdminManagement,
     adminLogout,
    
        postBlock,
        postUnblock,
        postDelete,
        postEdit
     } from '../controllers/admin/adminControlller.js';
const router = express.Router();
import { adminAuth } from '../middlewares/adminAuth.js';


// Admin Login Routes
router.get('/login', getAdminLogin);
router.post('/login', postAdminLogin);
router.get('/management', getAdminManagement);
router.get('/dashboard',adminAuth, getAdminDashboard);

// router.get('/login',adminLogin,adminController.getAdminLogin)
// router.get('/dashboard',adminSession,adminController.getAdminDashboard)
router.get('/logout',adminLogout)
router.post('/block/:id',postBlock)
router.post('/unblock/:id',postUnblock)
router.post('/delete/:id',postDelete)
router.post('/edit',postEdit)



export default router;
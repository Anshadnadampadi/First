import express from 'express';
import { getSalesReportPage, downloadSalesReport } from '../../controllers/admin/salesReportController.js';
import adminAuth from '../../middlewares/adminAuth.js';

const router = express.Router();

router.use(adminAuth);

router.get('/sales-report', getSalesReportPage);
router.get('/sales-report/download', downloadSalesReport);

export default router;

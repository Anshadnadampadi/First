import bcrypt from 'bcryptjs';
import { adminLogin} from '../../services/admin/adminServices.js';
import {
    getDashboardUsersService,
    blockUserService,
    unblockUserService,
    deleteUserService,
    editUserService 
} from '../../services/admin/adminServices.js';
import {
    getAdminDashboardStats,
    getDashboardChartData
} from '../../services/admin/dashboardService.js';


export const getAdminLogin = (req, res) => {

    
    if (req.session && req.session.admin) {
        return res.redirect('/admin/dashboard');
    }

    const { msg, icon } = req.query;

    res.render('admin/auth/login', {
        title: 'Admin Login',
        error: null,
        layout: false,
        msg: msg || null,
        icon: icon || null
    });
};

export const postAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await adminLogin({ email, password });

    if (!result.success) {
      return res.render("admin/auth/login", {
        title: "Admin Login",
        error: result.message,
        layout: false
      });
    }

    // Create admin session
    req.session.admin = {
      _id: result.admin._id,
      email: result.admin.email,
      role: "admin"
    };

    // Explicitly save session before redirect to guarantee persistence
    req.session.save((err) => {
      if (err) {
        console.error("[ADMIN LOGIN] Session save failure:", err);
        return res.status(500).render("admin/auth/login", {
          title: "Admin Login",
          error: "Session initialization failed. Please try again.",
          layout: false
        });
      }
      return res.redirect("/admin/dashboard");
    });

  } catch (error) {
    console.log(error);
    return res.status(500).render("admin/auth/login", {
      title: "Admin Login",
      error: "Server error",
      layout: false
    });
  }
};

export const getAdminDashboard = async (req, res) => {
    try {
        const stats = await getAdminDashboardStats();
        const { msg, icon } = req.query;
        
        res.render('admin/dashboard', { 
            title: 'Admin Dashboard', 
            stats, 
            breadcrumbs: [
                { label: 'Dashboard', url: '/admin/dashboard' }
            ],
            msg: msg || null, 
            icon: icon || null 
        });
    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        res.status(500).send("Server Error");
    }
};

export const getChartData = async (req, res) => {
    try {
        const { filter = 'monthly', startDate, endDate } = req.query;
        const { labels, data } = await getDashboardChartData({ filter, startDate, endDate });
        res.json({ success: true, labels, data });
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const getAdminManagement = async (req, res) => {
    try {
        const { msg, icon } = req.query;
        const rawSearch = typeof req.query.search === 'string' ? req.query.search : '';
        const rawStatus = typeof req.query.status === 'string' ? req.query.status : '';

        const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'createdAt';
        const sortOrder = typeof req.query.sortOrder === 'string' ? req.query.sortOrder : 'desc';

        const pageQuery = parseInt(req.query.page, 10);
        const limitQuery = parseInt(req.query.limit, 10);
        
        const page = Number.isFinite(pageQuery) && pageQuery > 0 ? pageQuery : 1;
        const limit = Number.isFinite(limitQuery) && limitQuery > 0 ? limitQuery : 4;
        const search = rawSearch.trim();
        const status = rawStatus === 'active' || rawStatus === 'blocked' ? rawStatus : '';

        if (req.query.clear === '1') {
            const clearParams = new URLSearchParams();
            if (status) clearParams.set('status', status);
            clearParams.set('page', '1');
            clearParams.set('limit', String(limit));
            return res.redirect(`/admin/customers?${clearParams.toString()}`);
        }

        const data = await getDashboardUsersService(
            search,
            page,
            limit,
            status,
            sortBy,
            sortOrder
        );

        // Build query string for pagination
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (status) queryParams.set('status', status);
        if (sortBy) queryParams.set('sortBy', sortBy);
        if (sortOrder) queryParams.set('sortOrder', sortOrder);
        const queryString = queryParams.toString();

        const clearParams = new URLSearchParams();
        if (status) clearParams.set('status', status);
        clearParams.set('page', '1');
        clearParams.set('limit', String(limit));
        const clearSearchUrl = `/admin/customers?${clearParams.toString()}`;

        res.render('admin/customers', {
            title: 'Customers',
            msg,
            icon,
            customers: data.users,
            currentPage: page,
            totalPages: data.totalPages,
            limit,
            totalUsers: data.totalUsers,
            search,
            status,
            sortBy,
            sortOrder,
            query: queryString,
            breadcrumbs: [
                { label: 'Customers', url: '/admin/customers' }
            ],
            clearSearchUrl
        });

    } catch (error) {
        console.log(error);
        res.redirect('/admin/customers?msg=Session Error&icon=error');
    }
};

export const postBlock = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`[ACL COMMAND] Admin initiating block for User ID: ${id}`);
        const result = await blockUserService(id);
        
        if (!result.success) {
            if (req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ success: false, message: "Could not restrict user." });
            }
            return res.redirect("/admin/customers?msg=Error blocking user&icon=error");
        }

        if (req.headers.accept?.includes('application/json')) {
            return res.json({ success: true, message: "User identity has been restricted." });
        }
        res.redirect("/admin/customers?msg=User blocked&icon=success");
    } catch (err) {
        console.log(err);
        if (req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ success: false, message: "Protocol failure: Could not restrict user." });
        }
        res.redirect("/admin/customers?msg=Error blocking user&icon=error");
    }
};

export const postUnblock = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await unblockUserService(id);

        if (!result.success) {
            if (req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ success: false, message: "Could not restore user." });
            }
            return res.redirect("/admin/customers?msg=Error unblocking user&icon=error");
        }

        if (req.headers.accept?.includes('application/json')) {
            return res.json({ success: true, message: "User identity has been restored." });
        }
        res.redirect("/admin/customers?msg=User unblocked&icon=success");
    } catch (err) {
        console.log(err);
        if (req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ success: false, message: "Protocol failure: Could not restore user." });
        }
        res.redirect("/admin/customers?msg=Error unblocking user&icon=error");
    }
};

export const postDelete = async (req, res) => {
    try {
        const result = await deleteUserService(req.params.id);
        if (!result.success) {
            if (req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ success: false, message: result.message || 'Invalid User' });
            }
            return res.redirect('/admin/management?msg=Invalid User&icon=error');
        }
        
        if (req.headers.accept?.includes('application/json')) {
            return res.json({ success: true, message: "User record purged from matrix." });
        }
        res.redirect('/admin/customers?msg=User Deleted Successfully&icon=success');
    } catch (error) {
        console.log(error);
        if (req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ success: false, message: "Internal record failure." });
        }
        res.redirect('/admin/customers?msg=Delete Failed&icon=error');
    }
};

export const postEdit = async (req, res) => {
    const { name, email, id } = req.body;
    const result = await editUserService(id, name, email);
    if (!result.success) {
        return res.redirect('/admin/management?msg=Invalid User&icon=error');
    }
    res.redirect('/admin/customers?msg=User Edit Successfully&icon=success');
};

export const adminLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error("Admin logout session destruction error:", err);
        res.clearCookie("adminSid", { path: '/admin' });
        res.redirect("/admin/login");
    });
};








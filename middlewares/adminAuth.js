

export const adminAuth = (req, res, next) => {
   if(!req.session.admin){
    return res.redirect('/admin/login');
   }
    next();
   }
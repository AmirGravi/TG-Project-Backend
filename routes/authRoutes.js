const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');


// چک کاربر
router.post('/check-user', authController.checkUser);
// ثبت‌نام
router.post('/register', authController.register);
// تایید ایمیل
router.post('/verifyCode', authController.verifyCode);
// ورود
router.post('/login',   authController.login);



// بررسی وضعیت تایید ایمیل
// router.get('/check-verification', authController.checkVerification);

// ورود ادمین
// router.post('/admin/login', authController.login);



// داشبورد ادمین (با توکن)
// router.get('/admin/dashboard', authenticateToken, authController.dashboard);


module.exports = router;

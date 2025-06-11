// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const transporter = require('../config/mailer');
const VerificationCode = require('../models/VerificationCode') // اگه جدا کردی
const crypto = require('crypto')


exports.checkUser = async (req, res) => {
    const { emailOrPhone } = req.body
    try {
        const user = await User.findOne({ email: emailOrPhone })

        if (user) {
            return res.json({ exists: true, isVerified: user.isVerified })
        }

        const generateCode = () => {
            return crypto.randomInt(100000, 1000000).toString();
        };

        const code = generateCode();
        console.log(code)
        // کاربر وجود نداشت → ارسال کد تأیید
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: emailOrPhone,
            subject: 'کد تأیید ثبت‌نام',
            html: `<p>کد تأیید شما: <strong>${code}</strong></p>`
        })

        // ذخیره در دیتابیس
        await VerificationCode.findOneAndUpdate(
            { emailOrPhone },
            { code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) }, // 5 دقیقه اعتبار
            { upsert: true }
        )

        res.json({ exists: false, message: 'کد تأیید ارسال شد.' })

    } catch (err) {
        res.status(500).json({ error: 'خطا در بررسی کاربر یا ارسال کد' })
    }
}

exports.verifyCode = async (req, res) => {
    const { emailOrPhone, code } = req.body

    try {
        console.log(code)
        const record = await VerificationCode.findOne({ emailOrPhone, code })

        if (!record) return res.status(400).json({ message: 'کد اشتباه است' })

        if (record.expiresAt < new Date()) {
            return res.status(400).json({ message: 'کد منقضی شده است' })
        }

        res.json({ success: true, message: 'کد درست است' })
    } catch (err) {
        res.status(500).json({ error: 'خطا در بررسی کد' })
    }
}

exports.register = async (req, res) => {
    const { emailOrPhone, password, name } = req.body

    try {
        const existing = await User.findOne({ email: emailOrPhone })
        if (existing) return res.status(400).json({ message: 'کاربر قبلاً ثبت شده' })

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = new User({
            name,
            email: emailOrPhone,
            password: hashedPassword,
            isVerified: true,
            role: 'user'
        })

        await user.save()

        // پاک کردن کد تأیید بعد از ثبت‌نام
        await VerificationCode.deleteOne({ emailOrPhone })
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.status(201).json({ message: 'ثبت‌نام موفق بود' , token })
    } catch (err) {
        res.status(500).json({ error: 'خطا در ثبت‌نام' })
    }
}

// exports.verifyEmail = async (req, res) => {
//     const { token } = req.query;
//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const email = decoded.email;
//
//         const user = await User.findOne({ email });
//         if (!user) return res.status(404).json({ message: 'کاربر پیدا نشد.' });
//
//         if (user.isVerified) return res.status(400).json({ message: 'کاربر قبلاً تایید شده.' });
//
//         user.isVerified = true;
//         await user.save();
//         return res.redirect('http://localhost:5173/verify'); // آدرس صفحه تایید ایمیل فرانت
//     } catch (err) {
//         res.status(400).json({ message: 'توکن نامعتبر یا منقضی شده است.' });
//     }
// };

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'کاربر پیدا نشد' });

        if (!user.isVerified) return res.status(403).json({ success: false, message: 'ایمیل تایید نشده است.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'رمز اشتباه است.' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ success: true, token, message: 'ورود موفق' });
    } catch (err) {
        res.status(500).json({ message: 'خطای سرور', error: err.message });
    }
};


// exports.loginAdmin = async (req, res) => {
//     const { username, password } = req.body;
//     try {
//         const admin = await User.findOne({ name: username, role: 'admin' });
//         if (admin && await bcrypt.compare(password, admin.password)) {
//             const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
//             res.json({ success: true, message: 'ورود موفق', token });
//         } else {
//             res.json({ success: false, message: 'نام کاربری یا رمز اشتباه' });
//         }
//     } catch (err) {
//         res.status(500).json({ message: 'خطای سرور', error: err.message });
//     }
// };
//
// exports.dashboard = (req, res) => {
//     res.json({
//         totalUsers: 50,
//         totalMessages: 200,
//         admin: req.user
//     });
// };
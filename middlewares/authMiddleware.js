//  میدلور برای احراز هویت
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// بررسی اینکه توکن معتبر هست و کاربر کیه
exports.authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    console.log(authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer '))
        return res.status(401).json({ message: 'توکن ارسال نشده' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // ذخیره اطلاعات کاربر در req
        next();
    } catch (err) {
        res.status(401).json({ message: 'توکن نامعتبر است' });
    }
};

// بررسی اینکه آیا کاربر نقش مناسب دارد یا نه
exports.authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ message: 'احراز هویت نشده' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'شما اجازه دسترسی ندارید' });
        }

        next();
    };
};

const bcrypt = require('bcrypt');
const User = require('../models/User');

const createInitialAdmin = async () => {
    const name = 'Admin';
    const email = 'graviamir@gmail.com';
    const password = 'Amir1377@';

    try {
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('ادمین اولیه قبلاً ساخته شده.');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = new User({
            name,
            email,
            password: hashedPassword,
            role: 'admin'
        });

        await admin.save();
        console.log('ادمین اولیه ساخته شد.');
    } catch (err) {
        console.error('خطا در ساخت ادمین:', err);
    }
};

// 🔥 نکته مهم: باید اینو export کنی
module.exports = createInitialAdmin;

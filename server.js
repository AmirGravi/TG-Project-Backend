const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
const app = express();
const PORT = 5000;
const baseUrl = `http://localhost:5000`; // آدرس سرور
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// اتصال به دیتابیس
mongoose.connect('mongodb://localhost:27017/mydatabase2', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
// ایجاد نودمیلر برای ارسال ایمیل
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'graviamir1377@gmail.com',
        pass: 'xnazcnakhdybnojq' // یا از OAuth استفاده کن
    }
});





// مدل محصول
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String,
    images: { type: [String], default: [] },
    colors: [{ color: String, name: String }],
    sizes: [String],
    quantity: { type: Number, required: true, default: 0 } // تعداد محصول
    ,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }, // رفرنس به دسته‌بندی
    createdAt: { type: Date, default: Date.now },

});
// اسکیمای دسته بندی محصول
const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // ارجاع به دسته‌بندی والد
    image: {type: String, default: null},
});



// اسکیمای کاربر
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

const User = mongoose.model('User' , userSchema)

const Category = mongoose.model('Category' , CategorySchema)

const Product = mongoose.model('Product', productSchema);

// تنظیمات ذخیره‌سازی (به عنوان مثال، ذخیره‌سازی در دایرکتوری uploads)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// ایجاد نمونه Multer
const upload = multer({ storage }) // تغییر به single

// ساخت ادمین اولیه
const createInitialAdmin = async () => {
    const name = 'Admin';
    const email = 'graviamir@gmail.com';
    const password = 'Amir1377@';

    try {
        // بررسی وجود ادمین اولیه
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('ادمین اولیه قبلاً ایجاد شده است.');
            return;
        }

        // اگر ادمین وجود ندارد، ایجاد می‌شود
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = new User({
            name,
            email,
            password: hashedPassword,
            role: 'admin'
        });

        await admin.save();
        console.log('ادمین اولیه با موفقیت ایجاد شد.');
    } catch (error) {
        console.error('خطا در ایجاد ادمین اولیه:', error);
    }
};
// فراخوانی تابع
createInitialAdmin();


// میان افزار برای ورود ادمین
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // دریافت توکن از هدر

    if (!token) return res.status(401).json({ message: 'توکن احراز هویت نیاز است.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'توکن نامعتبر است.' });
        req.user = user; // اطلاعات کاربر در req ذخیره می‌شود
        next();
    });
};


app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // پیدا کردن کاربر در دیتابیس
        const admin = await User.findOne({ name: username, role: 'admin' });

        // بررسی وجود کاربر و مطابقت رمز عبور
        if (admin && (await bcrypt.compare(password, admin.password))) {
            // ایجاد توکن (اختیاری، برای امنیت بیشتر می‌توانید JWT اضافه کنید)
            // / ایجاد توکن JWT
            const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({
                success: true, message: 'ورود موفقیت‌آمیز!', token });
        } else {
            res.json({ success: false, message: 'نام کاربری یا رمز عبور اشتباه است' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'خطایی در سرور رخ داده است' });
    }
});

app.get('/api/admin/dashboard', authenticateToken, (req, res) => {
    const stats = {
        totalUsers: 50,
        totalMessages: 200,
        admin: req.user // اطلاعات ادمین لاگین شده
    };
    res.json(stats);
});




// کاربر ها
// ایجاد کاربر
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {

        // ۱. هش کردن پسورد
        const hashedPassword = await bcrypt.hash(password, 10);

        // ۲. ذخیره کاربر در دیتابیس
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        // ۳. ایجاد لینک تأیید
        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const verificationLink = `http://localhost:5000/api/verify?token=${verificationToken}`;

        // ۴. ارسال ایمیل تأیید
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'تایید ایمیل برای ثبت نام در سایت',
            html: `<h2>سلام  ${name} کاربر عزیز </h2>
                   <p>لطفا روی لینک زیر کلیک کنید تا ثبت نام شما در سایت تایید شود .</p>
                   <a href="${verificationLink}">تایید ایمیل</a>`,
        });

        res.status(201).json({ message: 'User registered! Please verify your email.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// تایید ایمیل
app.get('/api/verify', async (req, res) => {
    const { token } = req.query;

    try {
        // بررسی صحت توکن
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;

        // جستجو و بروزرسانی کاربر
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User already verified' });
        }

    
        user.isVerified = true;
        await user.save();
        // هدایت به URL مورد نظر
        return res.redirect('http://localhost:5173/verify'); // آدرس صفحه موفقیت
        res.status(200).json({ message: 'Email successfully verified!' });
    } catch (err) {
        res.status(400).json({ message: 'Invalid or expired token', error: err.message });
    }
});



// بررسی وضعیت تایید ایمیل
app.get('/api/check-verification', async (req, res) => {
    const { email } = req.query;

    

    try {
        // اطمینان از وجود ایمیل در درخواست
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // جستجو در دیتابیس
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // ارسال وضعیت تایید
        res.status(200).json({ isVerified: user.isVerified });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


// ایجاد دسته‌بندی
app.post('/api/categories', upload.single('image'), async (req, res) => {
    try {
        const { name, description, parent } = req.body;

        // بررسی وجود والد (در صورت وجود)
        if (parent && parent !== '') {
            const parentCategory = await Category.findById(parent);
            if (!parentCategory) {
                return res.status(400).json({ message: 'دسته‌بندی والد پیدا نشد.' });
            }
        }

        // اگر parent خالی باشد، آن را به null تغییر می‌دهیم
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // URL تصویر آپلود شده

        const newCategory = new Category({
            name,
            description,
            parent: parent && parent !== '' ? parent : null,
            image: imageUrl, // ذخیره لینک تصویر
        });

        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ message: 'خطا در ایجاد دسته‌بندی', error });
    }
});

// دریافت دسته‌بندی‌ها با ساختار درختی
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find().lean();

        // تبدیل لیست به ساختار درختی
        const buildTree = (categories, parent = null) => {
            return categories
                .filter(cat => String(cat.parent) === String(parent))
                .map(cat => ({
                    ...cat,
                    children: buildTree(categories, cat._id)
                }));
        };

        const categoryTree = buildTree(categories);
        res.json(categoryTree);
    } catch (error) {
        res.status(500).json({ message: 'خطا در دریافت دسته‌بندی‌ها', error });
    }
});

// ویرایش دسته‌بندی
app.put('/api/categories/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, parent } = req.body;

        // بررسی وجود دسته‌بندی
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'دسته‌بندی با این ID یافت نشد.' });
        }

        // اگر گزینه "بدون دسته‌بندی" انتخاب شده باشد
        if (parent === 'none') {
            category.parent = null; // حذف والد
        }

        // بررسی اینکه والد خودش فرزند نداشته باشد
        if (parent && parent !== '' && parent !== 'none' && parent !== id) {
            const parentCategory = await Category.findById(parent);
            if (!parentCategory) {
                return res.status(400).json({ message: 'دسته‌بندی والد پیدا نشد.' });
            }

            // بررسی اینکه والد جدید خودش فرزند دارد
            const isParentHasChildren = await Category.exists({ parent: id });
            if (isParentHasChildren) {
                return res.status(400).json({
                    message: 'این دسته‌بندی نمی‌تواند به‌عنوان والد انتخاب شود، زیرا خودش دارای زیرمجموعه است.'
                });
            }
        }

        // بررسی اینکه یک دسته‌بندی نمی‌تواند والد خودش باشد
        if (parent === id) {
            return res.status(400).json({ message: 'یک دسته‌بندی نمی‌تواند والد خودش باشد.' });
        }

        // به‌روزرسانی فیلدها
        category.name = name || category.name;
        category.description = description || category.description;
        category.parent = parent && parent !== '' && parent !== 'none' ? parent : null;

        // به‌روزرسانی تصویر
        if (req.file) {
            const imagePath = `/uploads/${req.file.filename}`;
            category.image = imagePath;
        }

        // ذخیره تغییرات
        const updatedCategory = await category.save();
        res.json({
            message: 'دسته‌بندی با موفقیت به‌روزرسانی شد.',
            category: updatedCategory
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'خطا در ویرایش دسته‌بندی', error });
    }
});



// حذف دسته‌بندی
app.delete('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // بررسی وجود دسته‌بندی
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'دسته‌بندی با این ID یافت نشد.' });
        }

        // بررسی وابستگی به دسته‌بندی‌های فرزند
        const childCategories = await Category.find({ parent: id });
        if (childCategories.length > 0) {
            return res.status(400).json({
                message: 'این دسته‌بندی دارای زیرشاخه است و نمی‌توان آن را حذف کرد.'
            });
        }

        // حذف دسته‌بندی
        await category.deleteOne();

        res.json({ message: 'دسته‌بندی با موفقیت حذف شد.' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'خطا در حذف دسته‌بندی', error });
    }
});









// برای جستجو در محصولات
app.get('/api/products/search', async (req, res) => {
    const searchQuery = req.query.query; // دریافت پارامتر query از URL

    try {
        // جستجو در فیلد name (یا هر فیلدی که مربوط به محصول است)
        const products = await Product.find({
            name: { $regex: searchQuery, $options: 'i' } // تطابق متن با حساسیت کمتر به حروف کوچک/بزرگ
        });

        // ارسال نتایج به کلاینت
        res.json(products);
    } catch (error) {
        console.error('خطا در جستجوی محصول:', error);
        res.status(500).json({
            message: 'خطا در دریافت محصول',
            error
        });
    }
});


// افزودن محصول
app.post('/api/products', upload.fields([
    { name: 'images[]', maxCount: 10 },
    { name: 'colors[]', maxCount: 10 },
    { name: 'sizes[]', maxCount: 10 }
]), async (req, res) => {
    const { name, price, description, colors, sizes, quantity, category } = req.body;


    // تبدیل رنگ‌ها و سایزها به آرایه‌ها
    const parsedColors = JSON.parse(colors);
    const parsedSizes = JSON.parse(sizes);

    // ذخیره لینک‌های تصاویر
    const imagePaths = req.files['images[]'] ? req.files['images[]'].map(file => `${baseUrl}/uploads/${file.filename}`) : [];

    console.log('Category:', category);  // بررسی مقدار category

    // بررسی اینکه آیا دسته‌بندی ارسال شده است یا نه
    if (!category) {
        return res.status(400).json({ message: 'دسته‌بندی محصول مشخص نشده است.' });
    }
    const categoryObj = await Category.findById(category);
    if (!categoryObj) {
        return res.status(400).json({ message: 'دسته‌بندی معتبر نیست.' });
    }
    
    console.log(req.body);  // بررسی داده‌های ارسال‌شده





    const product = new Product({
        name,
        price,
        description,
        images: imagePaths,
        colors: parsedColors,   // رنگ‌ها به صورت آرایه از اشیاء
        sizes: parsedSizes,      // سایزها به صورت آرایه
        quantity: parseInt(quantity), // تبدیل مقدار به عدد
        category: categoryObj._id,  // ذخیره دسته‌بندی انتخاب شده
    });

    try {
        await product.save();
        res.status(201).json({ message: 'محصول شما با موفقیت اضافه شد.'});
    } catch (error) {
        res.status(500).json({ message: 'مشکلی در بارگذاری محصول وجود داشت.', error });
    }
});

// API برای دریافت همه محصولات
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'خطا در دریافت محصولات', error });
    }
});
// API برای حذف محصول
app.delete('/api/products/:id', async (req, res) => {
    try {
        console.log('Delete request received for ID:', req.params.id);
        const { id } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({ message: 'محصولی با این ID یافت نشد.' });
        }

        res.json({ message: 'محصول با موفقیت حذف شد.' });
    } catch (error) {
        res.status(500).json({ message: 'خطا در حذف محصول', error });
    }
});
// API برای دریافت یک محصول خاص
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: 'محصولی با این ID یافت نشد.' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'خطا در دریافت محصول', error });
    }
});
// API برای به‌روزرسانی  و ویرایش محصول
app.put('/api/products/:id', upload.fields([
    { name: 'images[]', maxCount: 10 },
    { name: 'colors[]', maxCount: 10 },
    { name: 'sizes[]', maxCount: 10 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description, quantity, category } = req.body;


       


        // پردازش تصاویر
        const imagePaths = req.files['images[]']
            ? req.files['images[]'].map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`)
            : [];

        // پردازش رنگ‌ها
        const colors = req.body['colors[]'] || req.body['colors'] || [];
        const parsedColors = Array.isArray(colors)
            ? colors.map(color => {
                try {
                    return typeof color === 'string' ? JSON.parse(color) : color;
                } catch (error) {
                    console.error('Error parsing color:', color, error);
                    return null;
                }
            }).filter(color => color !== null)
            : [];

        // پردازش سایزها
        const sizes = req.body['sizes[]'] || req.body['sizes'] || [];

       

        // یافتن محصول فعلی
        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.status(404).json({ message: 'محصولی با این ID یافت نشد.' });
        }

        if (category) {
            // بررسی صحت دسته‌بندی
            const categoryObj = await Category.findById(category);
            if (!categoryObj) {
                return res.status(400).json({ message: 'دسته‌بندی معتبر نیست.' });
            }
            existingProduct.category = categoryObj._id;  // به‌روزرسانی دسته‌بندی
        }
        
        // مدیریت رنگ‌ها
        if (parsedColors.length > 0) {
            existingProduct.colors = parsedColors; // جایگزینی مستقیم
        }

        // مدیریت سایزها
        if (sizes.length > 0) {
            existingProduct.sizes = sizes; // جایگزینی مستقیم
        }

        // به‌روزرسانی سایر فیلدها
        if (name) existingProduct.name = name;
        if (price) existingProduct.price = price;
        if (description) existingProduct.description = description;
        if (imagePaths.length > 0) existingProduct.images = [...existingProduct.images, ...imagePaths];
        // موجودی محصول
        if (quantity !== undefined) existingProduct.quantity = quantity; 
        // ذخیره تغییرات
        const updatedProduct = await existingProduct.save();

        console.log('Request Body:', req.body);
        console.log('Files:', req.files);
        console.log('Updated Product:', updatedProduct);

        res.json({ message: 'محصول با موفقیت به‌روزرسانی شد.', product: updatedProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'خطایی در به‌روزرسانی محصول رخ داد.', error });
    }
});






app.delete('/api/images/:imageId', async (req, res) => {
    const imageId = req.params.imageId; // این مقدار باید نام فایل باشد
    const imagePath = path.join(__dirname, 'uploads', imageId);

    // ساخت آدرس کامل تصویر
    const fullImagePath = `http://localhost:5000/uploads/${imageId}`;

    console.log(`Attempting to delete image: ${fullImagePath}`);

    try {
        // بررسی وجود تصویر در دیتابیس
        const productToUpdate = await Product.findOne({ images: { $regex: imageId } });

        if (!productToUpdate) {
            console.log('Image not found in database');
            return res.status(404).send('Image not found in database');
        }

        // حذف تصویر از سیستم فایل
        if (fs.existsSync(imagePath)) {
            await fs.promises.unlink(imagePath);
            console.log('Image deleted successfully from file system');
        } else {
            console.log('Image not found on file system');
            return res.status(404).send('Image not found on file system');
        }

        // حذف تصویر از آرایه تصاویر محصول در دیتابیس
        await Product.updateOne(
            { _id: productToUpdate._id },
            { $pull: { images: fullImagePath } } // آدرس کامل تصویر
        );

        res.status(200).send('Image deleted from both file system and database');
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).send('Error deleting image');
    }
});



app.post('/upload', upload.single('file'), (req, res) => {
    res.send('File uploaded successfully');
});






// شروع سرور
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

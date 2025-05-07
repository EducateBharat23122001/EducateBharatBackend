const express = require('express');
const app = express();
require('dotenv').config();
const path = require("path");
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

const port = process.env.PORT || 4000;

// SCHEMAS
require('./MODELS/UserSchema');
require('./MODELS/AdminSchema');
require('./MODELS/CourseSchema');
require('./MODELS/SubjectSchema');
require('./MODELS/ChapterSchema');
require('./MODELS/MediaSchema');
require('./MODELS/Quiz/ChapterQuizSchema');
require('./MODELS/Quiz/SubjectQuizSchema');
require('./MODELS/Quiz/CourseQuizSchema');
require('./MODELS/Quiz/QuestionSchema');
require('./MODELS/ProductSchema')
require('./MODELS/OrderSchema');
require('./MODELS/BannerSchema');
require('./MODELS/ExtrasSchema');

require('./MODELS/PurchasesSchema');
// 

const routes = require('./routes');
const userRoutes = require('./ROUTES/userRoutes');
const courseRoutes = require('./ROUTES/courseRoutes');
const chapterRoutes = require('./ROUTES/chapterRoutes');
// const mediaRoutes = require('./ROUTES/mediaRoutes');
const quizRoutes = require('./ROUTES/quizRoutes');
const productRoutes = require('./ROUTES/productRoutes');
const bannerRoutes = require('./ROUTES/bannerRoutes');
const extrasRoutes = require('./ROUTES/extrasRoutes');

const adminRoutes = require('./ROUTES/adminRoutes');

const { uploadFile } = require("./ROUTES/s3");

// const multer = require('multer');
// const subjectRoutes = require('./ROUTES/subjectRoutes');
const bodyParser = require('body-parser');
const cors = require('cors');

require('./db');



app.use(cors({
    origin: '*'
}));
app.use(bodyParser.json());



// ROUTES
app.use(routes)
app.use(userRoutes)
app.use(courseRoutes)
app.use(chapterRoutes)
app.use(quizRoutes)
app.use(productRoutes)
app.use(bannerRoutes)
app.use(extrasRoutes)


app.use(adminRoutes)
// app.use("/api/v1/media", mediaRoutes);
app.use("/public", express.static(path.join(__dirname, "public")));
// app.use(subjectRoutes)





app.get('/', (req, res) => res.send('Hello World!'));



app.post('/sendotp', async (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: 'Email is required' });

    const otp = otpGenerator.generate(4, { digits: true, upperCase: false, specialChars: false });

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent successfully', otp }); // Send OTP back only for dev/testing
    } catch (error) {
        console.log('FAILED TO SEND OTP ', error);
        res.status(500).json({ message: 'Failed to send OTP', error });
    }
});




app.listen(port, () => console.log(`Express app running on port ${port}!`));
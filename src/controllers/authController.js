const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');

/**
 * @desc    Register new user (with OTP email verification)
 * @route   POST /api/auth/register
 */
const registerUser = async (req, res) => {
    const { username, email,  password, confirmPassword } = req.body;

    try {
        // 1. Basic validation
        if ( !username || !email ||  !password || !confirmPassword) {
            return res.status(400).json({ message: 'Email, username, password are required' });
        }

        // 1.5 Confirm password match
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Password and confirm password do not match' });
        }

        // 2. Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // 3. Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 4. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Generate OTP
        const otp = generateOTP();

        // 6. Create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            isVerified: false,
            otp,
            otpExpires: Date.now() + 5 * 60 * 1000 // 10 minutes
        });

        // 7. Send OTP email
        await sendEmail(
            email,
            'Verify your HireNova account',
            `Your OTP for HireNova email verification is: ${otp}`
        );

        res.status(201).json({
            message: 'Registration successful. Please verify your email using the OTP sent.'
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Verify email using OTP
 * @route   POST /api/auth/verify-email
 */

const verifyEmail = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        if (
            !otp ||
            otp.length !== 6 ||
            user.otp !== otp.trim() ||
            user.otpExpires < Date.now()
        ) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        
        res.json({
            message: "Email verified successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

    

const resendOtp = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Email already verified" });
        }

        const newOtp = generateOTP();

        user.otp = newOtp;
        user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 min

        await user.save();

        await sendEmail(
            email,
            "Verify your HireNova account",
            `Your new OTP is: ${newOtp}`
        );

        res.json({ message: "OTP resent successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Login user using email OR username
 * @route   POST /api/auth/login
 */
const loginUser = async (req, res) => {
    const { identifier, password } = req.body;

    try {
        // 1. Find user by email OR username
        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 2. Check email verification
        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email first' });
        }

        // 3. Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 4. Generate JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// /**
//  * @desc    Update user profile
//  * @route   PUT /api/auth/profile
//  * @access  Private
//  */
// const updateUserProfile = async (req, res) => {
//     try {
//         const user = await User.findById(req.user.id);

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         user.skills = req.body.skills || user.skills;
//         user.preferredLocation = req.body.preferredLocation || user.preferredLocation;

//         const updatedUser = await user.save();

//         res.json({
//             message: 'Profile updated successfully',
//             user: {
//                 id: updatedUser._id,
//                 username: updatedUser.username,
//                 email: updatedUser.email,
//                 skills: updatedUser.skills,
//                 preferredLocation: updatedUser.preferredLocation
//             }
//         });

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

module.exports = {
    registerUser,
    verifyEmail,
    resendOtp,
    loginUser
};

const express = require(`express`);
const bcrypt = require(`bcryptjs`);
const jwt = require(`jsonwebtoken`);
const User = require(`../models/user`);
const { body, validationResult } = require(`express-validator`);
const rateLimit = require(`express-rate-limit`);
const sendEmail = require(`../utils/sendEmail`);
const crypto = require(`crypto`);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15 mins
  max: 5,
  message: { message: "too many attempts, please try again later" },
});

const router = express.Router();

router.post(
  `/signup`,
  [
    body(`name`).notEmpty().withMessage(`Name is Required`),
    body(`email`).isEmail().withMessage(`Please provide a valid email`),
    body(`password`)
      .isLength({ min: 6 })
      .withMessage(`Password must be atleast 6 characters`),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({ name, email, password: hashedPassword });

      const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: "7d",
        },
      );

      user.refreshToken = refreshToken;
      await user.save();

      res.status(201).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        accessToken,
        refreshToken,
      });
    } catch (err) {
      res.status(500).json({ message: "Server Error", err: err.message });
    }
  },
);

router.post(
  `/login`,
  loginLimiter,
  [
    body(`email`).isEmail().withMessage(`Please provide a valid email`),
    body(`password`).notEmpty().withMessage(`Password is required`),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid Email" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect Email or Password" });
      }

      const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: "7d",
        },
      );

      user.refreshToken = refreshToken;
      await user.save();

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        accessToken,
        refreshToken,
      });
    } catch (err) {
      res.status(500).json({ message: "Server Error", err: err.message });
    }
  },
);

router.post(`/refresh`, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: `No refresh token provided` });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken != refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: `15m`,
    });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: `Invalid or Expired refresh token` });
  }
});

router.post(`/logout`, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: `No refresh token provided` });
    }

    const user = await User.findOne({ refreshToken });

    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.json({ message: `Logged out sucessfully` });
  } catch (err) {
    res.status(500).json({ message: `Server error`, err: err.message });
  }
});

// router.post(`/test-email`, async (req, res) => {
//   try {
//     await sendEmail(
//       `xxxxxxxxxxxxxxxxxxxxxx@gmail.com`,
//       `Test Email`,
//       `<p>This is me testing if it will work</p>`,
//     );

//     res.json({ message: `Email sent sucessfully` });
//   } catch (err) {
//     res.status(500).json({ message: `Failed to send Email`, err: err.message });
//   }
// });

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        message: "If that email exists, a reset link has been sent",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    await sendEmail(
      user.email,
      "Password Reset",
      `<p>Click the link below to reset your password. This link expires in 15 minutes. i am puying this token here for copy so it can be easy for me to copy it and test with postman ${resetToken}</p>
       <a href="${resetLink}">${resetLink}</a>`,
    );

    res.json({ message: "If that email exists, a reset link has been sent" });
  } catch (err) {
    res.status(500).json({ message: "Server error", err: err.message });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error", err: err.message });
  }
});

module.exports = router;

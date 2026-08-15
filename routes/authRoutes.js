const express = require(`express`);
const bcrypt = require(`bcryptjs`);
const jwt = require(`jsonwebtoken`);
const User = require(`../models/user`);
const { body, validationResult } = require(`express-validator`);
const rateLimit = require(`express-rate-limit`);

const loginLimiter = rateLimit({
  windows: 15 * 60 * 1000, //15 mins
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

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.status(201).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        token,
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

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        token,
      });
    } catch (err) {
      res.status(500).json({ message: "Server Error", err: err.message });
    }
  },
);

module.exports = router;

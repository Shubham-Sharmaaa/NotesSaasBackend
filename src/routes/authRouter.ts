import express from "express";
import { googleLogin, LocalLogin } from "../controller/authController.js";
import { generateOtp, sendOtp } from "../util/otp.js";
import bcrypt from "bcrypt";
import OtpModel from "../models/OtpModel.js";
import User from "../models/userModel.js";
import AuthProvider from "../models/AuthProvider.js";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET as string;

const authrouter = express.Router();
authrouter.get("/test", (req, res) => {
  res.json({ message: "Auth route is working!" });
});
authrouter.get("/google", googleLogin);
authrouter.post("/", LocalLogin);
authrouter.post("/send-otp", async (req, res) => {
  console.log("req ", req);
  console.log("reqbody ", req.body);
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  try {
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    await OtpModel.deleteMany({
      email,
    });
    await OtpModel.create({
      email,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    await sendOtp(email, otp);
    res.json({ message: "OTP sent successfully", success: true });
  } catch (err) {
    res
      .status(500)
      .json({ Message: "something went wrong", err, Success: false });
  }
});
authrouter.post("/verify-otp", async (req, res) => {
  const { username, email, password, otp } = req.body;
  if (!password) {
    return res.status(400).json({ message: "Password required" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }
  const record = await OtpModel.findOne({ email });
  if (!record) {
    return res.status(400).json({ message: "No OTP found for this email" });
  }
  if (record.expiresAt < new Date()) {
    return res.status(400).json({ message: "OTP has expired" });
  }
  const isValid = await bcrypt.compare(otp, record.otp);
  if (!isValid) {
    return res.status(400).json({ message: "Invalid OTP" });
  }
  await OtpModel.deleteMany({ email });
  const prov = await AuthProvider.findOne({
    provider: "local",
    providerId: email,
  });
  if (prov) {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(500)
        .json({ message: "No User not found but there is provider entry" });
    }
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: "1h" });
    return res.status(200).json({
      message: "User already exists,you can log in",
      token,
    });
  }
  const userExist = await User.findOne({ email });
  if (userExist) {
    const newProvider = await AuthProvider.create({
      userId: userExist._id,
      provider: "local",
      providerId: email,
      password: hashedPassword,
    });

    if (newProvider) {
      const token = jwt.sign({ userId: userExist._id }, secret, {
        expiresIn: "1h",
      });
      return res
        .status(200)
        .json({ Message: "Otp verified and User logged in", token });
    }
  }
  const newuser = await User.create({
    username,
    email,
  });
  if (newuser) {
    const newProvider = await AuthProvider.create({
      userId: newuser._id,
      provider: "local",
      providerId: email,
      password: hashedPassword,
    });
    if (newProvider) {
      const token = jwt.sign({ userId: newuser._id }, secret, {
        expiresIn: "1h",
      });
      return res
        .status(200)
        .json({ Message: "Otp verified and User logged in", token });
    }
  }
  res.status(500).json("something happened ");
});

export default authrouter;

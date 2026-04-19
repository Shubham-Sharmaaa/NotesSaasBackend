/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Request, type Response } from "express";
import { oauth2Client } from "../util/googleConfig.js";
import axios from "axios";
import AuthProvider, { type IAuthProvider } from "../models/AuthProvider.js";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import bcrypt from "bcrypt";
const secret = process.env.JWT_SECRET as string;

const googleLogin = async (req: Request, res: Response) => {
  const { code } = req.query;
  try {
    if (!code || typeof code !== "string") {
      res.status(400).json({ message: "Authorization code is required" });
      return;
    }
    const googleRes: any = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(googleRes.tokens);
    const userRes = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`,
    );

    const { name, email, id } = userRes.data;
    if (!name || !email) {
      res
        .status(400)
        .json({ message: "Failed to retrieve user information from Google" });
      return;
    }
    const provider: IAuthProvider | null = await AuthProvider.findOne({
      provider: "google",
      providerId: id,
    });
    if (provider) {
      const token = jwt.sign({ userId: provider.userId }, secret as string, {
        expiresIn: "1h",
      });
      return res.json({
        message: "Google login successful!",
        token,
        user: userRes.data,
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      const newProvider = await AuthProvider.create({
        userId: user._id,
        provider: "google",
        providerId: id,
      });
      const token = jwt.sign({ userId: newProvider.userId }, secret as string, {
        expiresIn: "1h",
      });
      return res.json({
        message: "Google login successful!",
        token,
        user: userRes.data,
      });
    }
    const newUser = await User.create({ username: name, email });
    const newProvider = await AuthProvider.create({
      userId: newUser._id,
      provider: "google",
      providerId: id,
    });
    const token = jwt.sign({ userId: newProvider.userId }, secret as string, {
      expiresIn: "1h",
    });
    return res.json({
      message: "Google login successful!",
      token,
      user: userRes.data,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error occurred while logging in with Google", error });
  }
};
const LocalLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const existingProvider = await AuthProvider.findOne({
      provider: "local",
      providerId: email,
    });
    if (!existingProvider) {
      return res
        .status(200)
        .json({ message: "Otp sent to email, please verify", isotp: true });
    }
    if (!existingProvider.password) {
      return res.status(500).json({ message: "No password set for this user" });
    }
    const isPasswordValid = await bcrypt.compare(
      password,
      existingProvider.password,
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    } else {
      const token = jwt.sign({ userId: existingProvider.userId }, secret, {
        expiresIn: "1h",
      });
      return res.status(200).json({ message: "Login successful", token });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error occurred during local login", error });
  }
};
export { googleLogin, LocalLogin };

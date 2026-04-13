import nodemailer from "nodemailer";
export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
export async function sendOtp(email: string, otp: string) {
  await transporter.sendMail({
    from: `Notes App <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP for Notes App",
    html: `<h2>Your OTP for Notes App is: ${otp}</h2><p>Valid for 5 minutes</p>`,
  });
}

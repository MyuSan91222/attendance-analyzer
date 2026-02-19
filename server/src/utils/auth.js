import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

export function generateAccessToken(email, role) {
  return jwt.sign({ email, role }, JWT_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(email) {
  return jwt.sign({ email }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

export function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });
}

export async function sendVerificationEmail(email, token) {
  const transporter = getTransporter();
  if (!transporter) return false;
  const url = `${process.env.APP_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: email,
    subject: 'Verify your Attendance Analyzer account',
    html: `<p>Click <a href="${url}">here</a> to verify your email. Link expires in 24 hours.</p>`,
  });
  return true;
}

export async function sendResetEmail(email, token) {
  const transporter = getTransporter();
  if (!transporter) return false;
  const url = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"Attendance Analyzer" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: 'Reset your Attendance Analyzer password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f5f7fa;border-radius:12px;">
        <h2 style="margin:0 0 8px;color:#142333;font-size:20px;">Password Reset</h2>
        <p style="color:#4d6475;margin:0 0 24px;font-size:14px;">
          Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
        </p>
        <a href="${url}" style="display:inline-block;background:#5a8fa3;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          Reset Password
        </a>
        <p style="color:#97a9b5;margin:24px 0 0;font-size:12px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
  return true;
}

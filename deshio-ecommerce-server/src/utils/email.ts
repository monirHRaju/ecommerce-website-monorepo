import nodemailer from 'nodemailer';
import config from '../config';

const createTransporter = () =>
  nodemailer.createTransport({
    host: config.email_host,
    port: Number(config.email_port),
    secure: Number(config.email_port) === 465,
    auth: { user: config.email_user, pass: config.email_pass },
  });

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!config.email_user) {
    console.warn(`[Email] Not configured — skipping email to ${to}: ${subject}`);
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({ from: config.email_from, to, subject, html });
  console.log(`[Email] Sent to ${to}: ${subject}`);
};

export const sendVerificationEmail = async (name: string, email: string, token: string) => {
  const url = `${config.client_url}/verify-email?token=${token}`;
  await sendEmail(
    email,
    'Verify your Deshio account',
    `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px">
      <h2 style="color:#0EA5E9;margin-bottom:8px">Welcome to Deshio, ${name}!</h2>
      <p style="color:#475569">Please verify your email address to unlock all features including placing orders.</p>
      <a href="${url}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#0EA5E9;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Verify Email</a>
      <p style="color:#94a3b8;font-size:13px">Link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
    </div>
    `
  );
};

export const sendPasswordResetEmail = async (name: string, email: string, token: string) => {
  const url = `${config.client_url}/reset-password?token=${token}`;
  await sendEmail(
    email,
    'Reset your Deshio password',
    `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px">
      <h2 style="color:#0EA5E9;margin-bottom:8px">Password Reset Request</h2>
      <p style="color:#475569">Hi ${name}, we received a request to reset your password.</p>
      <a href="${url}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#0EA5E9;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
      <p style="color:#94a3b8;font-size:13px">Link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    </div>
    `
  );
};

export const sendGuestAccountCredentialsEmail = async (params: {
  name: string;
  email: string;
  phone: string;
  password: string;
  orderNumber: string;
  totalAmount: number;
}) => {
  const { name, email, phone, password, orderNumber, totalAmount } = params;
  const loginUrl = `${config.client_url}/login`;
  const ordersUrl = `${config.client_url}/dashboard/orders`;

  await sendEmail(
    email,
    `Order ${orderNumber} Confirmed & Your Login Credentials`,
    `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0">
      <h2 style="color:#1c1917;margin-bottom:8px">Thank you for your order, ${name}!</h2>
      <p style="color:#475569;font-size:14px">Your order <strong>#${orderNumber}</strong> (Total: <strong>৳${totalAmount.toLocaleString()}</strong>) has been confirmed.</p>
      <div style="margin:20px 0;padding:16px;background:#ffffff;border:1px solid #cbd5e1;border-radius:8px">
        <p style="margin:0 0 8px;font-weight:700;color:#1c1917;font-size:14px">Your Account Login Credentials</p>
        <p style="margin:4px 0;color:#334155;font-size:13px"><strong>Phone / Email:</strong> ${phone} (or ${email})</p>
        <p style="margin:4px 0;color:#334155;font-size:13px"><strong>Password:</strong> <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-weight:700">${password}</code></p>
      </div>
      <a href="${ordersUrl}" style="display:inline-block;margin:8px 8px 8px 0;padding:10px 22px;background:#1c1917;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">Track Your Order</a>
      <a href="${loginUrl}" style="display:inline-block;margin:8px 0;padding:10px 22px;background:#ffffff;color:#1c1917;border:1px solid #cbd5e1;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">Sign In</a>
      <p style="color:#94a3b8;font-size:12px;margin-top:20px">You can change your auto-generated password anytime from your account profile settings.</p>
    </div>
    `
  );
};

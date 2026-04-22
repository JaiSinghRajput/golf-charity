import nodemailer from "nodemailer";
import { env } from "@/lib/env";

const canSend =
  Boolean(env.SMTP_HOST) &&
  Boolean(env.SMTP_PORT) &&
  Boolean(env.SMTP_USER) &&
  Boolean(env.SMTP_PASS) &&
  Boolean(env.EMAIL_FROM);

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!canSend) {
    return;
  }

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  await transport.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html
  });
};

/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";
import { EmailJob } from "../events/email-job.types";
export const sendEmailWithNodemailer = async (emailData: EmailJob) => {
  const transporter = nodemailer.createTransport({
    host: `${process.env.EMAIL_HOST}`,
    secure: true,
    port: 465,
    auth: {
      user: `${process.env.RESEND_USER}`,
      pass: `${process.env.RESEND_PASSWORD}`,
    },
  });

  await transporter.sendMail({
    from: `${process.env.EMAIL_FROM}`,
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html,
  });
};

export const sendEmailUsingMailhog = async (emailData: EmailJob) => {
  const transporter = nodemailer.createTransport({
    host: `mailhog`,
    port: 1025,
    secure: false,
    requireTLS: false,
  });

  try {
    const info = await transporter.sendMail(emailData);
    return info;
  } catch (error: any) {
    throw error;
  }
};

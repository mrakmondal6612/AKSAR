import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const mailPort = process.env.MAILER_PORT ? Number(process.env.MAILER_PORT) : 587;
const secureConnection = mailPort === 465;

export const transporter = nodemailer.createTransport({
  host: process.env.MAILER_HOST,
  port: mailPort,
  secure: secureConnection,
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASS,
  },
});
import "server-only";
import nodemailer from "nodemailer";
import { env, features } from "./env";
import { logger } from "./logger";

type Mail = { to: string; subject: string; text: string; html?: string };

let transport: nodemailer.Transporter | null = null;

/**
 * Envia e-mail transacional via SMTP quando configurado.
 * Sem SMTP (desenvolvimento), o conteúdo é registrado no log do servidor — nunca se finge que foi entregue.
 */
export async function sendMail(mail: Mail): Promise<{ delivered: boolean }> {
  if (!features.smtp) {
    if (env.NODE_ENV === "production") {
      logger.error("mail.smtp_not_configured", { to: mail.to, subject: mail.subject });
      return { delivered: false };
    }
    logger.info("mail.dev_outbox", { to: mail.to, subject: mail.subject, text: mail.text });
    return { delivered: false };
  }
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  await transport.sendMail({ from: env.MAIL_FROM, ...mail });
  return { delivered: true };
}

function layout(title: string, body: string, cta?: { label: string; href: string }) {
  return `<!doctype html><html><body style="margin:0;background:#080A0A;font-family:Inter,Arial,sans-serif;color:#F4F7F3">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px">
    <div style="font-weight:800;letter-spacing:.08em;color:#B6FF3B;font-size:20px">FITLIFE</div>
    <h1 style="font-size:22px;margin:24px 0 12px">${title}</h1>
    <p style="color:#939B96;line-height:1.6">${body}</p>
    ${cta ? `<a href="${cta.href}" style="display:inline-block;margin-top:20px;background:#B6FF3B;color:#080A0A;padding:12px 22px;border-radius:12px;text-decoration:none;font-weight:700">${cta.label}</a>` : ""}
    <p style="color:#5d6560;font-size:12px;margin-top:40px">Se você não solicitou esta ação, ignore este e-mail.</p>
  </div></body></html>`;
}

export function verificationEmail(name: string, link: string): Omit<Mail, "to"> {
  return {
    subject: "Confirme seu e-mail no FitLife",
    text: `Olá, ${name}! Confirme seu e-mail acessando: ${link}`,
    html: layout(`Bem-vindo, ${name}`, "Confirme seu endereço de e-mail para proteger sua conta e liberar todos os recursos.", { label: "Confirmar e-mail", href: link }),
  };
}

export function resetEmail(name: string, link: string): Omit<Mail, "to"> {
  return {
    subject: "Redefinição de senha — FitLife",
    text: `Olá, ${name}. Para redefinir sua senha acesse (válido por 30 minutos): ${link}`,
    html: layout("Redefinir senha", "Recebemos um pedido para redefinir sua senha. O link é válido por 30 minutos.", { label: "Criar nova senha", href: link }),
  };
}

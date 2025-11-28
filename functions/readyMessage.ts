import { WASocket } from "@whiskeysockets/baileys"
import { logger } from "../utils/logger"

export async function enviarMensagemBotOnline(
  sock: WASocket,
  numeroDono: string,
  nomeBot: string
) {
  const jid = `${numeroDono.replace(/\D/g, "")}@s.whatsapp.net`

  try {
    await sock.sendMessage(jid, {
      text: `🤖 ${nomeBot} está ONLINE\nConexão estabelecida.`
    })
    logger.success("Mensagem de BOT ONLINE enviada ao dono")
  } catch {
    logger.error("Falha ao enviar mensagem de BOT ONLINE")
  }
}
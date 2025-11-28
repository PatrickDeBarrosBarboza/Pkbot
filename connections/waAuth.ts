import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  ConnectionState,
  WASocket
} from "@whiskeysockets/baileys"
import pino from "pino"
import qrcode from "qrcode-terminal"
import fs from "fs"
import { Boom } from "@hapi/boom"
import { enviarMensagemBotOnline } from "../functions/readyMessage"
import { logger } from "../utils/logger"
import { ConexaoConfig } from "../types/conexaoConfig"

export async function iniciarConexao(cfg: ConexaoConfig) {
  const { state, saveCreds } = await useMultiFileAuthState(cfg.pastaAuth)

  const sock: WASocket = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on("connection.update", (update: Partial<ConnectionState>) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      logger.info("QR Code gerado. Escaneie para conectar.")
      qrcode.generate(qr, { small: true })
    }

    if (connection === "close") {
      const status = new Boom(lastDisconnect?.error)?.output?.statusCode
      const deveReconectar = status !== DisconnectReason.loggedOut

      if (deveReconectar) {
        logger.warn("Conexão perdida, tentando reconectar...")
        iniciarConexao(cfg)
      } else {
        fs.rmSync(cfg.pastaAuth, { recursive: true, force: true })
        logger.error("Sessão expirada. Escaneie o QR novamente.")
      }
    }

    if (connection === "open") {
      logger.success(`${cfg.nomeBot} conectado como ${cfg.numeroBot}`)
      enviarMensagemBotOnline(sock, cfg.numeroDono, cfg.nomeBot)
    }
  })

  sock.ev.on("creds.update", saveCreds)

  return sock
}
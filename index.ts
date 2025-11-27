import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  ConnectionState,
  WASocket
} from "@whiskeysockets/baileys"
import pino from "pino"
import { Boom } from "@hapi/boom"
import qrcode from "qrcode-terminal"
import fs from "fs"

const MEU_NUMERO = "555132378785"
const AUTH_FILE_NAME = "auth_info_baileys"

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FILE_NAME)

  const sock: WASocket = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on("connection.update", (update: Partial<ConnectionState>) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log("SCANEIE O QR CODE PARA PAREAR O BOT")
      qrcode.generate(qr, { small: true })
    }

    if (connection === "close") {
      const status = new Boom(lastDisconnect?.error)?.output?.statusCode
      const shouldReconnect = status !== DisconnectReason.loggedOut

      if (shouldReconnect) connectToWhatsApp()
      else {
        fs.rmSync(AUTH_FILE_NAME, { recursive: true, force: true })
        console.log("Sessão expirada. Pareie novamente.")
      }
    }

    if (connection === "open") {
      console.log("Bot conectado")
      enviarMensagemBotOnline(sock)
    }
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("messages.upsert", async (event) => {
    const msg = event.messages[0]
    if (!msg || !msg.message) return
  })
}

async function enviarMensagemBotOnline(sock: WASocket) {
  const jid = `${MEU_NUMERO.replace(/\D/g, "")}@s.whatsapp.net`

  try {
    await sock.sendMessage(jid, {
      text: "🤖 *BOT ONLINE*\nConexão Baileys ativa."
    })
  } catch (e) {}
}

connectToWhatsApp()
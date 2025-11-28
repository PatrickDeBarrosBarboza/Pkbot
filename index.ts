// src/index.ts
import "dotenv/config"
import { iniciarConexao } from "./connections/waAuth"
import { logger } from "./utils/logger"
import { comandosPublic, comandosPrivate } from "./utils/commandLoader"
import { WASocket } from "@whiskeysockets/baileys"

const OWNER_NUMERO = process.env.OWNER_NUMERO as string
const NUMERO_BOT = process.env.NUMERO_BOT as string
const NOME_BOT = process.env.NOME_BOT as string
const AUTH_FILE_NAME = process.env.AUTH_FILE_NAME as string
const PREFIX = process.env.PREFIX as string

// Função para pegar o texto real da mensagem
function getBody(msg: any): string {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    msg.message?.buttonsResponseMessage?.selectedButtonId ||
    msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ""
  )
}

async function iniciar() {
  logger.event(`${NOME_BOT} iniciando...`)

  const sock: WASocket = await iniciarConexao({
    numeroDono: OWNER_NUMERO,
    numeroBot: NUMERO_BOT,
    nomeBot: NOME_BOT,
    pastaAuth: AUTH_FILE_NAME
  })

  // =======================
  // 📌 SISTEMA DE COMANDOS
  // =======================
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg || !msg.message) return

    const jid = msg.key.remoteJid
    const body = getBody(msg)

    if (!body.startsWith(PREFIX)) return

    const args = body.slice(PREFIX.length).trim().split(/ +/)
    const comando = args.shift()?.toLowerCase()
    if (!comando) return

    console.log("Mensagem recebida:", body)
    console.log("Comando detectado:", comando)

    const isOwner = jid?.replace("@s.whatsapp.net", "") === OWNER_NUMERO

    // carregar comando
    let cmd =
      comandosPublic.get(comando) ||
      comandosPrivate.get(comando) ||
      null

    if (!cmd) return

    // bloquear comandos privados
    if (comandosPrivate.has(comando) && !isOwner) {
      return sock.sendMessage(jid, {
        text: "❌ *Apenas o dono pode usar este comando.*"
      })
    }

    try {
      // ✅ Chamada correta: 3 argumentos separados
      await cmd.run(sock, msg, args)
    } catch (err) {
      console.error(`Erro ao executar comando ${comando}:`, err)
      sock.sendMessage(jid, {
        text: "❌ Erro ao executar comando."
      })
    }
  })
}

iniciar()
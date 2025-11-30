// src/index.ts
import "dotenv/config"
import { iniciarConexao } from "./connections/waAuth"
import { logger } from "./utils/logger"
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

}

iniciar()
// src/commands/public/teste.ts
import { Command } from "../../types/command"

const comando: Command = {
  name: "teste",
  desc: "Comando de teste",
  usage: "!teste",
  run: async (sock, msg, args) => {
    const jid = msg.key.remoteJid
    await sock.sendMessage(jid, { text: "✅ Comando executado com sucesso!" })
  }
}

export default comando
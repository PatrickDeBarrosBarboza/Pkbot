import { Command } from "../../types/command"

const cmd: Command = {
  name: "restart",
  desc: "Reinicia o bot",
  usage: "restart",
  alias: ["r"],

  run: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid!, {
      text: "♻️ Reiniciando..."
    })

    process.exit(0)
  }
}

export default cmd
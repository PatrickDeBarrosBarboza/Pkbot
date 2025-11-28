import fs from "fs";
import path from "path";
import { Command } from "../types/command";
import { logger } from "../utils/logger";

export const comandosPublic = new Map<string, Command>();
export const comandosPrivate = new Map<string, Command>();

const publicPath = path.join(__dirname, "../commands/public");
const privatePath = path.join(__dirname, "../commands/private");

function carregarComandos() {
  const pastas = [
    { caminho: publicPath, map: comandosPublic, isPrivate: false },
    { caminho: privatePath, map: comandosPrivate, isPrivate: true },
  ];

  for (const pasta of pastas) {
    if (!fs.existsSync(pasta.caminho)) continue;

    const arquivos = fs.readdirSync(pasta.caminho).filter(a => a.endsWith(".js") || a.endsWith(".ts"));

    for (const arquivo of arquivos) {
      const filePath = path.join(pasta.caminho, arquivo);

      try {
        const cmdImport = require(filePath);
        const comando: Command = cmdImport.default;

        if (!comando || !comando.name) {
          logger.warn(`⚠️ Comando inválido em: ${arquivo}`);
          continue;
        }

        comando.isPrivate = pasta.isPrivate;

        pasta.map.set(comando.name.toLowerCase(), comando);

        if (comando.alias && comando.alias.length > 0) {
          for (const a of comando.alias) {
            pasta.map.set(a.toLowerCase(), comando);
          }
        }

        logger.info(`✔ Comando carregado: ${comando.name} (${pasta.isPrivate ? "private" : "public"})`);
      } catch (err) {
        logger.error(`❌ Erro ao carregar comando ${arquivo}: ${err instanceof Error ? err.stack : err}`);
      }
    }
  }
}

carregarComandos();
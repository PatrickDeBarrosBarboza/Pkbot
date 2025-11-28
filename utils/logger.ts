import chalk from "chalk"

export const logger = {
  info: (msg: string) => console.log(chalk.blue(`[INFO] ${msg}`)),
  success: (msg: string) => console.log(chalk.green(`[SUCESSO] ${msg}`)),
  warn: (msg: string) => console.log(chalk.yellow(`[AVISO] ${msg}`)),
  error: (msg: string) => console.log(chalk.red(`[ERRO] ${msg}`)),
  event: (msg: string) => console.log(chalk.magenta(`[EVENTO] ${msg}`)),
}
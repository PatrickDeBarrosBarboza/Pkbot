

export interface Command {
  name: string;
  desc: string;
  usage: string;
  alias?: string[];
  run: (sock: WASocket, msg: any, args: string[]) => Promise<void>;
  isPrivate?: boolean; // adiciona esta linha
}
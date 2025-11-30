// src/utils/db.ts
import { QuickDB } from "quick.db"
import { logger } from "./logger"

// Inicializa a instância do QuickDB
// O nome do arquivo .sqlite será 'bot_database.sqlite' na pasta do projeto
const db = new QuickDB({ filePath: "bot_database.sqlite" })

// Interface para definir como os dados da conversa serão salvos
export interface Conversation {
  chatId: string // O JID do cliente (ex: 5511987654321@s.whatsapp.net)
  remetente: string // Número puro do cliente
  nomeCliente: string // pushName
  status: "PENDENTE" | "EM_ATENDIMENTO" | "FECHADA"
  atendenteId: string | null // ID do atendente logado (null se PENDENTE)
  ultimaMensagem: string // Última mensagem para exibição rápida na Dashboard
  timestampInicio: number // UNIX timestamp da primeira mensagem
  timestampAtualizacao: number // UNIX timestamp da última atividade
}

/**
 * Salva ou atualiza uma conversa no DB e retorna seu estado.
 * @param {string} chatId - ID da conversa.
 * @param {string} remetente - Número do cliente.
 * @param {string} nomeCliente - Nome do cliente.
 * @param {string} corpoMensagem - O texto da mensagem.
 * @returns {Conversation} O estado atual da conversa.
 */
export async function updateConversation(
  chatId: string,
  remetente: string,
  nomeCliente: string,
  corpoMensagem: string
): Promise<Conversation> {
  const conversationKey = `conversas.${chatId}`
  
  // 1. Tenta buscar a conversa existente
  let conversation: Conversation | null = await db.get(conversationKey)

  if (conversation) {
    // 2. Conversa existente: Apenas atualiza o timestamp e a última mensagem
    conversation.ultimaMensagem = corpoMensagem
    conversation.timestampAtualizacao = Date.now()
    
    // NOTA: O status (PENDENTE/EM_ATENDIMENTO) não é alterado aqui 
    // para evitar que uma mensagem do cliente mude um chat de volta para PENDENTE.

  } else {
    // 3. Nova Conversa: Cria um novo registro
    conversation = {
      chatId,
      remetente,
      nomeCliente,
      status: "PENDENTE", // Nova conversa sempre começa como PENDENTE
      atendenteId: null,
      ultimaMensagem: corpoMensagem,
      timestampInicio: Date.now(),
      timestampAtualizacao: Date.now(),
    }
    logger.event(`Nova Conversa criada: ${chatId}`)
  }

  // 4. Salva ou atualiza no QuickDB
  await db.set(conversationKey, conversation)
  
  // Opcional: Salvar a mensagem no histórico (seria uma tabela ou array separado)

  return conversation
}

// ====================================================================
// FUNÇÕES ESSENCIAIS PARA A DASHBOARD
// ====================================================================

// Função para buscar todas as conversas PENDENTES (para a fila)
export async function getPendingConversations(): Promise<Conversation[]> {
    const allConversations: { [key: string]: Conversation } = await db.get('conversas') || {}
    return Object.values(allConversations).filter(c => c.status === 'PENDENTE')
}

// Função para buscar as conversas EM_ATENDIMENTO por atendente (para a aba "Meus Atendimentos")
export async function getAssignedConversations(atendenteId: string): Promise<Conversation[]> {
    const allConversations: { [key: string]: Conversation } = await db.get('conversas') || {}
    return Object.values(allConversations).filter(c => 
        c.status === 'EM_ATENDIMENTO' && c.atendenteId === atendenteId
    )
}

// Função para Atendente ASSUMIR (usada pela API)
export async function assignConversation(chatId: string, atendenteId: string): Promise<boolean> {
    const conversationKey = `conversas.${chatId}`
    let conversation: Conversation | null = await db.get(conversationKey)

    if (conversation && conversation.status === "PENDENTE") {
        conversation.status = "EM_ATENDIMENTO"
        conversation.atendenteId = atendenteId
        conversation.timestampAtualizacao = Date.now()
        await db.set(conversationKey, conversation)
        logger.success(`Conversa ${chatId} assumida pelo atendente ${atendenteId}`)
        return true
    }
    return false
}

// Exporte a instância para outras operações mais complexas, se necessário
export default db

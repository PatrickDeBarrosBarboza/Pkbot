const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

// --- Configurações ---

// Substitua pelo seu número de telefone no formato internacional (ex: 5541999998888)
const MEU_NUMERO = '555132378785'; 

// Nome da pasta que armazenará os dados de autenticação (sessão)
const AUTH_FILE_NAME = 'auth_info_baileys';

// --- Função Principal de Conexão ---

async function connectToWhatsApp() {
    // 1. Carrega ou cria o estado de autenticação (sessão)
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FILE_NAME);

    // 2. Cria o objeto do socket Baileys
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }), // Usa o pino para logs (nível 'silent' para não poluir)
        auth: state,                       // Passa o estado de autenticação
        printQRInTerminal: false,          // Desabilita o QR code nativo do Baileys
    });

    // 3. Evento de Atualização de Conexão (Pareamento, Desconexão, etc.)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        // A. Verifica o QR Code
        if (qr) {
            console.log('\n=======================================');
            console.log('🔗 SCANIE O QR CODE PARA PAREAR O BOT');
            console.log('=======================================');
            qrcode.generate(qr, { small: true });
        }

        // B. Verifica o Status da Conexão
        if (connection === 'close') {
            // Conexão fechada
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexão fechada. Tentando reconectar:', shouldReconnect);

            // Tenta reconectar se não foi um loggout intencional
            if (shouldReconnect) {
                connectToWhatsApp();
            } else {
                // Se foi loggout, deleta a sessão e pede novo pareamento
                fs.rmSync(AUTH_FILE_NAME, { recursive: true, force: true });
                console.log('Sessão expirada. Por favor, reinicie e pareie novamente.');
            }
        } else if (connection === 'open') {
            // Conexão aberta! Bot Online.
            console.log('\n✅ Conexão estabelecida com sucesso! O Bot está Online.');
            enviarMensagemBotOnline(sock);
        }
    });

    // 4. Evento de Credenciais (Salva a sessão sempre que ela muda)
    sock.ev.on('creds.update', saveCreds);

    // 5. Adiciona o manipulador de mensagens (Para que o bot receba mensagens)
    sock.ev.on('messages.upsert', async ({ messages }) => {
        // Lógica de manipulação de mensagens irá aqui (em futuras etapas)
    });
}

// --- Função de Envio de Mensagem ---

async function enviarMensagemBotOnline(sock) {
    // Adiciona '@s.whatsapp.net' ao número para formar o JID (WhatsApp ID)
    const jid = `${MEU_NUMERO.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    
    // Verifica se o número foi configurado (evita erro se MEU_NUMERO estiver vazio)
    if (!jid.startsWith('@s.whatsapp.net')) {
        try {
            await sock.sendMessage(jid, { 
                text: '🤖 *[BOT ONLINE]* ✅\n\nConexão Baileys estabelecida com sucesso. Estou pronto para operar!',
            });
            console.log(`Mensagem de "Bot Online" enviada para ${MEU_NUMERO}.`);
        } catch (error) {
            console.error(`Falha ao enviar mensagem de "Bot Online" para ${MEU_NUMERO}:`, error);
        }
    } else {
        console.warn('⚠️ Por favor, substitua MEU_NUMERO no arquivo index.js pelo seu número.');
    }
}

// --- Inicia a Conexão ---
connectToWhatsApp();

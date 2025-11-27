const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const MEU_NUMERO = '555132378785';

const AUTH_FILE_NAME = 'auth_info_baileys';

async function connectToWhatsApp() {

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FILE_NAME);

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('🔗 SCANEIE O QR CODE PARA PAREAR O BOT');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {

            const shouldReconnect =
                new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log('Conexão fechada. Tentando reconectar:', shouldReconnect);

            if (shouldReconnect) {
                connectToWhatsApp();
            } else {
                fs.rmSync(AUTH_FILE_NAME, { recursive: true, force: true });
                console.log('Sessão expirada. Por favor, reinicie e pareie novamente.');
            }

        } else if (connection === 'open') {
            console.log('\n✅ Conexão estabelecida com sucesso! O Bot está Online.');
            enviarMensagemBotOnline(sock);
        }
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', async ({ messages }) => {
        // Lógica futura
    });
}

async function enviarMensagemBotOnline(sock) {

    const jid = `${MEU_NUMERO.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

    if (jid && jid.includes('@s.whatsapp.net')) {
        try {
            await sock.sendMessage(jid, {
                text: '🤖 *[BOT ONLINE]* ✅\n\nConexão Baileys estabelecida com sucesso. Estou pronto para operar!'
            });
            console.log(`Mensagem de "Bot Online" enviada para ${MEU_NUMERO}.`);
        } catch (error) {
            console.error(`Falha ao enviar mensagem de "Bot Online":`, error);
        }
    } else {
        console.warn('⚠️ Número inválido. Verifique MEU_NUMERO no index.js');
    }
}

connectToWhatsApp();
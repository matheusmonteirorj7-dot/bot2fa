require('dotenv').config();
const http = require('node:http');

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
} = require('discord.js');

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('Configuração ausente: defina DISCORD_TOKEN no ambiente.');
  process.exit(1);
}

const client = new Client({
  // O bot precisa apenas de eventos de servidor e interações; não lê mensagens.
  intents: [GatewayIntentBits.Guilds],
});

function makePublicGuide() {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Configuração de autenticação em dois fatores')
    .setDescription(
      'Configure o 2FA diretamente no serviço que você quer proteger e no seu app autenticador. **Não cole chaves secretas, QR codes ou códigos temporários neste canal, em sites de terceiros ou para o bot.**',
    )
    .addFields(
      {
        name: 'Passo a passo',
        value: [
          '1. Abra as configurações de segurança do serviço.',
          '2. Ative a autenticação em dois fatores e escaneie o QR code com seu app autenticador.',
          '3. Guarde os códigos de recuperação em um local privado e seguro.',
        ].join('\n'),
      },
      {
        name: 'Privacidade',
        value: 'Este bot não solicita, recebe, processa nem armazena segredos 2FA.',
      },
    )
    .setFooter({ text: 'Se uma chave secreta foi compartilhada, desative e configure novamente o 2FA nesse serviço.' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('configurar2fa:guia-privado')
      .setLabel('Ver instruções privadas')
      .setStyle(ButtonStyle.Primary),
  );

  return { embeds: [embed], components: [row] };
}

function makePrivateGuide() {
  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle('Seu 2FA, sob seu controle')
    .setDescription(
      [
        'A chave de configuração deve ser inserida **somente no app autenticador que você escolheu**, nunca neste Discord ou em um bot.',
        '',
        '• Se o serviço mostrar um QR code, escaneie-o dentro do app autenticador.',
        '• Se precisar inserir manualmente, digite a chave diretamente no app autenticador.',
        '• Nunca compartilhe códigos de seis dígitos nem códigos de recuperação.',
        '• Se uma chave ou código já foi exposto, remova o 2FA antigo no serviço e configure um novo.',
      ].join('\n'),
    )
    .setFooter({ text: 'Esta resposta é visível apenas para você.' });
}

// Render Web Service e UptimeRobot acessam esta porta usando HTTP.
// /health verifica que o processo responde; /ready verifica a conexão Discord.
const port = Number(process.env.PORT) || 3000;
const healthServer = http.createServer((req, res) => {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.writeHead(405);
    res.end(JSON.stringify({ status: 'method_not_allowed' }));
    return;
  }

  if (pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', discordReady: client.isReady() }));
    return;
  }

  if (pathname === '/ready') {
    const ready = client.isReady();
    res.writeHead(ready ? 200 : 503);
    res.end(JSON.stringify({ status: ready ? 'ready' : 'discord_reconnecting' }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ status: 'not_found' }));
});

healthServer.on('error', () => {
  console.error('Não foi possível iniciar o servidor HTTP de health check.');
  process.exit(1);
});
healthServer.listen(port, '0.0.0.0', () => {
  console.log(`Health check HTTP ativo na porta ${port}`);
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot conectado como ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'configurar2fa') {
    // Responde à interação em privado e publica o guia não sensível no canal.
    await interaction.reply({
      content: 'Vou publicar no canal um guia seguro, sem solicitar nenhuma chave 2FA.',
      ephemeral: true,
    });

    try {
      if (!interaction.channel || typeof interaction.channel.send !== 'function') {
        await interaction.editReply('Não consegui publicar neste tipo de canal. Tente em um canal de texto do servidor.');
        return;
      }
      await interaction.channel.send(makePublicGuide());
    } catch {
      await interaction.editReply('Não consegui publicar. Verifique se o bot pode enviar mensagens e incorporar links neste canal.');
    }
    return;
  }

  if (interaction.isButton() && interaction.customId === 'configurar2fa:guia-privado') {
    await interaction.reply({
      embeds: [makePrivateGuide()],
      ephemeral: true,
    });
  }
});

client.login(token).catch(() => {
  console.error('Não foi possível conectar. Confira DISCORD_TOKEN e as configurações do bot.');
  process.exit(1);
});

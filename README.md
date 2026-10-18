# Bot Discord — Guia seguro de 2FA

Bot simples em Node.js para o comando `/configurar2fa`. Ao executá-lo, o bot publica no canal atual um card limpo com instruções de segurança. O botão **Ver instruções privadas** mostra um guia visível somente para quem clicou.

## Limite de segurança

Este bot **não** tem campo, modal ou fluxo para receber chave secreta, QR code, senha, código temporário ou código de recuperação. Não encaminha dados para `2fa.zone` nem para qualquer outro site. Uma semente TOTP/chave secreta pode permitir gerar códigos de autenticação e deve permanecer privada, inserida diretamente no app autenticador do próprio usuário.

## Requisitos

- Node.js 20 ou superior
- Aplicação e bot criados no [Discord Developer Portal](https://discord.com/developers/applications)
- Permissões no servidor para o bot enviar mensagens e incorporar links

## Configuração local

1. No Discord Developer Portal, crie uma aplicação, adicione um bot e copie o token. Trate o token como uma senha.
2. Convide o bot ao servidor com os escopos `bot` e `applications.commands`; conceda, no mínimo, `Send Messages` e `Embed Links`.
3. Copie `.env.example` para `.env` e preencha `DISCORD_TOKEN`, `CLIENT_ID` e, de preferência, `GUILD_ID` com os valores do seu servidor de teste. **Não envie o `.env` ao GitHub.**
4. Instale dependências e registre o comando:

   ```bash
   npm install
   npm run deploy:commands
   ```

5. Inicie o bot:

   ```bash
   npm start
   ```

Com `GUILD_ID`, o comando é registrado no servidor de teste. Sem esse valor, ele é registrado globalmente e pode levar algum tempo para aparecer.

## GitHub e Render

- Faça commit do código, mas nunca do `.env`, do token do bot ou de arquivos com credenciais.
- No Render, conecte o repositório como um **Web Service** (não Background Worker, pois o UptimeRobot precisa de uma URL HTTP pública). Use `npm install` como build command e `npm start` como start command.
- O programa escuta a porta indicada por `PORT` e responde em `/health` e `/ready`. Não é preciso definir `PORT` manualmente no Render.
- Cadastre `DISCORD_TOKEN`, `CLIENT_ID` e `GUILD_ID` na área de variáveis de ambiente do serviço. Não coloque tokens no código, nos logs ou em mensagens.
- Registre o slash command uma vez usando `npm run deploy:commands` com essas variáveis definidas. Para desenvolvimento, use um `GUILD_ID`; para disponibilização ampla, registre globalmente removendo-o.

## UptimeRobot

1. Aguarde o deploy terminar e copie a URL pública `onrender.com` do Web Service.
2. No UptimeRobot, crie um monitor do tipo **HTTP(s)** com a URL `https://SEU-SERVICO.onrender.com/health`. O endpoint retorna HTTP 200 quando o processo responde e inclui um indicador `discordReady` no JSON.
3. Se quiser monitorar especificamente a conexão com o Discord, crie também um monitor HTTP(s) para `https://SEU-SERVICO.onrender.com/ready`. Esse endpoint responde 200 quando o bot está conectado e 503 durante uma desconexão ou reconexão.

O monitor gratuito do UptimeRobot verifica a cada 5 minutos, e o Render informa que um Web Service gratuito entra em suspensão após 15 minutos sem tráfego de entrada. Portanto, as verificações regulares ao `/health` podem manter o serviço ativo. Isso não garante funcionamento ininterrupto: o Render pode reiniciar serviços gratuitos e limita o uso mensal de instância. Para disponibilidade garantida, use um plano pago ou hospedagem contínua apropriada.

## Privacidade técnica

O bot usa apenas a intenção `Guilds`, não lê mensagens comuns e não possui código que colete ou armazene chaves 2FA. O botão fornece somente texto de orientação em resposta efêmera. O endpoint HTTP expõe apenas estado do processo e conexão, sem tokens ou dados de usuários.

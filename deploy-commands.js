require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('Defina DISCORD_TOKEN e CLIENT_ID antes de registrar os comandos.');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('configurar2fa')
    .setDescription('Publica um guia seguro para configurar autenticação em dois fatores.')
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
const route = GUILD_ID
  ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
  : Routes.applicationCommands(CLIENT_ID);

rest.put(route, { body: commands })
  .then(() => {
    console.log(GUILD_ID
      ? 'Comando /configurar2fa registrado no servidor de teste.'
      : 'Comando /configurar2fa registrado globalmente; a propagação pode levar algum tempo.');
  })
  .catch(() => {
    console.error('Falha ao registrar o comando. Confira CLIENT_ID, DISCORD_TOKEN e GUILD_ID.');
    process.exit(1);
  });

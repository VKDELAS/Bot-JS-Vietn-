// ============================================================
// index.js
// Ponto de entrada (Entrypoint) principal do bot MS-13 / Vietnã.
// ============================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { TOKEN } = require('./src/config/settings');

// Inicia o client do Discord.js com intents necessárias
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// 1. Carrega todos os comandos slash da pasta /src/commands
const commandsPath = path.join(__dirname, 'src', 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[commands] O comando em ${file} está estruturado incorretamente.`);
    }
  }
}

// 2. Carrega todos os ouvintes de eventos da pasta /src/events
const eventsPath = path.join(__dirname, 'src', 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

// 3. Login com o token da API do Discord
client.login(TOKEN).catch((erro) => {
  console.error('[login] Erro fatal ao iniciar sessão no Discord:', erro.message);
});

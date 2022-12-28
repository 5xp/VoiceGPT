const { REST, Routes } = require("discord.js");
const { clientId, guildId, token } = require("./config.json");
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
const deployGlobal = args.includes("--global");

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if (!("data" in command && "execute" in command)) continue;

  commands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: "10" }).setToken(token);

// and deploy your commands!
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    let data;

    // The put method is used to fully refresh all commands in the guild with the current set
    if (deployGlobal) {
      console.log("Deploying global commands.");
      data = await rest.put(Routes.applicationCommands(clientId), { body: commands });
    } else {
      console.log("Deploying guild commands.");
      data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    }

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();

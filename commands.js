import { getRPSChoices } from "./game.js";
import { capitalize, DiscordRequest } from "./utils.js";
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from "discord-interactions";

export async function HasGuildCommands(appId, guildId, commands) {
  if (guildId === "" || appId === "") return;

  commands.forEach((c) => HasGuildCommand(appId, guildId, c));
}

// Checks for a command
async function HasGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;

  try {
    const res = await DiscordRequest(endpoint, { method: "GET" });
    const data = await res.json();

    if (data) {
      const installedNames = data.map((c) => c["name"]);
      // This is just matching on the name, so it's not good for updates
      if (!installedNames.includes(command["name"])) {
        console.log(`Installing "${command["name"]}"`);
        InstallGuildCommand(appId, guildId, command);
      } else {
        console.log(`"${command["name"]}" command already installed`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

// Installs a command
export async function InstallGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
  // install command
  try {
    await DiscordRequest(endpoint, { method: "POST", body: command });
  } catch (err) {
    console.error(err);
  }
}

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Simple test command
export const TEST_COMMAND = {
  name: "test",
  description: "Basic guild command",
  type: 1,
};

// Command containing options
export const CHALLENGE_COMMAND = {
  name: "challenge",
  description: "Challenge to a match of rock paper scissors",
  options: [
    {
      type: 3,
      name: "object",
      description: "Pick your object",
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
};

// Custom card command
export const CC_COMMAND = {
  name: "cc",
  description: "Pesquisar uma carta na base de dados do Custom Commander.",
  type: 1,
  options: [
    {
      type: 3,
      name: "nome",
      description: "Nome da carta.",
      required: true,
    },
  ],
};

export const CCROLL_COMMAND = {
  name: "ccroll",
  description: "Obter uma carta aleatória da base de dados do Custom Commander.",
  type: 1,
};

export async function FindCard(req, res) {
  const media_url = process.env.FIRESTORE_API + "Mistake.jpg" + "?alt=media";
  await res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: "",
          attachments: [
            {
              filename: "Mistake.jpg",
              url: media_url,
            }
          ]
        },
      });
}
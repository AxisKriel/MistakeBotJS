import express from "express";
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from "discord-interactions";
import {
  VerifyDiscordRequest,
  getRandomEmoji,
  DiscordRequest,
  GetCardList,
} from "./utils.js";
import { getShuffledOptions, getResult } from "./game.js";
import {
  CHALLENGE_COMMAND,
  TEST_COMMAND,
  CC_COMMAND,
  CCROLL_COMMAND,
  HasGuildCommands,
  FindCard,
} from "./commands.js";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

// Store for in-progress games. In production, you'd want to use a DB
const activeGames = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post("/interactions", async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // cc command shortcut for now
    if (name === "cc") {
      var card = undefined;
      const cardname = data.options[0]["value"];
      const cardList = await GetCardList();
      // first test - perfect match
      const cardIndex = cardList.indexOf(cardname);
      if (cardIndex > -1) {
        card = cardList[cardIndex];
      } else {
        // if there is no perfect match, we look up startsWith
        card = cardList.find(function (value, index, array) {
          return value.toLowerCase().startsWith(cardname.toLowerCase());
        });
        if (card === undefined) {
          // if all else fails, card doesn't exist
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: "Carta não encontrada!",
            },
          });
        }
      }
      const media_url =
        process.env.FIRESTORE_API +
        "CC1%2F" +
        encodeURI(card + ".jpg" + "?alt=media");
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: media_url,
        },
      });
    }
    // roll a random cc card
    if (name === "ccroll") {
      const cardList = await GetCardList();
      const card = cardList[Math.floor(Math.random() * cardList.length)];
      const media_url =
        process.env.FIRESTORE_API +
        "CC1%2F" +
        encodeURI(card + ".jpg" + "?alt=media");
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: media_url,
        },
      });
    }
  }
  if (type === InteractionType.MESSAGE_COMPONENT) {
    // custom_id set in payload when sending message component
    const componentId = data.custom_id;

    if (componentId.startsWith("accept_button_")) {
      // get the associated game ID
      const gameId = componentId.replace("accept_button_", "");
      // Delete message with token in request body
      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
      try {
        await res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            // Fetches a random emoji to send from a helper function
            content: "What is your object of choice?",
            // Indicates it'll be an ephemeral message
            flags: InteractionResponseFlags.EPHEMERAL,
            components: [
              {
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                  {
                    type: MessageComponentTypes.STRING_SELECT,
                    // Append game ID
                    custom_id: `select_choice_${gameId}`,
                    options: getShuffledOptions(),
                  },
                ],
              },
            ],
          },
        });
        // Delete previous message
        await DiscordRequest(endpoint, { method: "DELETE" });
      } catch (err) {
        console.error("Error sending message:", err);
      }
    }
  }
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);

  // Check if guild commands from commands.json are installed (if not, install them)
  HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
    //TEST_COMMAND,
    //CHALLENGE_COMMAND,
    CC_COMMAND,
    CCROLL_COMMAND,
  ]);
});

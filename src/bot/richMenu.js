/**
 * Rich Menu Handler
 * Creates and manages LINE Rich Menu for quick access to bot features
 */

const { client } = require('./webhook');
const config = require('../config/environment');

/**
 * Rich Menu configuration
 */
const RICH_MENU_CONFIG = {
  size: {
    width: 2500,
    height: 1686,
  },
  selected: false,
  name: 'LanguageBridgeBot Menu',
  chatBarText: 'Menu',
  areas: [
    {
      bounds: {
        x: 0,
        y: 0,
        width: 833,
        height: 843,
      },
      action: {
        type: 'postback',
        label: 'Help',
        data: 'action=help',
      },
    },
    {
      bounds: {
        x: 833,
        y: 0,
        width: 833,
        height: 843,
      },
      action: {
        type: 'postback',
        label: 'Languages',
        data: 'action=languages',
      },
    },
    {
      bounds: {
        x: 1666,
        y: 0,
        width: 834,
        height: 843,
      },
      action: {
        type: 'postback',
        label: 'Status',
        data: 'action=status',
      },
    },
    {
      bounds: {
        x: 0,
        y: 843,
        width: 833,
        height: 843,
      },
      action: {
        type: 'postback',
        label: 'Set Languages',
        data: 'action=set',
      },
    },
    {
      bounds: {
        x: 833,
        y: 843,
        width: 833,
        height: 843,
      },
      action: {
        type: 'postback',
        label: 'About',
        data: 'action=about',
      },
    },
    {
      bounds: {
        x: 1666,
        y: 843,
        width: 834,
        height: 843,
      },
      action: {
        type: 'uri',
        label: 'Premium',
        uri: 'https://your-website.com/premium',
      },
    },
  ],
};

/**
 * Create rich menu
 * @param {string} imagePath - Path to rich menu image (2500x1686px)
 * @returns {Promise<string>} Rich menu ID
 */
async function createRichMenu(imagePath) {
  try {
    // Create rich menu
    const richMenuId = await client.createRichMenu(RICH_MENU_CONFIG);

    // Upload rich menu image
    if (imagePath) {
      const fs = require('fs');
      const imageBuffer = fs.readFileSync(imagePath);
      await client.setRichMenuImage(richMenuId, imageBuffer);
    }

    // Set as default rich menu
    await client.setDefaultRichMenu(richMenuId);

    console.log(`Rich menu created: ${richMenuId}`);
    return richMenuId;
  } catch (error) {
    throw new Error(`Failed to create rich menu: ${error.message}`);
  }
}

/**
 * Delete rich menu
 * @param {string} richMenuId - Rich menu ID
 */
async function deleteRichMenu(richMenuId) {
  try {
    await client.deleteRichMenu(richMenuId);
    console.log(`Rich menu deleted: ${richMenuId}`);
  } catch (error) {
    throw new Error(`Failed to delete rich menu: ${error.message}`);
  }
}

/**
 * Set rich menu for specific user
 * @param {string} userId - LINE user ID
 * @param {string} richMenuId - Rich menu ID
 */
async function setRichMenuForUser(userId, richMenuId) {
  try {
    await client.linkRichMenuToUser(userId, richMenuId);
  } catch (error) {
    throw new Error(`Failed to set rich menu for user: ${error.message}`);
  }
}

/**
 * Get all rich menus
 * @returns {Promise<Array>} List of rich menus
 */
async function getRichMenus() {
  try {
    const richMenus = await client.getRichMenuList();
    return richMenus.richmenus;
  } catch (error) {
    throw new Error(`Failed to get rich menus: ${error.message}`);
  }
}

/**
 * Handle postback from rich menu
 * @param {Object} event - LINE postback event
 */
async function handleRichMenuPostback(event) {
  try {
    const data = event.postback.data;
    const params = new URLSearchParams(data);
    const action = params.get('action');

    const { handleCommand } = require('./commands');
    const userId = event.source.userId;

    // Map rich menu actions to commands
    const commandMap = {
      help: '/help',
      languages: '/languages',
      status: '/status',
      set: '/set',
      about: '/about',
    };

    if (commandMap[action]) {
      // Create a fake message event for command handling
      const fakeEvent = {
        ...event,
        message: {
          type: 'text',
          text: commandMap[action],
        },
      };

      await handleCommand(fakeEvent, commandMap[action]);
    }
  } catch (error) {
    console.error('Error handling rich menu postback:', error);
  }
}

module.exports = {
  createRichMenu,
  deleteRichMenu,
  setRichMenuForUser,
  getRichMenus,
  handleRichMenuPostback,
  RICH_MENU_CONFIG,
};

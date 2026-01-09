# Bot Commands Guide

Complete guide to all @LanguageBridgeBot commands.

## Available Commands

### `/help` or `/start`

Shows help message with all available commands.

**Usage:**
```
/help
```

**Response:** List of all commands with descriptions.

---

### `/languages`

Displays all 35 supported languages grouped by region.

**Usage:**
```
/languages
```

**Response:** 
- Asian Languages (16) with flags
- European Languages (15) with flags
- Other Languages (5) with flags
- Indian languages marked with ⭐

---

### `/set [lang1] [lang2] ...`

Configure translation languages for the group.

**Usage:**
```
/set en th
/set en th hi mr
/set en th hi mr te bn
```

**Parameters:**
- Minimum: 2 languages
- Maximum: Unlimited (premium) or 2 (free tier)

**Examples:**
- `/set en th` - English ↔ Thai
- `/set en hi mr` - English ↔ Hindi, Marathi
- `/set en th hi mr te` - Multiple languages

**Response:** Confirmation with configured languages and flags.

---

### `/status`

Shows current group configuration and usage statistics.

**Usage:**
```
/status
```

**Response:**
- Configured languages with flags
- Mode (bilingual/multilingual)
- Usage statistics (daily and total)
- Premium status
- Last used timestamp

---

### `/about`

Shows information about the bot.

**Usage:**
```
/about
```

**Response:**
- Bot version
- Features list
- Supported languages count
- Special focus on Indian languages
- Commands reference

---

### `/reset`

Resets group configuration to defaults.

**Usage:**
```
/reset
```

**Response:** Confirmation message.

**Note:** This deactivates the group. Use `/set` again to reconfigure.

---

## Command Tips

1. **Language Codes:** Use 2-letter codes (en, th, hi, etc.)
2. **Case Insensitive:** Commands work with `/HELP` or `/help`
3. **@ Mentions:** Works with or without @ mention
4. **Group vs Private:** Commands work in both group chats and 1-on-1

## Examples

### Setup for English-Thai Group
```
/set en th
```

### Setup for Multi-Language Group
```
/set en th hi mr te
```

### Check Usage
```
/status
```

### Get Help
```
/help
```

## Troubleshooting

### Command not working
- Check spelling
- Ensure bot is added to group
- Verify bot is active

### Invalid language code
- Use `/languages` to see all codes
- Check spelling
- Use 2-letter codes only

### Configuration not saving
- Check database connection
- Verify bot permissions
- Try `/reset` then `/set` again

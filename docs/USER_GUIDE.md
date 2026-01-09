# LanguageBridgeBot User Guide

## Welcome to @LanguageBridgeBot! 🌍

LanguageBridgeBot is your intelligent translation assistant for LINE. It automatically translates messages in group chats, supporting 35 languages with special focus on Indian languages.

---

## Getting Started

### Adding the Bot to Your Group

1. Open LINE and search for `@LanguageBridgeBot`
2. Add the bot to your group chat
3. The bot will automatically send a welcome message
4. Start chatting in any supported language!

### First-Time Setup

When you first add the bot, it will:
- Set default languages (English, Thai, Japanese)
- Send a welcome message
- Be ready to translate immediately

To customize languages, use the `/set` command (see Commands section below).

---

## Features

### ✨ Core Features

- **35 Languages Supported** - Including major Asian, European, and Indian languages
- **Auto-Detection** - Automatically detects source language
- **Multi-Language Translation** - Translate to multiple languages at once
- **Smart Caching** - Fast responses with intelligent caching
- **Group Management** - Different settings per group

### 🌟 Premium Features

- **Unlimited Translations** - No daily limits
- **Unlimited Languages** - Translate to as many languages as you want
- **Priority Processing** - Faster translation responses
- **Translation History** - Access past translations
- **Advanced Analytics** - Detailed usage statistics
- **Voice Message Translation** - Translate voice messages
- **Image Text Translation (OCR)** - Extract and translate text from images

---

## Commands

### `/help` or `/start`

Get help and see all available commands.

**Example:**
```
/help
```

---

### `/languages`

View all 35 supported languages with flags.

**Example:**
```
/languages
```

**Response:** Lists all languages grouped by region (Asian, European, Other).

---

### `/set [lang1] [lang2] ...`

Configure which languages to translate between.

**Examples:**
```
/set en th          # English ↔ Thai
/set en hi mr        # English ↔ Hindi, Marathi
/set en th hi mr te  # Multiple languages
```

**Rules:**
- Minimum: 2 languages
- Free tier: Up to 2 languages
- Premium: Unlimited languages

**Language Codes:**
- `en` - English
- `th` - Thai
- `hi` - Hindi
- `mr` - Marathi
- `te` - Telugu
- `bn` - Bengali
- And 29 more! Use `/languages` to see all.

---

### `/status`

Check your group's configuration and usage.

**Example:**
```
/status
```

**Shows:**
- Configured languages
- Daily usage
- Total usage
- Premium status
- Last activity

---

### `/about`

Learn about the bot and its features.

**Example:**
```
/about
```

---

### `/reset`

Reset your group configuration to defaults.

**Example:**
```
/reset
```

**Note:** This will deactivate the group. Use `/set` again to reconfigure.

---

## How to Use

### Basic Translation

1. **Send a message** in any supported language
2. **Bot automatically detects** the language
3. **Bot translates** to all configured target languages
4. **Receive translations** in a formatted message

**Example:**
```
You: Hello, how are you?
Bot: 🇹🇭 สวัสดี คุณเป็นอย่างไรบ้าง?
     🇯🇵 こんにちは、元気ですか？
```

---

### Multi-Language Groups

Perfect for international teams or multilingual communities!

**Setup:**
```
/set en th hi mr te
```

**Usage:**
- Anyone can chat in their preferred language
- Everyone gets translations automatically
- No need to manually translate

---

### Voice Messages (Premium)

1. Send a voice message in LINE
2. Bot transcribes the audio
3. Bot translates to all configured languages
4. Receive text translations

**Note:** Voice messages must be under 60 seconds.

---

### Image Translation (Premium)

1. Send an image with text
2. Bot extracts text using OCR
3. Bot translates the text
4. Receive translations

**Perfect for:**
- Screenshots
- Signs
- Documents
- Menus

---

## Tips & Best Practices

### ✅ Do's

- **Use clear language** - Better translations with clear text
- **Set appropriate languages** - Only set languages your group actually uses
- **Check `/status`** - Monitor your usage regularly
- **Use commands** - Commands help you manage the bot

### ❌ Don'ts

- **Don't spam** - Rate limits apply to prevent abuse
- **Don't use emoji-only messages** - These are skipped
- **Don't send very long messages** - Keep messages reasonable length

---

## Troubleshooting

### Bot Not Responding

1. Check if bot is still in the group
2. Verify bot is active (check `/status`)
3. Check if you've hit rate limits
4. Try sending `/help` to test

### Translations Not Working

1. Check configured languages with `/status`
2. Verify language codes are correct
3. Ensure message is in a supported language
4. Check if daily limit is reached (free tier)

### Command Not Working

1. Check spelling (commands are case-insensitive)
2. Ensure bot is added to group
3. Try `/help` to see all commands
4. Check if you have permission in the group

### Language Not Detected

1. Use `/languages` to verify language is supported
2. Try using language code explicitly
3. Check if message is too short
4. Contact support if issue persists

---

## Premium Subscription

### Benefits

- ✅ Unlimited daily translations
- ✅ Unlimited languages per group
- ✅ Priority translation processing
- ✅ Voice message translation
- ✅ Image text translation (OCR)
- ✅ Translation history
- ✅ Advanced analytics

### How to Upgrade

1. Use `/status` to see current plan
2. Contact bot administrator for upgrade
3. Or visit the premium portal (if configured)

---

## Supported Languages

### Asian Languages (16)
🇹🇭 Thai, 🇯🇵 Japanese, 🇰🇷 Korean, 🇨🇳 Chinese (Simplified), 🇹🇼 Chinese (Traditional), 🇻🇳 Vietnamese, 🇮🇩 Indonesian, 🇲🇾 Malay, 🇵🇭 Filipino, 🇸🇬 Singaporean, 🇱🇰 Sinhala, 🇲🇲 Burmese, 🇰🇭 Khmer, 🇱🇦 Lao, 🇧🇩 Bengali, 🇵🇰 Urdu

### European Languages (15)
🇬🇧 English, 🇪🇸 Spanish, 🇫🇷 French, 🇩🇪 German, 🇮🇹 Italian, 🇵🇹 Portuguese, 🇷🇺 Russian, 🇳🇱 Dutch, 🇵🇱 Polish, 🇬🇷 Greek, 🇹🇷 Turkish, 🇨🇿 Czech, 🇷🇴 Romanian, 🇭🇺 Hungarian, 🇸🇪 Swedish

### Indian Languages (5) ⭐
🇮🇳 Hindi, 🇮🇳 Marathi, 🇮🇳 Telugu, 🇮🇳 Tamil, 🇮🇳 Gujarati

---

## Privacy & Security

- **No message storage** - Messages are processed and not stored
- **Secure connections** - All communications are encrypted
- **Group privacy** - Each group's data is isolated
- **No data sharing** - Your data is never shared with third parties

---

## Support

### Need Help?

- Use `/help` for command reference
- Use `/about` for bot information
- Check this guide for detailed instructions
- Contact support through LINE (if configured)

### Report Issues

If you encounter bugs or have suggestions:
1. Note the error message
2. Check `/status` for configuration
3. Report with as much detail as possible

---

## Frequently Asked Questions

### Q: How many languages can I set?
**A:** Free tier: 2 languages. Premium: Unlimited.

### Q: Does the bot work in private chats?
**A:** Yes! The bot works in both group chats and 1-on-1 conversations.

### Q: Can I use multiple language pairs?
**A:** Yes! Set multiple languages and the bot will translate between all of them.

### Q: How fast are translations?
**A:** Typically under 1 second, thanks to smart caching and optimization.

### Q: Is there a message length limit?
**A:** Very long messages may be truncated. Keep messages reasonable for best results.

### Q: Can I translate voice messages?
**A:** Yes, with Premium subscription.

### Q: Does the bot work offline?
**A:** No, the bot requires internet connection for translation services.

---

## Updates & Changelog

Stay tuned for new features and improvements!

**Recent Updates:**
- Voice message translation (Premium)
- Image text translation (Premium)
- Rich menu support
- Performance improvements
- New languages added

---

## Thank You! 🙏

Thank you for using LanguageBridgeBot! We hope it helps bridge language barriers and brings people closer together.

**Happy Translating! 🌍✨**

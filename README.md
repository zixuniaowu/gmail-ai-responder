# Gmail AI Responder

A Chrome extension that uses Google's Gemini AI to automatically generate replies in Gmail.

## Features

- Integrates seamlessly with Gmail's interface
- Uses Google Gemini API for generating intelligent email replies
- Customizable response tone (Professional, Friendly, Concise, Detailed)
- Multi-language support with auto-detection
- Simple and intuitive user interface

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the extension directory
4. The extension will now appear in your Chrome toolbar

## Setup

1. Click on the extension icon in the Chrome toolbar
2. Enter your Google Gemini API key (required)
3. Select your preferred response tone and language settings
4. Click "Save Settings"

## Getting a Gemini API Key

1. Go to https://ai.google.dev/
2. Create or sign in to your Google AI Studio account
3. Navigate to "API Keys" in the Google AI Studio
4. Create a new API key
5. Copy the key and paste it in the extension settings

## Usage

1. While in Gmail, open or reply to an email
2. Click the AI icon in the compose toolbar (top of compose window)
3. The extension will analyze the email and generate an appropriate reply
4. Review and edit the generated response before sending

## Requirements

- Chrome browser (version 88 or higher)
- Google Gemini API key
- Active internet connection

## Development

This extension is built using:
- HTML, CSS, and JavaScript
- Chrome Extension Manifest V3
- Google Gemini API

To modify the extension:
1. Edit the files in the extension directory
2. Reload the extension in `chrome://extensions/` by clicking the refresh icon

## Notes

- The extension requires permission to access Gmail to function properly
- Your Gemini API key is stored locally in Chrome's secure storage
- Email content is sent to Google Gemini for processing, privacy policy applies

## License
by wangsh
MIT License

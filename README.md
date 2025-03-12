# Figma Design Analyzer Plugin

A Figma plugin that extracts metadata from selected frames, exports them as PNG images, and uses OpenAI's API to analyze design elements and provide structured insights.

## Features

- **Frame Selection**: Select any frame or group in Figma to analyze
- **Metadata Extraction**: Automatically extracts text, colors, aspect ratio, and other design elements
- **PNG Export**: Exports the selected frame as a PNG for visual analysis
- **OpenAI Integration**: Sends extracted data to OpenAI GPT-4 Vision for advanced AI analysis
- **Editable Results**: Review and edit the analysis before saving
- **JSON Export**: Copy the final analysis as structured JSON
- **Data Storage**: Save analysis results with the Figma file
- **Secure API Key Management**: Securely store your OpenAI API key in Figma's client storage

## API Key Setup

This plugin requires an OpenAI API key to use the AI analysis features. Your API key is stored securely in Figma's client storage and is never transmitted to any server other than OpenAI's API.

1. Get an API key from [OpenAI's platform](https://platform.openai.com/api-keys)
2. In the plugin, click the "API Key" button
3. Enter your API key in the form
4. Click "Save API Key"

## Example Output

```json
{
  "headline": "What to Do If You Can't Stop Procrastinating",
  "subheadline": null,
  "body_text": "Does this sound familiar?\n\nYou're chronically disorganized and messy, feeling guilty and embarrassed that your house is always a mess, and no matter how hard you try, you always seem to fail.\n\nIf so, you're not alone. There's a simple way to break the cycle and take back control.",
  "call_to_action": "Read the article below.",
  "disclaimer": "Results may vary due to personal features",
  "keywords": [
    "Procrastination",
    "Time Management",
    "Self-Improvement",
    "Productivity",
    "Overcoming Disorganization"
  ],
  "locale": "en",
  "aspect_ratio": "1:1",
  "background_color": "light green",
  "objects": [
    "smartphone",
    "hand",
    "alarm clock",
    "calendar",
    "task lists",
    "notification icon"
  ]
}
```

## How to Use

1. Select a frame or group in your Figma design
2. Open the Design Analyzer plugin
3. Click "Select New Frame" to analyze the selection
4. Review the extracted metadata
5. Set up your OpenAI API key if not already configured
6. Click "Analyze with OpenAI" to enhance the results with AI analysis
7. Edit the results if needed
8. Save or copy the final analysis

## Technical Implementation

- Uses Figma's Plugin API to extract metadata from selected frames
- Exports frames as PNG images for visual analysis
- Implements GPT-4 Vision API to analyze design elements
- Securely stores API keys in Figma's client storage
- Provides a modern React-based UI with Material UI components

## Development

### Prerequisites

- Node.js version 20 or higher
- pnpm package manager

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Project Structure

- `src/plugin/code.ts` - Figma plugin backend code
- `src/ui/App.tsx` - React UI component
- `manifest.json` - Plugin configuration

## License

MIT

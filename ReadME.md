# Drawing Canvas App

A powerful and intuitive drawing application built with React Native that supports multiple drawing pages, dark mode, and SVG exports.

![Drawing Canvas Interface](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled.jpg-4aGYMBmc13isQXOEg0kdfZyhdD6TUh.jpeg)

## Features

### Drawing Tools

- ✏️ **Draw Mode**: Freehand drawing with customizable stroke width
- 🔲 **Select Mode**: Select and manipulate drawn elements
- ⬆️ **Export**: Save your drawings as PNG files
- 🌓 **Theme Toggle**: Switch between light and dark modes

### Multi-page Support

![JSON Files Management](https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled2.jpg-SWkBPYS3wCctY278JwYDjmjdeUz6fu.jpeg)

- 📄 Manage multiple drawing pages as JSON files
- 🔄 Switch between pages seamlessly
- 📊 Track the number of paths in each page
- ➕ Create new pages on the fly

### Additional Features

- 💾 Automatic saving of drawings as JSON
- 🗑️ Clear canvas functionality
- 📱 Responsive design
- 🎨 Dark mode support
- 🔄 Undo/Redo support (coming soon)

## Usage

### Drawing

1. Select the "Draw" mode from the top toolbar
2. Draw freely on the canvas
3. Use the select mode to manipulate drawn elements
4. Export your drawing using the export button

### Managing Pages

1. Click the floating action button (bottom right) to open the JSON Files panel
2. Switch between different pages by selecting them
3. Create new pages using the + button
4. Each page maintains its own drawing state

### Theme

- Toggle between light and dark modes using the moon/sun icon
- Theme preference is preserved across sessions

## Technical Details

The app is built using:

- React Native for cross-platform support
- SVG for high-quality vector graphics
- JSON for storing drawing data
- Animated transitions and gestures
- Theme-aware components

## Development

To run the project locally:

```bash
# Install dependencies
npm install

# Start the development server
npm start
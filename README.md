# AI ChatBot

A full-stack AI chatbot application built with React, Express, and Anthropic's Claude API.

## Features

- **Modern UI**: Clean, dark-themed chat interface inspired by ChatGPT
- **Real-time Streaming**: AI responses stream in real-time with typing animation
- **Markdown Support**: Full markdown rendering including code blocks and lists
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Stop Generation**: Ability to cancel AI responses mid-stream
- **Conversation History**: Sidebar with chat history navigation
- **Error Handling**: Graceful error messages displayed in the chat

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)

## Project Structure

```
ai-chatbot/
├── client/              # React frontend
│   ├── src/
│   │   ├── App.jsx     # Main chat component
│   │   ├── main.jsx    # React entry point
│   │   └── index.css   # Tailwind styles
│   ├── index.html      # HTML template
│   ├── package.json
│   └── vite.config.js
├── server/              # Express backend
│   ├── server.js       # Express server with /api/chat endpoint
│   ├── package.json
│   └── .env            # API credentials
├── package.json        # Root workspace config
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Anthropic API key

### Installation

1. **Clone the repository** (or navigate to the project directory)

2. **Install dependencies** for all workspaces:

   ```bash
   npm run install-all
   ```

   Or if using npm workspaces isn't available:
   ```bash
   npm install
   cd server && npm install && cd ../client && npm install && cd ..
   ```

3. **Add your Anthropic API key**:

   The API key is already configured in `server/.env`. If you need to update it:
   - Open `server/.env`
   - Replace the value of `ANTHROPIC_API_KEY` with your key from [Anthropic Console](https://console.anthropic.com/)

### Running the Application

**Option 1: Run both services concurrently** (from root directory):
```bash
npm run dev
```

**Option 2: Run services separately**:

Terminal 1 - Start the backend server:
```bash
cd server
npm run dev
```

Terminal 2 - Start the frontend development server:
```bash
cd client
npm run dev
```

The frontend will be available at `http://localhost:5173`
The backend server runs on `http://localhost:5000`

## How to Use

1. Open the app in your browser
2. Type your message in the input field at the bottom
3. Press `Enter` to send (or `Shift+Enter` for a new line)
4. Watch the AI response stream in real-time
5. Click "Stop" to cancel a response in progress
6. Use "New Chat" button to start a fresh conversation

## API Documentation

### POST /api/chat

Streams an AI response using Server-Sent Events (SSE).

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi there!" },
    { "role": "user", "content": "How are you?" }
  ]
}
```

**Response:** (Server-Sent Events)
```
data: {"text": "I'm "}
data: {"text": "doing "}
data: {"text": "well"}
data: {"done": true}
```

## Environment Variables

### Server (.env)

```env
ANTHROPIC_API_KEY=your_api_key_here
PORT=5000
```

## Features Explained

- **Streaming Responses**: Responses appear word-by-word as they're generated
- **Typing Animation**: Shows three bouncing dots while AI is thinking
- **Auto-scroll**: Chat automatically scrolls to the latest message
- **Dark Theme**: Easy on the eyes for extended conversations
- **Mobile Responsive**: Sidebar collapses and adapts to smaller screens
- **Stop Generation**: Red "Stop" button appears while AI is responding

## Building for Production

To build the frontend for production:

```bash
npm run build
```

The optimized build will be in `client/dist/`

## Troubleshooting

### "ANTHROPIC_API_KEY is not set"
Make sure `server/.env` file exists and contains your API key. Don't forget to restart the server after adding the key.

### Messages not sending
Check browser console (F12) for errors. Verify the backend server is running on port 5000.

### Styling looks broken
Make sure all dependencies are installed:
```bash
cd client && npm install && cd ../server && npm install
```

## License

ISC

## Support

For issues or questions about the Anthropic Claude API, visit [Anthropic Docs](https://docs.anthropic.com/)

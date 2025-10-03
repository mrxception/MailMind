# MailMind AI

An AI-powered assistant that analyzes your Gmail emails using DeepSeek AI via Hugging Face.

## Features

- **User Authentication**: Secure login and registration with session management
- **Gmail Integration**: OAuth2 connection to fetch and sync your emails
- **AI Chat Interface**: Ask questions about your emails in natural language
- **Smart Email Search**: Intelligent keyword extraction and email matching
- **Chat Sessions**: Organized conversation history with proper session management
- **Dark/Light Mode**: Toggle between themes for comfortable viewing

## Setup Instructions

### 1. Database Setup

Create a MySQL database and run the SQL scripts in order:

\`\`\`bash
# Run these scripts in order:
# 1. scripts/001_create_tables.sql
# 2. scripts/002_add_chat_sessions.sql
\`\`\`

### 2. Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gmail_chatbot

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/callback

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 3. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/gmail/callback`
5. Copy the Client ID and Client Secret to your `.env.local`

### 4. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 5. Run the Application

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` to start using the application.

## Usage

1. **Register/Login**: Create an account or sign in
2. **Connect Gmail**: Click "Connect Gmail" and authorize access
3. **Start Chatting**: Ask questions like:
   - "When can I receive my gcash cashback?"
   - "Show me emails from John"
   - "What are my recent orders?"

## Technology Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes, MySQL2
- **Authentication**: bcryptjs, session-based auth
- **AI**: DeepSeek v3 via Hugging Face
- **Email**: Google Gmail API

## How It Works

1. User asks a question in the chat interface
2. System extracts keywords from the query
3. Searches emails using FULLTEXT or LIKE queries
4. Sends relevant emails to DeepSeek AI for analysis
5. AI responds with insights based on the email content
6. Conversations are organized into sessions for easy reference

## Security Notes

- Passwords are hashed using bcryptjs
- Sessions are stored securely with HTTP-only cookies
- Gmail tokens are encrypted and stored in the database
- OAuth2 refresh tokens ensure continuous access

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 8080;

// Fill in your OpenAI API key or set it in your .env file as OPENAI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "your-api-key-here";

if (!OPENAI_API_KEY || OPENAI_API_KEY === "your-api-key-here") {
  console.error("ERROR: OpenAI API key is missing. Please set it in your environment variables or update the OPENAI_API_KEY variable.");
  process.exit(1);
}

// Default prompt to build the assistant's character
const DEFAULT_PROMPT = `Act primarily as a commercial real estate financing calculator who knows commercial real estate properties like a seasoned expert.`;

// Setup middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the 'public' directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

app.post('/chat', async (req, res) => {
    const { whole_chat } = req.body;

    // Validate incoming data
    if (!whole_chat || !Array.isArray(whole_chat) || whole_chat.length === 0) {
        return res.status(400).json({ error: "whole_chat must be a non-empty array" });
    }

    // Create the chat history for this request only, starting with the default prompt
    const chatHistory = [{'sender': 'system', 'message': DEFAULT_PROMPT}, ...whole_chat];

    // Convert chat history to a readable string for the prompt
    const historyText = chatHistory
        .map(entry => `${entry.sender}: ${entry.message}`)
        .join('\n');

    console.log(historyText); // For debugging

    try {
        const { text } = await generateText({
            model: openai('gpt-4o', { apiKey: OPENAI_API_KEY }),
            prompt: historyText, // Pass the formatted string
        });

        // Add the assistant's response to the history for the response
        const updatedChatHistory = [...chatHistory, { 'sender': 'assistant', 'message': text }];

        // Return the assistant's reply and the updated chat history
        return res.json({ reply: text, chat_history: updatedChatHistory });
    } catch (error) {
        console.error("Error calling OpenAI API:", error.message);
        res.status(500).json({ error: "Failed to get response from OpenAI API" });
    }
});

app.get('/test', async (req, res) => {
    return res.json("API is working");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

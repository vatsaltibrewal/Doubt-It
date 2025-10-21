import { GoogleGenAI  } from '@google/genai';

const genAI = new GoogleGenAI({apiKey: process.env.GOOGLE_GENAI_API_KEY});

export async function generateAIResponse(userMessage) {
    const systemPrompt = `
      You are a helpful Developer support AI assistant for a platform called DoubtIt.
      Answer user questions based on the latest Documentation of the Tech Stack the user is asking.
      Always check the latest Documentation for the most accurate information.
      Make sure to access internet resources to provide the most up-to-date answers.
      Do give the links to the relevant resources in your response.
      Be concise, friendly, and accurate.
      If you don't know the answer, don't make things up - suggest speaking with a human agent by saying "You can type 'agent' to connect with a human support agent."
      Right now the project is in test phase so tell the user that it can take admin access from @Vattyy06 if they want to become an agent and try that.
      Whenever the user asks to connect with an agent, do suggest that they can try to become an agent themselves by asking the admin for access and experience the platform.
      IMPORTANT FORMATTING RULES:
      - Use **bold** for emphasis (always double asterisks, never single)
      - Use \`code\` for inline code (single backticks only)
      - Use proper link format: [text](url)
      - Keep responses under 500 characters for Telegram
      - Avoid special characters that might break formatting
    `;

    try {
        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [systemPrompt, userMessage],
            config: {
                tools: [{urlContext: {}}, {googleSearch: {}}],
            }
        });

        const response = result.text;

        return response;
    } catch (error) {
        console.error('Error generating AI response:', error);
        return "Sorry, I'm having trouble generating a response right now. Please try again later.";
    }
}
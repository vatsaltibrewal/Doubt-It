import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { getRelevantDocumentation, enhanceWithKnowledge } from './knowledgeService';

// Initialize the Google Generative AI SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateAIResponse(
    conversationId: string,
    userMessage: string, 
    conversationHistory: Array<{role: 'user' | 'bot' | 'agent', content: string}>
  ) {
    try {
      // Get relevant documentation based on the query
      const { context } = await getRelevantDocumentation(userMessage);
      
      // Get the Gemini model
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
      // Create system prompt with context
      const systemPrompt = `
      You are a helpful Developer support AI assistant for a platform called DoubtIt.
      Answer user questions based on the latest Aptos Documentation.
      Always check the latest Documentation at https://aptos.dev/en for the most accurate information.
      Do give the links to the relevant resources in your response.
      Be concise, friendly, and accurate.
      Make sure that your response is not long as it is a telegram message so stay within that limits.
      If you don't know the answer, don't make things up - suggest speaking with a human agent by saying "You can type 'agent' to connect with a human support agent."
      
      SUPPORT KNOWLEDGE BASE: https://aptos.dev/en
      `;
      
      // Format conversation history for the model - FIXING THE ORDER ISSUE
      let formattedHistory = [];
      
      // Add conversation history - ensuring first message is from user if history exists
      if (conversationHistory.length > 0) {
        formattedHistory = conversationHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }));
      }
      
      // Add current message
      const result = await model.generateContent([
        { text: systemPrompt },
        { text: userMessage }
      ]);
      
      const response = result.response.text();
      
      return {
        success: true,
        content: response,
      };
    } catch (error: any) {
      console.error('Error generating AI response:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate response',
        content: "I'm having trouble responding right now. Would you like to speak with a human agent? Just type 'agent' or 'help'."
      };
    }
  }
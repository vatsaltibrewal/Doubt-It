import { GoogleGenAI  } from '@google/genai';
import { getRelevantDocumentation, enhanceWithKnowledge } from './knowledgeService';

// Initialize the Google Generative AI SDK
const genAI = new GoogleGenAI ({});

export async function generateAIResponse(
    conversationId: string,
    userMessage: string, 
    conversationHistory: Array<{role: 'user' | 'bot' | 'agent', content: string}>
  ) {
    try {
      // Get relevant documentation based on the query
      // const { context } = await getRelevantDocumentation(userMessage);
  
      // Create system prompt with context
      const systemPrompt = `
      You are a helpful Developer support AI assistant for a platform called DoubtIt.
      Answer user questions based on the latest Documentation of the Tech Stack the user is asking.
      Always check the latest Documentation for the most accurate information.
      Make sure to access internet resources to provide the most up-to-date answers.
      Do give the links to the relevant resources in your response.
      Be concise, friendly, and accurate.
      If you don't know the answer, don't make things up - suggest speaking with a human agent by saying "You can type 'agent' to connect with a human support agent."
      Right now the project is in test phase so tell the user that it can take admin access from @Vattyy06 if they want to become an agent and try that.
      Whenevr the user asks to connect with an agent, do suggest that they can try to become an agent themselves by asking the admin for access and experience the platform.
      Make sure that your response is not long as it is a telegram message so stay within that limits.
      `;
      
      // Format conversation history for the model - FIXING THE ORDER ISSUE
      // let formattedHistory = [];
      
      // // Add conversation history - ensuring first message is from user if history exists
      // if (conversationHistory.length > 0) {
      //   formattedHistory = conversationHistory.map(msg => ({
      //     role: msg.role === 'user' ? 'user' : 'model',
      //     parts: [{ text: msg.content }],
      //   }));
      // }
      
      // Add current message
      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: systemPrompt },
          { text: userMessage }
        ],
        config: {
          tools: [{googleSearch: {}}],
        }
      });
      
      const response = result.text;
      
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

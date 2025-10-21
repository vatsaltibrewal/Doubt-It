# DoubtIt: AI-Powered Developer Support Platform

![DoubtIt Logo](/frontend/public/doubtItLogo.png)

## What is DoubtIt?

DoubtIt is an intelligent developer support platform that bridges the gap between AI and human expertise. It provides a seamless experience where developers can quickly get answers to technical questions from an AI assistant, with the option to seamlessly transition to a human expert when needed.

Imagine you're debugging a complex issue or trying to understand a framework. With DoubtIt:

1. Ask your question to our Telegram bot
2. Get instant, contextual answers from our Gemini AI model trained on all documentation
3. If you need more clarification or the AI can't solve your problem, simply type "agent" to connect with a human expert
4. Support agents see the full conversation history and can seamlessly take over

## How DoubtIt Works

![DoubtIt Architecture Diagram](/frontend/public/doubtItDescription.png)

Developer support is often fragmented across documentation, GitHub issues, Stack Overflow, Discord, and more. DoubtIt consolidates this experience:

- **Instant answers**: Get solutions to common problems without waiting
- **Contextual understanding**: The AI understands your specific problem and conversation history
- **Human expertise when needed**: Seamless transition to experienced support agents
- **No more context switching**: Stay in one conversation from issue to resolution

## Features

### For Developers
- 🤖 **AI-First Assistance**: Gemini AI provides accurate technical responses
- 📱 **Telegram Integration**: Ask questions in the familiar Telegram interface
- 👨‍💻 **Expert Takeover**: Connect with human experts when needed
- 🔄 **Continuous Learning**: The system improves as it learns from interactions

### For Support Teams
- 📊 **Comprehensive Dashboard**: Monitor all support conversations
- 📝 **Full Context**: See the entire history when joining a conversation
- ⚡ **Efficiency**: AI handles routine questions, humans focus on complex issues
- 📈 **Analytics**: Track patterns in questions to improve documentation

## Tech Stack

- **Frontend**: Next.js deployed on Vercel
- **Backend**: Express.js deployed on AWS Lambda
- **Database**: AWS Dynamodb
- **Authentication**: AWS Cognito
- **Realtime**: AWS Websocket API Gateway + Lambda
- **Bot Platform**: Telegram with Telegraf
- **AI**: Google Gemini AI

## How It Works

1. **User sends a question via Telegram**
   - "How do I structure a Move module in Aptos?"

2. **AI analyzes the question and responds**
   - The Gemini model processes the query against Aptos documentation
   - Returns a concise, accurate response with relevant code examples and links

3. **If the user needs more help**
   - They can type "agent" or "help" 
   - The system flags the conversation for human support
   - Support agents are notified of a pending request

4. **Human experts join the conversation**
   - They see the full history and AI responses
   - Take over to provide specialized assistance
   - Can close the conversation once the issue is resolved

5. **The system learns from each interaction**
   - Successful resolutions improve future AI responses
   - Common issues are identified for documentation improvements

## Vision

Our vision is to create a developer support ecosystem where:

1. **Knowledge flows freely** between AI systems and human experts
2. **Response times decrease** while solution quality increases
3. **Support teams scale effectively** by focusing on complex problems
4. **Developers stay in flow** by getting answers where they already work

DoubtIt is starting with all Frameworks, but our approach can be applied to any technical domain where rapid, accurate support is critical.

## License

This project is licensed under the Mozilla Public License - see the [LICENSE](LICENSE) file for details.

---

*DoubtIt: Where AI and human expertise converge to power developer success.*

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini AI client
// Using GEMINI_API_KEY from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const askAi = async (req, res) => {
    try {
        const { prompt, code } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, message: 'Prompt is required' });
        }

        // Prepare the model
        // Using gemini-2.5-flash as requested
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Construct the context-aware prompt
        let fullPrompt = `You are a helpful AI coding assistant integrated into a code editor.
The user is asking the following question or request:
"${prompt}"
`;

        if (code) {
            fullPrompt += `
Here is the current code context from their editor:
\`\`\`
${code}
\`\`\`
`;
        }

        fullPrompt += `
Please provide your response in proper markdown format. Explain clearly and concisely.`;

        // Generate the content
        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        res.status(200).json({ success: true, response: responseText });
    } catch (error) {
        console.error('Error in askAi controller:', error);
        res.status(500).json({ success: false, message: 'Failed to generate AI response', error: error.message });
    }
};

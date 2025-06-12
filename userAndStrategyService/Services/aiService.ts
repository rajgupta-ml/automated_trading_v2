import { GoogleGenAI } from '@google/genai';
import { expressionTreePrompt } from '../data/prompt';
import { config } from '../utils/config';
const buildASTFromPlainText = async () => {
    const ai = new GoogleGenAI({
        apiKey: config.ai.apiKey,
    });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: 'If 14-day RSI is greater than 70 then sell.',
        config: {
            systemInstruction: expressionTreePrompt,
            temperature: 0.1,
            thinkingConfig: {
                thinkingBudget: 0,
            },
        },
    });

    console.log(response.text);
};

buildASTFromPlainText();

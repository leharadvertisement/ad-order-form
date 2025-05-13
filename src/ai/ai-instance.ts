import {genkit} from 'genkit';
// import {googleAI} from '@genkit-ai/googleai'; // Temporarily commented out

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    // googleAI({ // Temporarily commented out
    //   apiKey: process.env.GOOGLE_GENAI_API_KEY,
    // }),
  ],
  // model: 'googleai/gemini-2.0-flash', // Temporarily commented out global model
});

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit instance configured for Google AI.
 * 
 * Note: GOOGLE_GENAI_API_KEY or GEMINI_API_KEY must be set in your environment.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit instance configured for Production Google AI.
 * 
 * IMPORTANT: For production/hosting, ensure GEMINI_API_KEY is set in your 
 * environment variables (e.g., Firebase App Hosting Secrets).
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

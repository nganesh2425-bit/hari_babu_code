'use server';

/**
 * @fileOverview An AI agent that summarizes and extracts structured data from PDF content.
 *
 * - summarizePdf - A function that handles the summarization and data extraction process.
 * - SummarizePdfInput - The input type for the summarizePdf function.
 * - SummarizePdfOutput - The return type for the summarizePdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePdfInputSchema = z.object({
  text: z
    .string()
    .describe('The extracted text content from the PDF document.'),
});
export type SummarizePdfInput = z.infer<typeof SummarizePdfInputSchema>;

const AdvisorySchema = z.object({
  cropName: z.string().describe('The name of the crop.'),
  cropStage: z.string().describe('The current stage of the crop.'),
  advisory: z.string().describe('The specific agromet advisory for the crop stage.'),
});

const WeatherDataSchema = z.object({
    district: z.string().describe('The name of the district.'),
    date: z.string().describe('The date of the weather forecast.'),
    maxTemp: z.string().describe('Maximum temperature value, including units (e.g., "38.2°C").'),
    minTemp: z.string().describe('Minimum temperature value, including units (e.g., "25.5°C").'),
    rainfall: z.string().describe('Rainfall amount, including units (e.g., "5 mm").'),
    cloudCover: z.string().describe('Cloud cover description (e.g., "Partly cloudy").'),
    rhMax: z.string().describe('Maximum relative humidity percentage, including units (e.g., "90%").'),
    rhMin: z.string().describe('Minimum relative humidity percentage, including units (e.g., "80%").'),
    windSpeed: z.string().describe('Wind speed, including units (e.g., "10 kmph").'),
    windDirection: z.string().describe('Wind direction, including units or degrees (e.g., "NE" or "45 deg").'),
});

const SummarizePdfOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the PDF content.'),
  advisories: z
    .array(AdvisorySchema)
    .describe('A list of agromet advisories, if present in the document.'),
  weatherData: z.array(WeatherDataSchema).describe('A list of weather data points, if present in the document.')
});
export type SummarizePdfOutput = z.infer<typeof SummarizePdfOutputSchema>;

export async function summarizePdf(input: SummarizePdfInput): Promise<SummarizePdfOutput> {
  return summarizePdfFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePdfPrompt',
  input: {schema: SummarizePdfInputSchema},
  output: {schema: SummarizePdfOutputSchema},
  prompt: `You are an expert at extracting agricultural and meteorological information from documents.
  
  First, create a concise summary of the following PDF content.

  Next, look for any agromet advisory information. For each crop mentioned, extract the 'crop name', its 'crop stage', and the specific 'Agromet Advisory' text associated with it. Structure this into a list of advisories.

  Then, look for any weather data tables or summaries. For each district or location, extract the 'District', 'Date', 'Rainfall', 'T-MAX' (Maximum Temperature), 'T-MIN' (Minimum Temperature), 'Cloud Cover', 'Rh Max' (Maximum Relative Humidity), 'Rh Min' (Minimum Relative Humidity), 'Wind speed', and 'Wind Direction'. Include units in the values.

  If no agromet advisories are found, return an empty array for the 'advisories' field.
  If no weather data is found, return an empty array for the 'weatherData' field.

  PDF Content:
  {{{text}}}`,
});

const summarizePdfFlow = ai.defineFlow(
  {
    name: 'summarizePdfFlow',
    inputSchema: SummarizePdfInputSchema,
    outputSchema: SummarizePdfOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

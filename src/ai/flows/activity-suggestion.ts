// src/ai/flows/activity-suggestion.ts
'use server';
/**
 * @fileOverview Provides activity suggestions based on location and description.
 *
 * - suggestActivity - A function that suggests activities based on the provided location and description.
 * - SuggestActivityInput - The input type for the suggestActivity function.
 * - SuggestActivityOutput - The return type for the suggestActivity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestActivityInputSchema = z.object({
  zone: z.string().describe('The zone of the location.'),
  section: z.string().describe('The section of the location.'),
  description: z.string().describe('The description of the work being performed.'),
});
export type SuggestActivityInput = z.infer<typeof SuggestActivityInputSchema>;

const SuggestActivityOutputSchema = z.object({
  suggestedActivities: z
    .array(z.string())
    .describe('An array of suggested activities based on the input.'),
});
export type SuggestActivityOutput = z.infer<typeof SuggestActivityOutputSchema>;

export async function suggestActivity(input: SuggestActivityInput): Promise<SuggestActivityOutput> {
  return suggestActivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestActivityPrompt',
  input: {schema: SuggestActivityInputSchema},
  output: {schema: SuggestActivityOutputSchema},
  prompt: `You are an expert in suggesting activities based on location and description.

  Given the following location (zone and section) and a description of the work being performed, suggest a list of activities that are most relevant.

  Location:
  Zone: {{{zone}}}
  Section: {{{section}}}

  Description of Work: {{{description}}}

  Suggested Activities:`,
});

const suggestActivityFlow = ai.defineFlow(
  {
    name: 'suggestActivityFlow',
    inputSchema: SuggestActivityInputSchema,
    outputSchema: SuggestActivityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

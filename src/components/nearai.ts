import OpenAI from 'openai';

export async function getFileCredibilityScoreFromBuffer(
  fileBuffer: ArrayBuffer | Uint8Array, 
  description: string
): Promise<number> {
  try {
    const openai = new OpenAI({
      baseURL: `${window.location.origin}/near-api/v1`,
      apiKey: import.meta.env.VITE_OPENAI_API_KEY, 
      dangerouslyAllowBrowser: true,
    });

    // Browser-compatible base64 encoding
    const uint8Array = fileBuffer instanceof ArrayBuffer 
      ? new Uint8Array(fileBuffer) 
      : fileBuffer;
    
    const base64Image = btoa(
      uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const response = await openai.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3.1',
      messages: [
        {
          role: 'system',
          content: `You are an expert digital product appraiser. Analyze the provided file and the seller's description. Strictly return the credibility score as a single numeric value between 60 and 100 and nothing else (no JSON, no text).`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Seller Description: ${description}` },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'text' },
      max_tokens: 10,
    });

    const content = response.choices?.[0]?.message?.content || '';
    const scoreMatch = content.trim().match(/\d{1,3}(?:\.\d+)?/);
    if (!scoreMatch) throw new Error('Failed to parse score from AI response: ' + content);
    const score = parseFloat(scoreMatch[0]);
    console.log('NEAR AI credibility score:', score);
    return score;
  } catch (error) {
    console.error('Credibility Check Failed:', error);
    throw error;
  }
}
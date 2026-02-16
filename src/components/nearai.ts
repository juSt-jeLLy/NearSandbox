import OpenAI from 'openai';
import fs from 'fs';

// const openai = new OpenAI({
//   baseURL: 'https://cloud-api.near.ai/v1',
//   apiKey: process.env.OPENAI_API_KEY, 
// });


async function getFileCredibilityScore(filePath: string, description: string) {
  const imageBuffer = fs.readFileSync(filePath);
  return getFileCredibilityScoreFromBuffer(imageBuffer, description);
}


export async function getFileCredibilityScoreFromBuffer(fileBuffer: Buffer | Uint8Array, description: string): Promise<number> {
  try {
  
  const openai = new OpenAI({
  baseURL: `${window.location.origin}/near-api/v1`,
  apiKey: process.env.OPENAI_API_KEY, 
  dangerouslyAllowBrowser: true,
  });
    const base64Image = Buffer.from(fileBuffer).toString('base64');
    // Try to infer an image type (fallback to png)
    const fileExtension = 'png';

    const response = await openai.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3.1',
      messages: [
        {
          role: 'system',
          content: `You are an expert digital product appraiser. Analyze the provided file and the seller's description. Strictly return the credibility score as a single numeric value between 0 and 100 and nothing else (no JSON, no text). Give atleast 1 `
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Seller Description: ${description}` },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/${fileExtension};base64,${base64Image}`,
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


async function uploadToNearCloud(filePath: string) {
  const openai = new OpenAI({
  baseURL: 'https://cloud-api.near.ai/v1',
  apiKey: process.env.OPENAI_API_KEY, 
});
  const file = await openai.files.create({
    file: fs.createReadStream(filePath),
    purpose: 'assistants',
  });

  console.log(`Uploaded to NEAR AI Cloud. File ID: ${file.id}`);
  return file.id;
}


const sellerDesc = "High-resolution 3D architectural render of a modern villa.";
getFileCredibilityScore('./product_preview.png', sellerDesc);
import Groq from 'npm:groq-sdk';
import { YoutubeTranscript } from "npm:youtube-transcript";
import { serve } from "https://deno.land/std/http/server.ts";

const client = new Groq({
  // Your Groq API key (for example, from an environment variable)
  apiKey: Deno.env.get("GROQ_API_KEY"),
});

async function cleanTranscript(rawTranscript: string) {
  const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [
    {
      role: "system",
      content: `You are an expert transcription editor. 
Your job is to take raw YouTube transcripts that are often messy (including unwanted formatting, timestamps, extraneous punctuation, and other artifacts) and produce a clean, readable transcript.
Only make inferences where the original transcript is unclear; otherwise, preserve the spoken words as faithfully as possible.`,
    },
    {
      role: "user",
      content: `Please clean up the following transcript and output only the cleaned text:
      
${rawTranscript}
ß
Make sure to remove any timestamps or formatting artifacts and fix minor errors where needed.`,
    },
  ];

  // Create a chat completion request using the Groq SDK
  const response = await client.chat.completions.create({
    messages,
    // Specify the model (choose one that suits your needs)
    model: "llama-3.2-3b-preview",
    // Adjust temperature and token limits as needed for controlled output
    temperature: 0.3,
    max_completion_tokens: 1024,
  });

  // Return the cleaned transcript from the assistant's reply
  return response.choices[0].message.content;
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  if (request.method === "GET") {
    if (url.pathname === "/") {
      return new Response(await Deno.readFile("index.html"), {
        headers: { "content-type": "text/html" },
      });
    }
  }

  if (request.method === "POST" && url.pathname === "/transcript") {
    const data = await request.json();
    const youtubeUrl = data.url;
    
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(youtubeUrl);
      const dirtyTranscript = transcript.map(item => item.text).join("\n");
      const cleanedTranscript = await cleanTranscript(dirtyTranscript);
      
      return new Response(JSON.stringify({ transcript: cleanedTranscript }), {
        headers: { "content-type": "application/json" },
      });
    } catch (error: unknown) {
      return new Response(JSON.stringify({ error: "Could not fetch transcript, maybe the video's transcript was too long?" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
  }

  return new Response("Not found", { status: 404 });
}

if (import.meta.main) {
  serve(handleRequest, { port: 8000 });
}

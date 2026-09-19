import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callOpenRouter(messages: any[], model = 'meta-llama/llama-3.3-70b-instruct:free') {
  const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openrouterKey) throw new Error('Missing OPENROUTER_API_KEY');

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openrouterKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://devconnect.app",
      "X-Title": "DevConnect",
    },
    body: JSON.stringify({ model, messages, temperature: 0.7 }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter error:', errorText);
    throw new Error(`AI service error: ${response.status}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, ...body } = await req.json();

    let output: any;

    switch (action) {

      case 'profile-summary': {
        const text = await callOpenRouter([
          { role: 'system', content: 'You are a professional technical writer. Write concisely and professionally.' },
          { role: 'user', content: `Write a 120-word professional bio for a developer named ${body.name || 'Developer'}.
Skills: ${(body.skills || []).join(', ') || 'Not listed'}
Projects: ${(body.projects || []).join(', ') || 'Not listed'}
Experience: ${(body.experience || []).join(', ') || 'Not listed'}
Output ONLY the bio text, no headings or extra formatting.` },
        ]);
        output = { summary: text };
        break;
      }

      case 'blog-assist': {
        const text = await callOpenRouter([
          { role: 'system', content: 'You are an expert technical editor. Always respond with valid JSON only, no markdown code fences.' },
          { role: 'user', content: `Analyze this blog draft and return a JSON object with:
- "titles": array of 3 catchy title ideas (strings)
- "tags": array of 5 relevant tags (strings, no # prefix)
- "grammar_fixes": array of 3 grammar/style fixes (strings)
- "outline": array of 4 outline improvement suggestions (strings)

Draft: ${body.draft}` },
        ]);
        try {
          output = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
        } catch {
          output = {
            titles: ['Improving Your Draft', 'A Better Approach', 'Key Insights'],
            tags: ['programming', 'development', 'tips', 'tutorial', 'coding'],
            grammar_fixes: ['Review sentence structure for clarity.', 'Check for consistent tense usage.', 'Ensure proper punctuation throughout.'],
            outline: ['Add an engaging introduction.', 'Break content into clear sections.', 'Add code examples.', 'Write a strong conclusion.'],
          };
        }
        break;
      }

      case 'skill-gap': {
        const text = await callOpenRouter([
          { role: 'system', content: 'You are a career advisor for software engineers. Always respond with valid JSON only, no markdown code fences.' },
          { role: 'user', content: `Analyze the skill gap for a developer targeting the role of "${body.role || 'Senior Developer'}".
Current skills: ${(body.skills || []).join(', ')}
Location preference: ${body.location || 'Remote'}

Return a JSON object with:
- "missing_skills": array of 5 most critical missing skills (strings)
- "strengths": array of 3 existing strengths (strings)  
- "roadmap": array of 4 objects each with "step" (number), "title" (string), "detail" (string)` },
        ]);
        try {
          output = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
        } catch {
          output = {
            missing_skills: ['System Design', 'Cloud Architecture (AWS/GCP)', 'CI/CD Pipelines', 'Kubernetes', 'Performance Optimization'],
            strengths: ['Strong coding fundamentals', 'Good problem-solving skills', 'Existing technical skills'],
            roadmap: [
              { step: 1, title: 'Master System Design', detail: 'Study distributed systems, scalability patterns, and practice on LeetCode.' },
              { step: 2, title: 'Cloud Certification', detail: 'Complete AWS Solutions Architect Associate or Google Cloud Professional certificate.' },
              { step: 3, title: 'DevOps Fundamentals', detail: 'Learn Docker, Kubernetes basics, and set up a CI/CD pipeline for a personal project.' },
              { step: 4, title: 'Open Source Contribution', detail: 'Contribute to projects related to your target role to build portfolio evidence.' },
            ],
          };
        }
        break;
      }

      case 'code-review': {
        const text = await callOpenRouter([
          { role: 'system', content: 'You are a senior software engineer. Always respond with valid JSON only, no markdown code fences.' },
          { role: 'user', content: `Review this ${body.language || 'code'} snippet and return a JSON object with:
- "severity": overall severity ("low" | "medium" | "high")
- "issues": array of objects with "severity" ("low"|"medium"|"high"), "message" (string), "line" (number or null)
- "suggestions": array of 3 improvement suggestions (strings)

Code:
${body.code}` },
        ], 'qwen/qwen-2.5-coder-32b-instruct:free');
        try {
          output = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
        } catch {
          output = { severity: 'low', issues: [], suggestions: ['Code looks clean.', 'Consider adding comments.', 'Write unit tests.'] };
        }
        break;
      }

      case 'project-description': {
        const text = await callOpenRouter([
          { role: 'system', content: 'You are an expert project manager. Write concise, professional project descriptions.' },
          { role: 'user', content: `Write a 2-paragraph professional description for:
Title: ${body.title || 'Untitled Project'}
Tech stack: ${(body.tech || []).join(', ') || 'Not specified'}
Repo: ${body.repoUrl || 'Not provided'}
Output ONLY the description text.` },
        ]);
        output = { description: text };
        break;
      }

      case 'chat': {
        const messages: any[] = [
          { role: 'system', content: 'You are a helpful AI assistant for developers on DevConnect. You help with coding questions, career advice, and technical discussions. Be concise and practical.' },
        ];
        if (body.history?.length) messages.push(...body.history);
        messages.push({ role: 'user', content: body.message });
        const text = await callOpenRouter(messages);
        output = { reply: text };
        break;
      }

      case 'resume': {
        const text = await callOpenRouter([
          { role: 'system', content: 'You are an expert resume writer for software engineers. Write clean, ATS-friendly markdown.' },
          { role: 'user', content: `Generate a professional one-page developer resume in Markdown format.
Structure: # Name, ## Summary, ## Skills, ## Experience, ## Projects, ## Education
Make it realistic with placeholder data clearly marked with [brackets]. Keep it concise and impactful.` },
        ]);
        output = { markdown: text };
        break;
      }

      case 'search': {
        const text = await callOpenRouter([
          { role: 'system', content: 'You are a developer discovery assistant.' },
          { role: 'user', content: `Help find developers matching: ${body.query}. Suggest 3 search strategies.` },
        ]);
        output = { suggestions: text };
        break;
      }

      default:
        throw new Error('Invalid action: ' + action);
    }

    return new Response(JSON.stringify(output), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'AI service error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

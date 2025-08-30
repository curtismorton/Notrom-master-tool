import { OpenAI } from 'openai';
import type { WebsiteBrief, WebsitePlan } from '@shared/schema';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function generateWebsitePlan(brief: WebsiteBrief): Promise<Omit<WebsitePlan, 'id' | 'briefId' | 'createdAt' | 'updatedAt'>> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert website strategist and copywriter for a premium web development agency. 
        Create a comprehensive website plan that includes strategic copy, asset requirements, and content strategy.
        
        Generate compelling, conversion-focused copy that speaks directly to the target audience.
        Be specific about asset needs and provide clear guidance for content creation.
        
        Respond with JSON in this exact format:
        {
          "copyPlan": {
            "homepage": {
              "headline": "Powerful, benefit-focused headline under 10 words",
              "subheadline": "Supporting headline that elaborates on the benefit",
              "heroDescription": "2-3 sentence description that builds trust and explains value",
              "ctaText": "Action-oriented button text"
            },
            "about": {
              "story": "Compelling brand story that connects with audience",
              "mission": "Clear mission statement",
              "values": ["value1", "value2", "value3"]
            },
            "services": [
              {
                "name": "Service name",
                "description": "Benefit-focused service description",
                "benefits": ["benefit1", "benefit2", "benefit3"]
              }
            ],
            "testimonials": {
              "strategy": "Strategy for gathering and presenting testimonials",
              "sampleQuestions": ["question1", "question2", "question3"]
            }
          },
          "assetRequirements": {
            "photography": ["specific photo needs"],
            "graphics": ["specific graphic needs"],
            "videos": ["specific video needs"],
            "documents": ["specific document needs"]
          },
          "contentStrategy": {
            "brandVoice": "Description of brand voice and personality",
            "tonalGuidelines": ["guideline1", "guideline2"],
            "messagingPillars": ["pillar1", "pillar2", "pillar3"],
            "contentPriorities": ["priority1", "priority2"]
          },
          "technicalSpecs": {
            "features": ["feature requirements"],
            "integrations": ["needed integrations"],
            "performanceTargets": ["performance goals"]
          },
          "status": "draft"
        }`
      },
      {
        role: 'user',
        content: `Create a comprehensive website plan for:
        
        Business: ${brief.businessName}
        Industry: ${brief.industry}
        Target Audience: ${brief.targetAudience}
        Goals: ${brief.goals.join(', ')}
        Competitors: ${brief.competitors.join(', ')}
        Brand Personality: ${brief.brandPersonality}
        Preferred Colors: ${brief.preferredColors.join(', ')}
        Content Needs: ${brief.contentNeeds.join(', ')}
        Special Requirements: ${brief.specialRequirements}
        
        Focus on creating copy that converts and clearly define all assets needed for the website.`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

export async function generateAdditionalCopy(
  plan: WebsitePlan, 
  request: string
): Promise<{ content: string; suggestions: string[] }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a professional copywriter specializing in web content. 
        Generate additional copy that matches the existing brand voice and strategy.
        
        Respond with JSON in this format:
        {
          "content": "The requested copy content",
          "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
        }`
      },
      {
        role: 'user',
        content: `Based on this existing website plan:
        
        Brand Voice: ${plan.contentStrategy.brandVoice}
        Messaging Pillars: ${plan.contentStrategy.messagingPillars.join(', ')}
        Existing Homepage Headline: ${plan.copyPlan.homepage.headline}
        
        Generate: ${request}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}
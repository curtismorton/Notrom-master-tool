import { https } from 'firebase-functions/v2';
import { storage as firebaseStorage } from 'firebase-functions/v2';
import { db, storage, logActivity } from '../firebase-admin';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const transcribeSchema = z.object({
  meetingId: z.string(),
  storageUrl: z.string().optional(),
  audioFile: z.string().optional(), // Base64 encoded audio
});

export const transcribeAndSummarize = https.onCall(async (request) => {
  try {
    const { meetingId, storageUrl, audioFile } = transcribeSchema.parse(request.data);
    
    if (!storageUrl && !audioFile) {
      throw new https.HttpsError('invalid-argument', 'Either storageUrl or audioFile must be provided');
    }

    // Get meeting document
    const meetingDoc = await db.collection('meetings').doc(meetingId).get();
    if (!meetingDoc.exists) {
      throw new https.HttpsError('not-found', 'Meeting not found');
    }

    const meetingData = meetingDoc.data();
    
    // Download audio file from Firebase Storage if URL provided
    let audioBuffer: Buffer;
    
    if (storageUrl) {
      const bucket = storage.bucket();
      const file = bucket.file(storageUrl.replace(`gs://${bucket.name}/`, ''));
      const [fileContents] = await file.download();
      audioBuffer = fileContents;
    } else if (audioFile) {
      audioBuffer = Buffer.from(audioFile, 'base64');
    } else {
      throw new https.HttpsError('invalid-argument', 'No audio data provided');
    }

    // Transcribe audio using Whisper
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], 'audio.m4a', { type: 'audio/m4a' }),
      model: 'whisper-1',
      language: 'en',
      response_format: 'text',
    });

    // Generate AI summary and action items
    const summaryResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that analyzes meeting transcripts for a web development agency. 
          Create a concise summary focusing on:
          1. Key project requirements and goals
          2. Budget and timeline discussions
          3. Technical specifications mentioned
          4. Client concerns or questions
          5. Next steps and action items
          
          Respond with JSON in this format:
          {
            "summary": "Brief overview of the meeting",
            "keyPoints": ["point1", "point2", "point3"],
            "actionItems": ["action1", "action2"],
            "budget": "budget information if mentioned",
            "timeline": "timeline information if mentioned",
            "concerns": ["any concerns raised"],
            "nextSteps": ["specific next steps discussed"]
          }`
        },
        {
          role: 'user',
          content: `Please analyze this meeting transcript and provide a summary:\n\n${transcription}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const analysis = JSON.parse(summaryResponse.choices[0].message.content || '{}');

    // Store transcript and analysis
    const transcriptUrl = await storeTranscript(meetingId, transcription);
    
    // Update meeting document
    await db.collection('meetings').doc(meetingId).update({
      transcriptUrl,
      aiSummary: analysis.summary,
      actionItems: analysis.actionItems || [],
      updatedAt: Date.now(),
    });

    // Create asset record for transcript
    await db.collection('assets').add({
      clientId: meetingData?.clientId,
      projectId: meetingData?.projectId,
      kind: 'transcript',
      storagePath: transcriptUrl,
      status: 'approved',
      createdAt: Date.now(),
    });

    // Log activity
    await logActivity({
      byUid: 'system',
      action: 'meeting_transcribed',
      payload: { meetingId, transcriptLength: transcription.length },
      clientId: meetingData?.clientId,
    });

    // If this was a discovery call and analysis shows potential, auto-qualify lead
    if (meetingData?.type === 'discovery' && meetingData?.leadId) {
      await handleDiscoveryCallAnalysis(meetingData.leadId, analysis);
    }

    return {
      success: true,
      transcript: transcription,
      analysis,
      transcriptUrl,
    };
  } catch (error) {
    console.error('Transcription error:', error);
    
    if (error instanceof z.ZodError) {
      throw new https.HttpsError('invalid-argument', 'Invalid transcription request data');
    }
    
    if (error instanceof https.HttpsError) {
      throw error;
    }
    
    throw new https.HttpsError('internal', 'Failed to transcribe and analyze meeting');
  }
});

// Storage trigger for automatic transcription when files are uploaded
export const onRecordingUpload = firebaseStorage.onObjectFinalized(async (object) => {
  const filePath = object.name;
  
  // Only process audio files in the recordings directory
  if (!filePath?.includes('recordings/') || !isAudioFile(filePath)) {
    return;
  }

  // Extract meeting ID from file path (e.g., recordings/meeting-123/audio.m4a)
  const pathParts = filePath.split('/');
  if (pathParts.length < 2) {
    console.log('Invalid file path structure');
    return;
  }

  const meetingId = pathParts[1].replace('meeting-', '');
  
  try {
    // Trigger transcription
    await transcribeAndSummarize.handler({
      data: {
        meetingId,
        storageUrl: `gs://${object.bucket}/${filePath}`,
      }
    } as any);
  } catch (error) {
    console.error('Auto-transcription failed:', error);
  }
});

async function storeTranscript(meetingId: string, transcript: string): Promise<string> {
  const bucket = storage.bucket();
  const fileName = `transcripts/meeting-${meetingId}-transcript.txt`;
  const file = bucket.file(fileName);
  
  await file.save(transcript, {
    metadata: {
      contentType: 'text/plain',
      metadata: {
        meetingId,
        createdAt: new Date().toISOString(),
      },
    },
  });

  return fileName;
}

async function handleDiscoveryCallAnalysis(leadId: string, analysis: any) {
  try {
    const leadRef = db.collection('leads').doc(leadId);
    const leadDoc = await leadRef.get();
    
    if (!leadDoc.exists) return;

    const leadData = leadDoc.data();
    
    // Determine if lead should be qualified based on analysis
    let shouldQualify = false;
    let qualificationReason = '';

    // Check for budget indicators
    if (analysis.budget && analysis.budget.includes('$')) {
      shouldQualify = true;
      qualificationReason += 'Budget discussed. ';
    }

    // Check for timeline urgency
    if (analysis.timeline && (analysis.timeline.includes('urgent') || analysis.timeline.includes('soon'))) {
      shouldQualify = true;
      qualificationReason += 'Urgent timeline. ';
    }

    // Check for specific technical requirements
    if (analysis.keyPoints.some((point: string) => 
      point.includes('ecommerce') || point.includes('CMS') || point.includes('integration')
    )) {
      shouldQualify = true;
      qualificationReason += 'Technical requirements identified. ';
    }

    if (shouldQualify) {
      await leadRef.update({
        status: 'qualified',
        notes: `${leadData?.notes || ''}\n\nDiscovery Call Analysis:\n${analysis.summary}\n\nQualification: ${qualificationReason}`,
        updatedAt: Date.now(),
      });

      // Create client and project records for qualified leads
      await createClientAndProject(leadId, leadData, analysis);
    }
  } catch (error) {
    console.error('Discovery call analysis error:', error);
  }
}

async function createClientAndProject(leadId: string, leadData: any, analysis: any) {
  try {
    // Create client record
    const clientData = {
      company: leadData.company,
      legalName: leadData.company,
      contacts: [{
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone || '',
        role: 'Primary Contact',
      }],
      billingEmail: leadData.email,
      plan: 'none',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const clientRef = await db.collection('clients').add(clientData);

    // Create project record
    const projectData = {
      clientId: clientRef.id,
      package: determinePackageFromAnalysis(analysis),
      tech: 'nextjs_vercel', // Default tech stack
      status: 'intake',
      milestones: {
        intakeDate: Date.now(),
      },
      clientNotes: analysis.summary,
      internalNotes: `Converted from lead ${leadId}. Discovery call analysis: ${JSON.stringify(analysis)}`,
      launchChecklistStatus: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const projectRef = await db.collection('projects').add(projectData);

    // Update lead with client and project references
    await db.collection('leads').doc(leadId).update({
      clientId: clientRef.id,
      projectId: projectRef.id,
      updatedAt: Date.now(),
    });

    // Log conversion
    await logActivity({
      byUid: 'system',
      action: 'lead_converted_to_project',
      payload: { leadId, clientId: clientRef.id, projectId: projectRef.id },
      clientId: clientRef.id,
      projectId: projectRef.id,
    });
  } catch (error) {
    console.error('Client/project creation error:', error);
  }
}

function determinePackageFromAnalysis(analysis: any): 'starter' | 'standard' | 'premium' {
  const keyPoints = analysis.keyPoints.join(' ').toLowerCase();
  
  if (keyPoints.includes('ecommerce') || keyPoints.includes('complex') || keyPoints.includes('integration')) {
    return 'premium';
  } else if (keyPoints.includes('cms') || keyPoints.includes('blog') || keyPoints.includes('multi-page')) {
    return 'standard';
  } else {
    return 'starter';
  }
}

function isAudioFile(fileName: string): boolean {
  const audioExtensions = ['.mp3', '.m4a', '.wav', '.mp4', '.mov'];
  return audioExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

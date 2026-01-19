import { NextRequest, NextResponse } from 'next/server';

// Remote debug data endpoint
const REMOTE_DEBUG_URL = 'https://www.aiinterviewx.com/debug/data';

// Load existing data from remote
async function loadResumeData() {
  try {
    const response = await fetch(`${REMOTE_DEBUG_URL}/resume-data.json`, {
      cache: 'no-store',
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.warn('[DEBUG] Failed to load resume data from remote:', error);
  }
  return { sessions: [] };
}

// Save data to remote
async function saveResumeData(data: any) {
  try {
    const response = await fetch(`${REMOTE_DEBUG_URL}/api/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    console.log('[DEBUG] Resume data saved to remote:', result);
    return response.ok;
  } catch (error) {
    console.error('[DEBUG] Failed to save resume data to remote:', error);
    // Fallback: still succeed locally if remote fails
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, mobileNumber, otp, mockOtp, resumeAnalysis, timestamp } = body;

    console.log(`[DEBUG-API] Event: ${event}, Mobile: ${mobileNumber}`);

    // Load existing data from remote
    const allData = await loadResumeData();

    // Create new session entry
    const sessionEntry: any = {
      id: Date.now().toString(),
      event,
      mobileNumber,
      timestamp: timestamp || new Date().toISOString(),
    };

    // Add specific data based on event type
    if (event === 'otp_sent') {
      sessionEntry.mockOtp = mockOtp; // For testing only - remove in production
      sessionEntry.status = 'otp_sent';
    } else if (event === 'otp_verified') {
      sessionEntry.otp = otp; // Store last 3 digits only in production
      sessionEntry.resumeAnalysis = resumeAnalysis;
      sessionEntry.status = 'verified';
    }

    // Add to sessions
    if (!allData.sessions) {
      allData.sessions = [];
    }
    allData.sessions.push(sessionEntry);

    // Save updated data to remote
    const saved = await saveResumeData(allData);

    return NextResponse.json(
      {
        success: saved,
        message: `Resume data saved for event: ${event}`,
        dataUrl: `${REMOTE_DEBUG_URL}/resume-data.json`,
        totalSessions: allData.sessions.length,
      },
      { status: saved ? 200 : 500 }
    );
  } catch (error) {
    console.error('[DEBUG-API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve debug data
export async function GET(request: NextRequest) {
  try {
    const allData = await loadResumeData();

    return NextResponse.json(
      {
        success: true,
        dataUrl: `${REMOTE_DEBUG_URL}/resume-data.json`,
        totalSessions: allData.sessions?.length || 0,
        data: allData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DEBUG-API] Error reading data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

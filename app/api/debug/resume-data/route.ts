import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Debug data directory
const DEBUG_DIR = path.join(process.cwd(), 'public', 'debug', 'data');
const RESUME_DATA_FILE = path.join(DEBUG_DIR, 'resume-data.json');

// Ensure debug directory exists
function ensureDebugDir() {
  try {
    if (!fs.existsSync(DEBUG_DIR)) {
      fs.mkdirSync(DEBUG_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('[DEBUG] Failed to create debug directory:', error);
  }
}

// Load existing data
function loadResumeData() {
  try {
    if (fs.existsSync(RESUME_DATA_FILE)) {
      const content = fs.readFileSync(RESUME_DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn('[DEBUG] Failed to load resume data:', error);
  }
  return { sessions: [] };
}

// Save data
function saveResumeData(data: any) {
  try {
    ensureDebugDir();
    fs.writeFileSync(RESUME_DATA_FILE, JSON.stringify(data, null, 2));
    console.log('[DEBUG] Resume data saved:', RESUME_DATA_FILE);
    return true;
  } catch (error) {
    console.error('[DEBUG] Failed to save resume data:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, mobileNumber, otp, mockOtp, resumeAnalysis, timestamp } = body;

    console.log(`[DEBUG-API] Event: ${event}, Mobile: ${mobileNumber}`);

    // Load existing data
    const allData = loadResumeData();

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

    // Save updated data
    const saved = saveResumeData(allData);

    return NextResponse.json(
      {
        success: saved,
        message: `Resume data saved for event: ${event}`,
        dataFile: RESUME_DATA_FILE,
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
    const allData = loadResumeData();

    return NextResponse.json(
      {
        success: true,
        dataFile: RESUME_DATA_FILE,
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

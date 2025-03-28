import { NextResponse } from 'next/server';
import dbConnect from '../../utils/dbConnect';
import Record from '../../models/Record';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');

    if (!subjectId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing subjectId' 
        }, 
        { status: 400 }
      );
    }

    const lastRecord = await Record.findOne({ subjectId })
      .sort({ timestamp: -1 })
      .select('timestamp');

    if (!lastRecord) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No records found for this subject' 
        }, 
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        lastAccess: lastRecord.timestamp,
        formattedDate: new Date(lastRecord.timestamp).toLocaleString()
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Last access error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      }, 
      { status: 500 }
    );
  }
}
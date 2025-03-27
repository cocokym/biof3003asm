import { NextResponse } from 'next/server';
import dbConnect from '../../../utils/dbConnect';
import Record from '../../../models/Record';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Validate required fields
    if (!body.subjectId) {
      return NextResponse.json(
        { success: false, error: 'Missing subjectId' },
        { status: 400 }
      );
    }

    const newRecord = await Record.create(body);
    return NextResponse.json(
      { success: true, data: newRecord },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Save record error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const subjectId = url.searchParams.get('subjectId');

    if (!subjectId) {
      return NextResponse.json(
        { success: false, error: 'Missing subjectId in query parameters' },
        { status: 400 }
      );
    }

    const pipeline = [
      { $match: { subjectId } },
      {
        $group: {
          _id: null,
          avgHeartRate: { $avg: '$heartRate.bpm' },
          avgHRV: { $avg: '$hrv.sdnn' },
        },
      },
    ];

    const result = await Record.aggregate(pipeline);
    return NextResponse.json({ success: true, ...result[0] }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
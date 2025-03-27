import { NextResponse } from 'next/server';
import dbConnect from '../../../utils/dbConnect';
import Record from '../../../models/Record';

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
          lastAccessDate: { $max: '$timestamp' }
        }
      }
    ];

    const result = await Record.aggregate(pipeline);

    if (!result.length) {
      return NextResponse.json({
        success: true,
        avgHeartRate: 0,
        avgHRV: 0,
        lastAccessDate: null
      });
    }

    return NextResponse.json({
      success: true,
      ...result[0],
      avgHeartRate: Math.round(result[0].avgHeartRate * 10) / 10,
      avgHRV: Math.round(result[0].avgHRV * 10) / 10
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
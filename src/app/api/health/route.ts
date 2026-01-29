import { NextResponse } from 'next/server';
import { monitoringSystem } from '@/lib/monitoring';

export async function GET() {
  try {
    const health = await monitoringSystem.getHealthCheck();

    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'down',
        timestamp: new Date(),
        uptime: 0,
        services: [],
        version: '1.0.0',
        error: 'Health check unavailable',
      },
      { status: 503 }
    );
  }
}

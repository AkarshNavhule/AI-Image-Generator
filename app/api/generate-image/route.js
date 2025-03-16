import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';

// 1) Import fal and configure credentials
import { fal } from '@fal-ai/client';

export async function POST(request) {
  // 2) Check if user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3) Parse prompt from request body
  const body = await request.json();
  const prompt = body.prompt;
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  try {
    // 4) Configure fal.ai with your API key
    fal.config({
      credentials: process.env.FAL_API_KEY
    });

    // 5) Call fal.ai FLUX using "subscribe"
    //    This waits for the job to finish and returns the result.
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        // Basic prompt or advanced parameters:
        prompt: prompt,
        image_size: 'landscape_4_3',
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true
      },
      logs: false // set to true if you want real-time logs
    });

    // 6) Extract the image URL from the response
    //    result.data is typically: { images: [ { url, content_type } ], prompt: '' }
    const imageUrl = result.data?.images?.[0]?.url;
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image returned' }, { status: 500 });
    }

    // 7) Store user + image data in MongoDB
    const client = await clientPromise;
    const db = client.db('ImageGenerator');
    const collection = db.collection('UserDetails');
    await collection.insertOne({
      email: session.user?.email,
      name: session.user?.name,
      profilePic: session.user?.image,
      prompt,
      imageUrl,
      createdAt:new Date(Date.now() + (5.5 * 60 * 60 * 1000))
    });

    // 8) Return the image URL to the client
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error in generate-image route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

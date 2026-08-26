import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const incomingFormData = await request.formData();
    const file = incomingFormData.get('file') as File | null;
    const folder = incomingFormData.get('folder') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    if (!folder) {
      return NextResponse.json({ error: 'Missing folder.' }, { status: 400 });
    }

    const formData = new FormData();
    formData.append('folder', folder);
    formData.append('bucketName', process.env.CLOUDFLARE_R2_BUCKET_NAME!);
    formData.append('file', file);

    const response = await fetch(`${process.env.UPLOAD_FILE_API_URL}/v1/file`, {
      method: 'POST',
      headers: {
        // These should be in environment variables for security
        access_key: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secret_key: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
      },
      body: formData,
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(responseData, { status: response.status });
    }

    return NextResponse.json(responseData);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

/**
 * Upload a file to R2 storage and return the public URL
 * @param file - The file to upload
 * @param folder - The folder path in R2 (e.g., 'users/avatars', 'users/documents')
 * @returns The public URL of the uploaded file
 */
export async function uploadToR2(file: File, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch('/api/file-upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload file');
  }

  const data = await response.json();
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || '';
  const imageUrl = `${cdnUrl}/${data.data.fileKey}`;

  // The response should contain the public URL of the uploaded file
  // Adjust the property name based on your actual API response structure
  return imageUrl;
}

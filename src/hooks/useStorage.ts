import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

type BucketName = 'avatars' | 'venue-images' | 'post-media' | 'event-images' | 'documents' | 'stories';

interface UploadOptions {
  bucket: BucketName;
  path?: string;
  upsert?: boolean;
}

interface UploadResult {
  url: string;
  path: string;
}

export function useStorage() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const getPublicUrl = (bucket: BucketName, path: string): string => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const uploadFile = async (
    file: File,
    options: UploadOptions
  ): Promise<UploadResult | null> => {
    if (!user) {
      toast.error('Please login to upload files');
      return null;
    }

    const { bucket, path, upsert = false } = options;

    // Validate file size (max 10MB for most, 5MB for avatars)
    const maxSize = bucket === 'avatars' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return null;
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${randomId}.${fileExt}`;
    
    // Build full path: userId/fileName or custom path
    const fullPath = path || `${user.id}/${fileName}`;

    setUploading(true);
    setProgress(0);

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fullPath, file, {
          cacheControl: '3600',
          upsert,
        });

      if (error) throw error;

      const url = getPublicUrl(bucket, data.path);
      
      setProgress(100);
      toast.success('File uploaded successfully');
      
      return { url, path: data.path };
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    const result = await uploadFile(file, { bucket: 'avatars', upsert: true });
    return result?.url || null;
  };

  const uploadPostMedia = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    
    for (const file of files) {
      const result = await uploadFile(file, { bucket: 'post-media' });
      if (result) urls.push(result.url);
    }
    
    return urls;
  };

  const uploadEventImage = async (file: File): Promise<string | null> => {
    const result = await uploadFile(file, { bucket: 'event-images' });
    return result?.url || null;
  };

  const deleteFile = async (bucket: BucketName, path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
      return false;
    }
  };

  const listFiles = async (bucket: BucketName, folder?: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder || user?.id, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('List error:', error);
      return [];
    }
  };

  return {
    uploading,
    progress,
    uploadFile,
    uploadAvatar,
    uploadPostMedia,
    uploadEventImage,
    deleteFile,
    listFiles,
    getPublicUrl,
  };
}

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  created_at: string;
  expires_at: string;
}

export interface StoryWithProfile extends Story {
  profile: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  is_viewed: boolean;
  view_count: number;
}

export interface GroupedStories {
  user_id: string;
  profile: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  stories: StoryWithProfile[];
  has_unviewed: boolean;
}

export function useStories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  // Fetch all active stories grouped by user
  const { data: groupedStories = [], isLoading, refetch } = useQuery({
    queryKey: ['stories', user?.id],
    queryFn: async () => {
      // Get all active stories
      const { data: stories, error } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!stories?.length) return [];

      // Get unique user IDs
      const userIds = [...new Set(stories.map(s => s.user_id))];

      // Fetch profiles for all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', userIds);

      // Fetch view status for current user
      let viewedStoryIds: string[] = [];
      if (user) {
        const { data: views } = await supabase
          .from('story_views')
          .select('story_id')
          .eq('viewer_id', user.id);
        viewedStoryIds = views?.map(v => v.story_id) || [];
      }

      // Fetch view counts for each story
      const storyIds = stories.map(s => s.id);
      const { data: viewCounts } = await supabase
        .from('story_views')
        .select('story_id')
        .in('story_id', storyIds);

      const viewCountMap: Record<string, number> = {};
      viewCounts?.forEach(v => {
        viewCountMap[v.story_id] = (viewCountMap[v.story_id] || 0) + 1;
      });

      // Build profile map
      const profileMap: Record<string, any> = {};
      profiles?.forEach(p => {
        profileMap[p.user_id] = p;
      });

      // Group stories by user
      const grouped: Record<string, GroupedStories> = {};
      
      // Put current user's stories first
      if (user) {
        const userStories = stories.filter(s => s.user_id === user.id);
        if (userStories.length) {
          grouped[user.id] = {
            user_id: user.id,
            profile: profileMap[user.id] || { display_name: null, username: null, avatar_url: null },
            stories: userStories.map(s => ({
              ...s,
              media_type: s.media_type as 'image' | 'video',
              profile: profileMap[s.user_id] || { display_name: null, username: null, avatar_url: null },
              is_viewed: true, // Own stories are always "viewed"
              view_count: viewCountMap[s.id] || 0,
            })),
            has_unviewed: false,
          };
        }
      }

      // Add other users' stories
      stories.forEach(story => {
        if (user && story.user_id === user.id) return;
        
        if (!grouped[story.user_id]) {
          grouped[story.user_id] = {
            user_id: story.user_id,
            profile: profileMap[story.user_id] || { display_name: null, username: null, avatar_url: null },
            stories: [],
            has_unviewed: false,
          };
        }

        const isViewed = viewedStoryIds.includes(story.id);
        grouped[story.user_id].stories.push({
          ...story,
          media_type: story.media_type as 'image' | 'video',
          profile: profileMap[story.user_id] || { display_name: null, username: null, avatar_url: null },
          is_viewed: isViewed,
          view_count: viewCountMap[story.id] || 0,
        });

        if (!isViewed) {
          grouped[story.user_id].has_unviewed = true;
        }
      });

      // Sort: unviewed first, then by most recent story
      return Object.values(grouped).sort((a, b) => {
        // Current user always first
        if (user && a.user_id === user.id) return -1;
        if (user && b.user_id === user.id) return 1;
        // Unviewed first
        if (a.has_unviewed && !b.has_unviewed) return -1;
        if (!a.has_unviewed && b.has_unviewed) return 1;
        // Then by most recent story
        return new Date(b.stories[0].created_at).getTime() - new Date(a.stories[0].created_at).getTime();
      });
    },
    enabled: true,
    refetchInterval: 60000, // Refetch every minute
  });

  // Upload story
  const uploadStory = useCallback(async (file: File, caption?: string) => {
    if (!user) {
      toast.error('Please login to add a story');
      return null;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

      console.log('Uploading story to storage:', fileName);
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);

      // Create story record
      const { data: story, error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          media_type: mediaType,
          caption: caption || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }

      console.log('Story created:', story);

      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Story added!');
      return story;
    } catch (error: any) {
      console.error('Error uploading story:', error);
      toast.error(error.message || 'Failed to upload story');
      return null;
    } finally {
      setUploading(false);
    }
  }, [user, queryClient]);

  // Mark story as viewed
  const markAsViewed = useMutation({
    mutationFn: async (storyId: string) => {
      if (!user) return;
      
      const { error } = await supabase
        .from('story_views')
        .upsert({
          story_id: storyId,
          viewer_id: user.id,
        }, {
          onConflict: 'story_id,viewer_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });

  // Delete story
  const deleteStory = useMutation({
    mutationFn: async (storyId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Get the story to find the media URL
      const { data: story } = await supabase
        .from('stories')
        .select('media_url')
        .eq('id', storyId)
        .single();

      // Delete from database
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Try to delete from storage
      if (story?.media_url) {
        const path = story.media_url.split('/stories/')[1];
        if (path) {
          await supabase.storage.from('stories').remove([path]);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Story deleted');
    },
    onError: () => {
      toast.error('Failed to delete story');
    },
  });

  // Get viewers for a story
  const getStoryViewers = useCallback(async (storyId: string) => {
    const { data, error } = await supabase
      .from('story_views')
      .select(`
        viewer_id,
        viewed_at
      `)
      .eq('story_id', storyId)
      .order('viewed_at', { ascending: false });

    if (error) throw error;
    if (!data?.length) return [];

    // Get profiles
    const viewerIds = data.map(v => v.viewer_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .in('user_id', viewerIds);

    const profileMap: Record<string, any> = {};
    profiles?.forEach(p => {
      profileMap[p.user_id] = p;
    });

    return data.map(v => ({
      ...v,
      profile: profileMap[v.viewer_id] || { display_name: null, username: null, avatar_url: null },
    }));
  }, []);

  // Check if current user has active stories
  const hasOwnStory = groupedStories.some(g => user && g.user_id === user.id);

  return {
    groupedStories,
    isLoading,
    uploading,
    uploadStory,
    markAsViewed,
    deleteStory,
    getStoryViewers,
    hasOwnStory,
    refetch,
  };
}

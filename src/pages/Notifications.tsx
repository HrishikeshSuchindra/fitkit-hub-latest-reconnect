import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Calendar, Users, Gamepad2, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: any;
  is_read: boolean;
  created_at: string;
}

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  // Mark all notifications as read when page is viewed
  useEffect(() => {
    if (!user || isLoading) return;
    
    const unreadNotifications = notifications.filter(n => !n.is_read);
    if (unreadNotifications.length > 0) {
      // Mark all as read after a short delay to let user see them
      const timeout = setTimeout(() => {
        markAllAsReadMutation.mutate();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [user, isLoading, notifications]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_reminder':
      case 'booking_confirmed':
      case 'booking_cancelled':
        return <Calendar className="w-5 h-5 text-brand-green" />;
      case 'friend_request':
      case 'friend_accepted':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'game_live':
      case 'game_joined':
        return <Gamepad2 className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-text-secondary" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.data?.booking_id) {
      navigate('/profile/bookings');
    } else if (notification.data?.friend_id) {
      navigate('/profile/friends');
    } else if (notification.data?.game_id) {
      navigate(`/hub/game/${notification.data.game_id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-4 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold ml-2">Notifications</h1>
          </div>
          
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Mark all read
                </>
              )}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              We'll notify you about bookings, games, and connections
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 rounded-xl cursor-pointer transition-colors ${
                  notification.is_read 
                    ? 'bg-card' 
                    : 'bg-brand-green/5 border border-brand-green/20'
                }`}
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-medium text-sm ${!notification.is_read ? 'text-foreground' : 'text-text-secondary'}`}>
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-brand-green flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    {notification.body && (
                      <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">
                        {notification.body}
                      </p>
                    )}
                    <p className="text-xs text-text-tertiary mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

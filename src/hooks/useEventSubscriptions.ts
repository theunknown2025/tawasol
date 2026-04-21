import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEventSubscriptions,
  fetchMySubscriptions,
  fetchSubscriptionsForMyEvents,
  subscribeToEvent,
  approveSubscription,
  rejectSubscription,
  deleteSubscription,
  type EventSubscription,
  type MySubscription,
} from "@/lib/eventsApi";

const QUERY_KEY_SUBS = (eventId: string) => ["event-subscriptions", eventId] as const;
const QUERY_KEY_MY = ["my-subscriptions"] as const;
const QUERY_KEY_MY_EVENTS_SUBS = ["my-events-subscriptions"] as const;

export function useSubscriptionsForMyEvents() {
  const queryClient = useQueryClient();

  const { data: subscriptionsByEvent = {}, ...rest } = useQuery({
    queryKey: QUERY_KEY_MY_EVENTS_SUBS,
    queryFn: fetchSubscriptionsForMyEvents,
  });

  const approveMutation = useMutation({
    mutationFn: approveSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_MY_EVENTS_SUBS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_MY });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_MY_EVENTS_SUBS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_MY });
    },
  });

  return {
    subscriptionsByEvent,
    isLoading: rest.isLoading,
    approve: (id: string) => approveMutation.mutateAsync(id),
    reject: (id: string) => rejectMutation.mutateAsync(id),
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}

export function useEventSubscriptions(eventId: string | null) {
  const queryClient = useQueryClient();

  const { data: subscriptions = [], ...rest } = useQuery({
    queryKey: QUERY_KEY_SUBS(eventId ?? ""),
    queryFn: () => fetchEventSubscriptions(eventId!),
    enabled: !!eventId,
  });

  const approveMutation = useMutation({
    mutationFn: approveSubscription,
    onSuccess: () => {
      if (eventId) queryClient.invalidateQueries({ queryKey: QUERY_KEY_SUBS(eventId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_MY });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectSubscription,
    onSuccess: () => {
      if (eventId) queryClient.invalidateQueries({ queryKey: QUERY_KEY_SUBS(eventId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_MY });
    },
  });

  return {
    subscriptions,
    isLoading: rest.isLoading,
    approve: (id: string) => approveMutation.mutateAsync(id),
    reject: (id: string) => rejectMutation.mutateAsync(id),
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}

export function useMySubscriptions() {
  const queryClient = useQueryClient();

  const { data: subscriptions = [], ...rest } = useQuery({
    queryKey: QUERY_KEY_MY,
    queryFn: fetchMySubscriptions,
  });

  const subscribeMutation = useMutation({
    mutationFn: subscribeToEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_MY });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_MY_EVENTS_SUBS });
      queryClient.invalidateQueries({ queryKey: ["evenements"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_MY });
    },
  });

  return {
    subscriptions,
    isLoading: rest.isLoading,
    subscribe: (eventId: string) => subscribeMutation.mutateAsync(eventId),
    deleteSubscription: (id: string) => deleteMutation.mutateAsync(id),
    isSubscribing: subscribeMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export type { EventSubscription, MySubscription };

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchFormRegistrationsForMyEvents,
  updateFormRegistrationStatus,
  type EventFormRegistration,
} from "@/lib/eventsApi";

const QUERY_KEY = ["event-form-registrations", "mine"] as const;

export function useEventFormRegistrationsForMyEvents() {
  const queryClient = useQueryClient();
  const { data: registrationsByEvent = {}, ...rest } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchFormRegistrationsForMyEvents,
  });

  const statusMutation = useMutation({
    mutationFn: ({
      registrationId,
      status,
    }: {
      registrationId: string;
      status: "approved" | "rejected";
    }) => updateFormRegistrationStatus(registrationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    registrationsByEvent,
    isLoading: rest.isLoading,
    updateStatus: (registrationId: string, status: "approved" | "rejected") =>
      statusMutation.mutateAsync({ registrationId, status }),
    isUpdating: statusMutation.isPending,
  };
}

export type { EventFormRegistration };

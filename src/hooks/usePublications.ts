import { useSyncExternalStore } from "react";
import { subscribe, getPublications } from "@/stores/publicationsStore";

export function usePublications() {
  return useSyncExternalStore(subscribe, getPublications);
}

import { getGetPresenterContentQueryKey, useGetPresenterContent } from "@workspace/api-client-react";
import { useDepot } from "@/lib/depot-mode";

/** Protected presenter material. Only fires for an authenticated user who explicitly entered Presenter Mode. */
export function usePresenterContent() {
  const { isPresenter, auth } = useDepot();
  const enabled = isPresenter && auth.isAuthenticated;
  const q = useGetPresenterContent({ query: { enabled, queryKey: getGetPresenterContentQueryKey(), staleTime: 5 * 60_000, retry: 1 } });
  return { ...q, enabled };
}

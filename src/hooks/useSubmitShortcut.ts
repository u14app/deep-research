import { useCallback, type KeyboardEvent } from "react";

type SubmitTarget = HTMLTextAreaElement | HTMLInputElement;

function useSubmitShortcut(
  onSubmit: () => void
): (event: KeyboardEvent<SubmitTarget>) => void {
  return useCallback(
    (event: KeyboardEvent<SubmitTarget>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        onSubmit();
      }
    },
    [onSubmit]
  );
}

export default useSubmitShortcut;

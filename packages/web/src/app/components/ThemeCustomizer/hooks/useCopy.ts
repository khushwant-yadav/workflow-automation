// React Imports
import { useState } from 'react';
import { toast } from 'sonner';

// Util Imports
export const useCopy = (duration = 1500, toastMessage?: string) => {
  // States
  const [copied, setCopied] = useState<boolean>(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), duration);
      toastMessage && toast.success(`${toastMessage} copied to clipboard`);

      return true;
    } catch (err) {
      console.error(`${toastMessage} failed to copy to clipboard`, err);
      toastMessage &&
        toast.error(`${toastMessage} failed to copy to clipboard`);

      return false;
    }
  };

  return { copied, copy };
};

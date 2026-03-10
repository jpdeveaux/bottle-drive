import { useEffect } from 'react';

export const useTitle = (title: string) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    
    // Optional: Reset the title when the component unmounts
    return () => { document.title = prevTitle; };
  }, [title]);
};
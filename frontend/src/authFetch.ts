const BACKEND = import.meta.env.VITE_API_URL;

/**
 * A wrapper for fetch that includes the base URL, authentication headers, and error handling.
 * @param url - API Path starting with / (e.g. '/addresses')
 */
export const authFetch = async (url: `/${string}`, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${BACKEND}/api${url}`, { ...options, headers });

  // Auto-logout if the token expired
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    const currentPath = window.location.pathname;
    window.location.href = `/login?redirectTo=${encodeURIComponent(currentPath)}`;
  }
  else if (!response.ok) {
    const errorData = await response.json();
    alert(`⚠️ Something went wrong!\n\nStatus: ${response.status}\nError: ${errorData.error || 'Unknown error'}`);
  }

  return response;
};
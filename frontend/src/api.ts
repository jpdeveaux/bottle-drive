export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    // Optional: Auto-logout if the token expired
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  else if (!response.ok) {
    const errorData = await response.json();
    alert(`⚠️ Something went wrong!\n\nStatus: ${response.status}\nError: ${errorData.error || 'Unknown error'}`);
  }

  return response;
};
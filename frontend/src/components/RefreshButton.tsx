// frontend/src/components/RefreshButton.tsx

interface Props {
  onRefresh: () => void; // A function to call when clicked
  isLoading: boolean;    // Whether to show the loading state
}

export function RefreshButton({ onRefresh, isLoading }: Props) {
  return (
    <button 
      onClick={onRefresh}
      disabled={isLoading}
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        padding: '10px 20px',
        backgroundColor: isLoading ? '#eee' : 'white',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        border: '2px solid #ccc',
        borderRadius: '5px',
        fontWeight: 'bold'
      }}
    >
      {isLoading ? 'Refreshing...' : 'Refresh Points'}
    </button>
  );
}
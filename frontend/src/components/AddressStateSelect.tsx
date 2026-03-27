import { Address, AddressState } from '@types';

interface AddressStateProps {
  addr: Address;
  handler: (id: string, state: Partial<Address>) => void;
};

export const AddressStateSelect = ({ addr, handler }: AddressStateProps) => {
  return (
    <select 
      value={addr.state} 
      onChange={(e) => {
        const newState = e.target.value as AddressState;  
        handler(addr.id, { state: newState });
      }}
      className="cap w-full bg-gray-50 border border-gray-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
    >
      {Object.values(AddressState).map((state) => (
         <option key={state} value={state}>{state}</option>
        ))
      }
    </select>
  )
};

import { useState, useEffect } from "react";
import { authFetch } from "@auth";
import { useAuth } from "@context/UseAuth";
import { socket } from "@hooks/useSocket";
import type { Address } from "@types";

export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesInitialized, setAddressesInitialized] = useState(false);
  const { authState } = useAuth();

  useEffect(() => {
    const fetchAddresses = async () => {
      const res = await authFetch("/addresses");
      if (res.ok) {
        setAddresses(await res.json());
        setAddressesInitialized(true);
      }
    };

    fetchAddresses();
  }, []);

  useEffect(() => {
    function handleAddressUpdated(updatedAddress: Address) {
      if(authState?.user?.role === 'admin' || !updatedAddress.zone || updatedAddress.zone.users?.some(user => user.id == authState.user?.id)) {
        console.log("Updated address received:", updatedAddress);

        setAddresses(current => {
          const exists = current.some(a => a.id === updatedAddress.id);

          if (exists) {
            return current.map(a =>
              a.id === updatedAddress.id ? updatedAddress : a
            );
          }

          return [...current, updatedAddress];
        });
      }
      else {
        console.log("Updated address received, but ignored");
        setAddresses(current => current.filter(addr => addr.id !== updatedAddress.id));
      }
    }

    socket.on("addressUpdated", handleAddressUpdated);

    return () => {
      socket.off("addressUpdated", handleAddressUpdated);
      console.log("useEffect cleanup: addressUpdated removed");
    };
  }, [authState]);

  useEffect(() => {
    function handleAddressDeleted(addressId: string) {
      console.log("Removing address:", addressId);

      setAddresses(current =>
        current.filter(addr => addr.id !== addressId)
      );
    }

    socket.on("addressDeleted", handleAddressDeleted);

    return () => {
      socket.off("addressDeleted", handleAddressDeleted);
      console.log("useEffect cleanup: addressDeleted removed");
    };
  }, []);

  // this is declared here instead of inside AddressStateSelect because it is still used to update notes.
  const handleAddressState = async (id: string, data: Partial<Address> ) => {
    try {
      console.log('Updating address - ', data);
      await authFetch(`/addresses/${id}/update`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error("Address status update failed: ", err);
      throw err;
    }
  };

  return { addresses, addressesInitialized, handleAddressState };
}
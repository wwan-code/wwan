import { useState, useEffect, useRef, useCallback } from 'react';

function useDropdown() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRefs = useRef([]);

  const toggleDropdown = useCallback((index, e) => {
    e?.preventDefault();
    setOpenDropdown((prev) => (prev === index ? null : index));
  }, []);

  const closeAllDropdowns = useCallback(() => {
    setOpenDropdown(null);
  }, []);

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (dropdownRefs.current.every((ref) => ref && !ref.contains(e.target))) {
        closeAllDropdowns();
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [closeAllDropdowns]);

  const dropdownRefCallback = useCallback((element, index) => {
    dropdownRefs.current[index] = element;
  }, []);

  return { openDropdown, toggleDropdown, dropdownRefCallback };
}

export default useDropdown;

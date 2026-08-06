import { useContext } from 'react';
import { StompContext } from './StompProvider.jsx';

export function useStomp() {
  return useContext(StompContext);
}

export default useStomp;

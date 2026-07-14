import { useEffect, useState, useCallback } from 'react';
import { actions } from '../services/actions';

/** Boolean overlay visibility toggled by an LHM keybind / panel action. */
export function useActionToggle(action: string, initial = false): [boolean, (v: boolean) => void] {
  const [visible, setVisible] = useState(initial);
  useEffect(() => actions.on(action, () => setVisible(v => !v)), [action]);
  const set = useCallback((v: boolean) => setVisible(v), []);
  return [visible, set];
}

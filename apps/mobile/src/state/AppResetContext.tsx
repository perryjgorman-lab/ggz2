import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface AppResetContextValue {
  /** Token that increments on each reset. Use as a dependency to trigger re-fetches. */
  resetToken: number;
  /** Call this to broadcast a reset to all subscribed screens. */
  triggerReset: () => void;
}

const AppResetContext = createContext<AppResetContextValue | undefined>(undefined);

interface AppResetProviderProps {
  children: React.ReactNode;
}

export function AppResetProvider({ children }: AppResetProviderProps) {
  const [resetToken, setResetToken] = useState(0);

  const triggerReset = useCallback(() => {
    setResetToken((prev) => prev + 1);
  }, []);

  const value = useMemo(
    () => ({ resetToken, triggerReset }),
    [resetToken, triggerReset]
  );

  return (
    <AppResetContext.Provider value={value}>
      {children}
    </AppResetContext.Provider>
  );
}

export function useAppReset(): AppResetContextValue {
  const context = useContext(AppResetContext);
  if (context === undefined) {
    throw new Error('useAppReset must be used within an AppResetProvider');
  }
  return context;
}

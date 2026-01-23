import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FREE_SCANS_PER_DAY = parseInt(process.env.EXPO_PUBLIC_FREE_SCANS_PER_DAY || '10', 10);
const SCANS_TODAY_KEY = '@scan2flip/scans_today';
const SCAN_DATE_KEY = '@scan2flip/scan_date';
const PRO_STATUS_KEY = '@scan2flip/is_pro';

interface ProContextType {
  isPro: boolean;
  scansRemaining: number;
  scansUsedToday: number;
  freeScanLimit: number;
  canScan: boolean;
  recordScan: () => Promise<boolean>;
  upgradeToPro: () => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const ProContext = createContext<ProContextType | undefined>(undefined);

interface ProProviderProps {
  children: ReactNode;
}

export function ProProvider({ children }: ProProviderProps) {
  const [isPro, setIsPro] = useState(false);
  const [scansUsedToday, setScansUsedToday] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProStatus();
    loadScanCount();
  }, []);

  const loadProStatus = async () => {
    try {
      const proStatus = await AsyncStorage.getItem(PRO_STATUS_KEY);
      setIsPro(proStatus === 'true');
    } catch (error) {
      console.error('Error loading Pro status:', error);
    }
  };

  const loadScanCount = async () => {
    try {
      const storedDate = await AsyncStorage.getItem(SCAN_DATE_KEY);
      const today = new Date().toDateString();

      if (storedDate !== today) {
        // Reset count for new day
        await AsyncStorage.setItem(SCAN_DATE_KEY, today);
        await AsyncStorage.setItem(SCANS_TODAY_KEY, '0');
        setScansUsedToday(0);
      } else {
        const count = await AsyncStorage.getItem(SCANS_TODAY_KEY);
        setScansUsedToday(parseInt(count || '0', 10));
      }
    } catch (error) {
      console.error('Error loading scan count:', error);
    } finally {
      setLoading(false);
    }
  };

  const scansRemaining = isPro ? Infinity : Math.max(0, FREE_SCANS_PER_DAY - scansUsedToday);
  const canScan = isPro || scansRemaining > 0;

  const recordScan = async (): Promise<boolean> => {
    if (!canScan) {
      return false;
    }

    if (!isPro) {
      const newCount = scansUsedToday + 1;
      setScansUsedToday(newCount);
      await AsyncStorage.setItem(SCANS_TODAY_KEY, newCount.toString());
    }

    return true;
  };

  const upgradeToPro = async () => {
    // Stub: In production, this would trigger RevenueCat/IAP purchase flow
    console.log('[ProProvider] upgradeToPro called - stub implementation');
    // For now, just set Pro status (remove this in production)
    // await AsyncStorage.setItem(PRO_STATUS_KEY, 'true');
    // setIsPro(true);
  };

  const restorePurchases = async () => {
    // Stub: In production, this would call RevenueCat/IAP restore
    console.log('[ProProvider] restorePurchases called - stub implementation');
    // For now, check stored status
    await loadProStatus();
  };

  const value: ProContextType = {
    isPro,
    scansRemaining,
    scansUsedToday,
    freeScanLimit: FREE_SCANS_PER_DAY,
    canScan,
    recordScan,
    upgradeToPro,
    restorePurchases
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro(): ProContextType {
  const context = useContext(ProContext);
  if (context === undefined) {
    throw new Error('usePro must be used within a ProProvider');
  }
  return context;
}

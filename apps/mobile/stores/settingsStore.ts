import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  notificationsEnabled: boolean;
  reminderTime: string;
  darkMode: boolean;
  questionCount: number;
  setNotifications: (v: boolean) => void;
  setReminderTime: (t: string) => void;
  setDarkMode: (v: boolean) => void;
  setQuestionCount: (n: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notificationsEnabled: true,
      reminderTime: '09:00',
      darkMode: false,
      questionCount: 8,
      setNotifications: (notificationsEnabled) => set({ notificationsEnabled }),
      setReminderTime: (reminderTime) => set({ reminderTime }),
      setDarkMode: (darkMode) => set({ darkMode }),
      setQuestionCount: (questionCount) => set({ questionCount }),
    }),
    {
      name: 'mockly-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

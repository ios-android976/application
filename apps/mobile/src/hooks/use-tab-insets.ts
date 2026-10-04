import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/constants/theme';

/** Top padding below the status bar and bottom padding that clears the tab bar. */
export function useTabInsets() {
  const insets = useSafeAreaInsets();
  return {
    top: insets.top,
    bottom: insets.bottom + TAB_BAR_HEIGHT,
  };
}

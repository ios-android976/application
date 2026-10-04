import { Image } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme';

type ProductImageProps = {
  uri: string | null;
  icon: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/** Product photo, or the category emoji on a warm tile when there is no photo yet. */
export function ProductImage({ uri, icon, size = 72, style }: ProductImageProps) {
  return (
    <View style={[styles.frame, style]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : (
        <Text style={{ fontSize: size * 0.5 }}>{icon}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { duration, palette, radius, space, type } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  /** Rendered left of the label — a difficulty pip, an icon, a count. */
  adornment?: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Amber is the score colour, so only ONE button on a screen may be primary:
 * the action that moves you forward. Everything else is secondary or ghost.
 * Spend the accent anywhere else and progress stops being the thing your eye
 * finds first.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  adornment,
  style,
}: Props) {
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        variants[variant].container,
        // A press should register instantly. Scale reads as physical on a
        // button this size; opacity alone feels like a delay.
        pressed && !inactive && styles.pressed,
        inactive && styles.inactive,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variants[variant].spinner} />
      ) : (
        <View style={styles.row}>
          {adornment}
          <Text style={[styles.label, variants[variant].label]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    transitionDuration: `${duration.instant}ms`,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  label: { ...type.bodyStrong },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  inactive: { opacity: 0.4 },
});

const variants: Record<
  Variant,
  { container: ViewStyle; label: { color: string }; spinner: string }
> = {
  primary: {
    container: { backgroundColor: palette.accent },
    label: { color: palette.accentText },
    spinner: palette.accentText,
  },
  secondary: {
    container: {
      backgroundColor: palette.surfaceRaised,
      borderWidth: 1,
      borderColor: palette.border,
    },
    label: { color: palette.text },
    spinner: palette.text,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    label: { color: palette.textMuted },
    spinner: palette.textMuted,
  },
  danger: {
    container: { backgroundColor: palette.dangerWash, borderWidth: 1, borderColor: palette.danger },
    label: { color: palette.danger },
    spinner: palette.danger,
  },
};

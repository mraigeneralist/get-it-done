import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { palette, radius, space, type } from '@/theme/tokens';

type Props = TextInputProps & {
  label: string;
  /** Shown under the field. Say what to do, not just what went wrong. */
  error?: string | null;
  hint?: string;
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, hint, style, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        // The accent marks focus because focus IS the primary action here —
        // it is where the next keystroke lands.
        style={[
          styles.input,
          focused && styles.inputFocused,
          !!error && styles.inputError,
          style,
        ]}
        placeholderTextColor={palette.textFaint}
        selectionColor={palette.accent}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        {...rest}
      />
      {(error || hint) && (
        <Text style={[styles.hint, !!error && styles.hintError]}>{error ?? hint}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: space.sm },
  label: { ...type.eyebrow, color: palette.textMuted, textTransform: 'uppercase' },
  input: {
    height: 52,
    borderRadius: radius.control,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: space.lg,
    color: palette.text,
    ...type.body,
  },
  inputFocused: { borderColor: palette.accent },
  inputError: { borderColor: palette.danger },
  hint: { ...type.label, fontWeight: '400', color: palette.textFaint },
  hintError: { color: palette.danger },
});

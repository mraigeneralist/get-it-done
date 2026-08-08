import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/lib/auth';
import { palette, space, type } from '@/theme/tokens';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function onSubmit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      // No navigation call: the root layout's guard swaps the group as soon
      // as the session lands.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.giant, paddingBottom: insets.bottom + space.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>WELCOME BACK</Text>
          <Text style={styles.title}>Get It Done</Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            returnKeyType="next"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            error={error}
          />
          <Button label="Sign in" onPress={onSubmit} loading={busy} disabled={!canSubmit} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>No account yet?</Text>
          <Link href="/sign-up" style={styles.footerLink}>
            Create one
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { paddingHorizontal: space.xl, gap: space.giant, flexGrow: 1 },
  header: { gap: space.xs },
  eyebrow: { ...type.eyebrow, color: palette.accent },
  title: { ...type.display, color: palette.text },
  form: { gap: space.xl },
  footer: { flexDirection: 'row', gap: space.sm, justifyContent: 'center', alignItems: 'center' },
  footerText: { ...type.body, color: palette.textMuted },
  footerLink: { ...type.bodyStrong, color: palette.accent },
});

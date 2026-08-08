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

const MIN_PASSWORD = 8;

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD;
  const canSubmit =
    name.trim().length > 0 && email.trim().length > 0 && password.length >= MIN_PASSWORD;

  async function onSubmit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      await signUp(email, password, name);
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
          <Text style={styles.eyebrow}>START AT LEVEL 1</Text>
          <Text style={styles.title}>Create account</Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="What should we call you?"
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
          />
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
            placeholder={`At least ${MIN_PASSWORD} characters`}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            hint={`${MIN_PASSWORD} characters minimum`}
            error={error ?? (passwordTooShort ? `Needs ${MIN_PASSWORD} characters or more.` : null)}
          />
          <Button label="Create account" onPress={onSubmit} loading={busy} disabled={!canSubmit} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/sign-in" style={styles.footerLink}>
            Sign in
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

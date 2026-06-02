import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

function Field({
  label, value, onChangeText, placeholder, secureTextEntry = false,
  autoCapitalize = 'none',
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.n70}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, focused && styles.inputFocused]}
      />
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.replace({ pathname: '/(auth)/verify-email', params: { email } });
  };

  return (
    <KeyboardAvoidingView style={styles.outer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Icon name="message" size={40} color={Colors.white} />
            <View style={styles.sparkle}><Icon name="sparkle" size={18} color="#5BC98A" fill /></View>
          </View>
          <Text style={styles.appName}>Mockly</Text>
          <Text style={styles.tagline}>Create your account and start practicing.</Text>
        </View>

        <View style={styles.card}>
          <Field label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Alex Rivera" autoCapitalize="words" />
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.btnWrap}>
            {loading
              ? <ActivityIndicator color={Colors.blue800} />
              : <Button full size="lg" onPress={handleRegister}>Create Account</Button>
            }
          </View>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Colors.blue800 },
  scroll: { flexGrow: 1 },
  hero: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40,
  },
  logoWrap: {
    width: 76, height: 76, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 22,
  },
  sparkle: { position: 'absolute', bottom: 12, right: 8 },
  appName: { fontFamily: Font.extraBold, fontSize: 36, color: Colors.white, letterSpacing: -0.36, marginBottom: 8 },
  tagline: { fontFamily: Font.regular, fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 22, textAlign: 'center' },
  card: { backgroundColor: Colors.white, borderRadius: 18, padding: 18, margin: 16, marginTop: 0, gap: 12 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontFamily: Font.bold, fontSize: 13, color: Colors.n100 },
  input: {
    height: 48, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.n30,
    fontFamily: Font.regular, fontSize: 16, color: Colors.n100,
  },
  inputFocused: { borderColor: Colors.blue700, shadowColor: Colors.blue700, shadowOpacity: 0.18, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } },
  error: { fontFamily: Font.regular, fontSize: 13, color: Colors.red, textAlign: 'center' },
  btnWrap: { marginTop: 4 },
  switchText: { fontFamily: Font.regular, fontSize: 13, color: Colors.n70, textAlign: 'center' },
  switchLink: { color: Colors.blue700, fontFamily: Font.bold },
});

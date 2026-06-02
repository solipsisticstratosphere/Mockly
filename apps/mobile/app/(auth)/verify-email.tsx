import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleVerify = async () => {
    if (code.length !== 6) { setError('Enter the 6-digit code from the email'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.verifyOtp({
      email: email ?? '',
      token: code,
      type: 'signup',
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.replace('/(auth)/onboarding');
  };

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    setError('');
    await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    setResent(true);
    setCode('');
    setTimeout(() => setResent(false), 4000);
  };

  const digits = code.split('');

  return (
    <View style={styles.outer}>
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <Icon name="send" size={28} color={Colors.white} />
        </View>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>
      </View>

      <View style={styles.card}>
        {/* Hidden real input, tapped via digit boxes */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={v => { setCode(v.replace(/\D/g, '').slice(0, 6)); setError(''); }}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          style={styles.hiddenInput}
        />

        <Text style={styles.label}>Enter verification code</Text>

        <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={styles.digitsRow}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.digitBox,
                digits[i] !== undefined && styles.digitBoxFilled,
                i === digits.length && styles.digitBoxActive,
              ]}
            >
              <Text style={styles.digitText}>{digits[i] ?? ''}</Text>
            </View>
          ))}
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {resent && (
          <View style={styles.resentBanner}>
            <Icon name="check" size={14} color="#1E8A4C" />
            <Text style={styles.resentText}>New code sent to your email</Text>
          </View>
        )}

        <View style={styles.btnWrap}>
          {loading
            ? <ActivityIndicator color={Colors.blue800} />
            : (
              <Button full size="lg" onPress={handleVerify} disabled={code.length !== 6}>
                Verify email
              </Button>
            )
          }
        </View>

        <TouchableOpacity onPress={handleResend} disabled={resending || resent}>
          <Text style={[styles.resend, (resending || resent) && styles.resendDisabled]}>
            Didn't receive it?{' '}
            <Text style={styles.resendLink}>{resending ? 'Sending…' : 'Resend code'}</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Button variant="ghost" full onPress={() => router.replace('/(auth)/login')}>
          Back to sign in
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Colors.blue800 },
  hero: {
    paddingTop: 80, paddingBottom: 36, paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  title: { fontFamily: Font.extraBold, fontSize: 28, color: Colors.white, marginBottom: 10 },
  subtitle: {
    fontFamily: Font.regular, fontSize: 15, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 22,
  },
  emailText: { fontFamily: Font.bold, color: Colors.white },
  card: {
    backgroundColor: Colors.white, borderRadius: 18,
    padding: 20, marginHorizontal: 16, gap: 14,
  },
  hiddenInput: {
    position: 'absolute', width: 1, height: 1, opacity: 0,
  },
  label: { fontFamily: Font.bold, fontSize: 13, color: Colors.n100 },
  digitsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  digitBox: {
    width: 44, height: 52, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.n30,
    backgroundColor: Colors.n10,
    alignItems: 'center', justifyContent: 'center',
  },
  digitBoxFilled: { borderColor: Colors.blue700, backgroundColor: Colors.white },
  digitBoxActive: { borderColor: Colors.blue700, borderWidth: 2 },
  digitText: { fontFamily: Font.bold, fontSize: 22, color: Colors.n100 },
  error: { fontFamily: Font.regular, fontSize: 13, color: Colors.red, textAlign: 'center' },
  resentBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: 'rgba(30,138,76,0.10)',
    paddingVertical: 8, borderRadius: 8,
  },
  resentText: { fontFamily: Font.semiBold, fontSize: 13, color: '#1E8A4C' },
  btnWrap: { marginTop: 2 },
  resend: { fontFamily: Font.regular, fontSize: 13, color: Colors.n70, textAlign: 'center' },
  resendDisabled: { opacity: 0.5 },
  resendLink: { color: Colors.blue700, fontFamily: Font.bold },
  divider: { height: 1, backgroundColor: Colors.n30 },
});

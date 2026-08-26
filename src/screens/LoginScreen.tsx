import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as api from "../api/client";
import { useAuth } from "../state/auth-context";
import { useNavigation } from "../state/navigation";
import { colors } from "../theme";

export function LoginScreen() {
  const { signIn } = useAuth();
  const { pop, reset } = useNavigation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    setError(null);
    setPending(true);
    try {
      const result =
        mode === "register" ? await api.register(form) : await api.login(form);
      await signIn(result.token, result.user);
      reset({ name: "MyBookings" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na autenticação");
    } finally {
      setPending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={pop}>
            <Text style={styles.back}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>TripSync</Text>
          <Text style={styles.subtitle}>Entrar na sua conta</Text>

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, mode === "login" && styles.tabActive]}
              onPress={() => setMode("login")}
            >
              <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>
                Entrar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "register" && styles.tabActive]}
              onPress={() => setMode("register")}
            >
              <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>
                Criar conta
              </Text>
            </TouchableOpacity>
          </View>

          {mode === "register" && (
            <Field label="Nome" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
          )}
          <Field
            label="E-mail"
            value={form.email}
            onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
            keyboardType="email-address"
            placeholder="viajante@demo.tripsync"
          />
          <Field
            label="Senha"
            value={form.password}
            onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
            secureTextEntry
          />

          {error && <Text style={styles.error}>{error}</Text>}

          {pending ? (
            <ActivityIndicator color={colors.brand} style={{ marginTop: 16 }} />
          ) : (
            <TouchableOpacity style={styles.submitBtn} onPress={onSubmit}>
              <Text style={styles.submitBtnText}>
                {mode === "register" ? "Criar conta" : "Entrar"}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.demo}>Demo: viajante@demo.tripsync / Demo@2025</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "email-address";
  placeholder?: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        secureTextEntry={props.secureTextEntry}
        keyboardType={props.keyboardType}
        placeholder={props.placeholder}
        autoCapitalize="none"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.slate50 },
  content: { padding: 20, paddingBottom: 60 },
  back: { color: colors.brand, fontSize: 14, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: colors.brandDark, marginTop: 20 },
  subtitle: { fontSize: 14, color: colors.slate600, marginTop: 2, marginBottom: 20 },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.slate100, alignItems: "center" },
  tabActive: { backgroundColor: colors.brand },
  tabText: { fontSize: 13, fontWeight: "700", color: colors.slate600 },
  tabTextActive: { color: colors.white },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.slate600, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: colors.white,
    color: colors.slate900,
  },
  error: { color: colors.red, fontSize: 13, marginBottom: 8 },
  submitBtn: { backgroundColor: colors.brand, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 6 },
  submitBtnText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  demo: { textAlign: "center", fontSize: 11, color: colors.slate400, marginTop: 20 },
});

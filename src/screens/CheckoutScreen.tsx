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
import type { CabinClass } from "@trip-sync/contracts";
import * as api from "../api/client";
import { useAuth } from "../state/auth-context";
import { useNavigation } from "../state/navigation";
import { colors } from "../theme";

type CheckoutParams = {
  flightId: string;
  cabinClass: CabinClass;
  airline: string;
  flightNumber: string;
  originAirport: string;
  destinationAirport: string;
  departureAt: string;
  arrivalAt: string;
  amountCents: number;
  seatNumber: string;
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
}

export function CheckoutScreen() {
  const { current, push, pop } = useNavigation();
  const { state, signIn } = useAuth();
  const flight = current.params as CheckoutParams;

  const [step, setStep] = useState<"passenger" | "auth" | "payment">("passenger");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [passenger, setPassenger] = useState({ name: "", document: "", email: "" });
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [card, setCard] = useState({ cardHolderName: "", cardNumber: "", expiry: "", cvv: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function goPassengerNext() {
    if (passenger.name.length < 2 || passenger.document.length < 5 || !passenger.email.includes("@")) {
      setError("Preencha todos os campos do passageiro.");
      return;
    }
    setError(null);
    setStep(state.user ? "payment" : "auth");
  }

  async function submitAuth() {
    setError(null);
    setPending(true);
    try {
      const result =
        authMode === "register"
          ? await api.register(authForm)
          : await api.login({ email: authForm.email, password: authForm.password });
      await signIn(result.token, result.user);
      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na autenticação");
    } finally {
      setPending(false);
    }
  }

  async function submitPayment() {
    setError(null);
    setPending(true);
    try {
      const paymentResult = await api.processMockPayment({
        cardHolderName: card.cardHolderName,
        cardNumber: card.cardNumber.replace(/\s/g, ""),
        expiry: card.expiry,
        cvv: card.cvv,
        amountCents: flight.amountCents,
      });
      if (!paymentResult.approved) {
        throw new Error("Pagamento não aprovado. Tente novamente.");
      }

      const booking = await api.issueBooking({
        passengerName: passenger.name,
        passengerDocument: passenger.document,
        passengerEmail: passenger.email,
        flightId: flight.flightId,
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        originAirport: flight.originAirport,
        destinationAirport: flight.destinationAirport,
        departureAt: flight.departureAt,
        arrivalAt: flight.arrivalAt,
        cabinClass: flight.cabinClass,
        seatNumber: flight.seatNumber,
        amountCents: flight.amountCents,
        currency: "BRL",
      });

      push({ name: "Confirmation", params: { bookingId: booking.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao emitir passagem");
    } finally {
      setPending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={pop}>
            <Text style={styles.back}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Finalizar reserva</Text>

          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              Assento {flight.seatNumber} · {flight.originAirport} → {flight.destinationAirport}
            </Text>
            <Text style={styles.summaryPrice}>{formatMoney(flight.amountCents)}</Text>
          </View>

          <View style={styles.steps}>
            <Text style={[styles.step, step === "passenger" && styles.stepActive]}>1. Passageiro</Text>
            <Text style={styles.stepArrow}>→</Text>
            <Text style={[styles.step, step === "auth" && styles.stepActive]}>2. Conta</Text>
            <Text style={styles.stepArrow}>→</Text>
            <Text style={[styles.step, step === "payment" && styles.stepActive]}>3. Pagamento</Text>
          </View>

          {step === "passenger" && (
            <View style={styles.card}>
              <Field label="Nome completo" value={passenger.name} onChangeText={(v) => setPassenger((p) => ({ ...p, name: v }))} />
              <Field label="CPF ou passaporte" value={passenger.document} onChangeText={(v) => setPassenger((p) => ({ ...p, document: v }))} />
              <Field label="E-mail" value={passenger.email} onChangeText={(v) => setPassenger((p) => ({ ...p, email: v }))} keyboardType="email-address" />
              {error && <Text style={styles.error}>{error}</Text>}
              <PrimaryButton label="Continuar" onPress={goPassengerNext} />
            </View>
          )}

          {step === "auth" && (
            <View style={styles.card}>
              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[styles.tab, authMode === "login" && styles.tabActive]}
                  onPress={() => setAuthMode("login")}
                >
                  <Text style={[styles.tabText, authMode === "login" && styles.tabTextActive]}>
                    Já tenho conta
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, authMode === "register" && styles.tabActive]}
                  onPress={() => setAuthMode("register")}
                >
                  <Text style={[styles.tabText, authMode === "register" && styles.tabTextActive]}>
                    Criar conta
                  </Text>
                </TouchableOpacity>
              </View>
              {authMode === "register" && (
                <Field label="Nome" value={authForm.name} onChangeText={(v) => setAuthForm((a) => ({ ...a, name: v }))} />
              )}
              <Field label="E-mail" value={authForm.email} onChangeText={(v) => setAuthForm((a) => ({ ...a, email: v }))} keyboardType="email-address" />
              <Field label="Senha" value={authForm.password} onChangeText={(v) => setAuthForm((a) => ({ ...a, password: v }))} secureTextEntry />
              {error && <Text style={styles.error}>{error}</Text>}
              {pending ? (
                <ActivityIndicator color={colors.brand} style={{ marginTop: 12 }} />
              ) : (
                <PrimaryButton
                  label={authMode === "register" ? "Criar conta e continuar" : "Entrar e continuar"}
                  onPress={submitAuth}
                />
              )}
            </View>
          )}

          {step === "payment" && (
            <View style={styles.card}>
              <Field label="Nome no cartão" value={card.cardHolderName} onChangeText={(v) => setCard((c) => ({ ...c, cardHolderName: v }))} />
              <Field label="Número do cartão" value={card.cardNumber} onChangeText={(v) => setCard((c) => ({ ...c, cardNumber: v }))} keyboardType="number-pad" placeholder="4111 1111 1111 1111" />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Validade" value={card.expiry} onChangeText={(v) => setCard((c) => ({ ...c, expiry: v }))} placeholder="MM/AA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="CVV" value={card.cvv} onChangeText={(v) => setCard((c) => ({ ...c, cvv: v }))} keyboardType="number-pad" />
                </View>
              </View>
              <Text style={styles.hint}>Pagamento simulado — nenhum dado de cartão é armazenado.</Text>
              {error && <Text style={styles.error}>{error}</Text>}
              {pending ? (
                <ActivityIndicator color={colors.emerald} style={{ marginTop: 12 }} />
              ) : (
                <TouchableOpacity style={styles.payBtn} onPress={submitPayment}>
                  <Text style={styles.payBtnText}>
                    Pagar {formatMoney(flight.amountCents)} e emitir
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
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
  keyboardType?: "email-address" | "number-pad";
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

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.primaryBtn} onPress={onPress}>
      <Text style={styles.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.slate50 },
  content: { padding: 20, paddingBottom: 60 },
  back: { color: colors.brand, fontSize: 14, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "800", color: colors.slate950, marginTop: 8 },
  summary: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  summaryText: { fontSize: 13, color: colors.slate500 },
  summaryPrice: { fontSize: 20, fontWeight: "800", color: colors.slate950, marginTop: 4 },
  steps: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16 },
  step: { fontSize: 11, fontWeight: "600", color: colors.slate400 },
  stepActive: { color: colors.brand },
  stepArrow: { color: colors.slate200, fontSize: 11 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.slate600, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.slate900,
  },
  hint: { fontSize: 11, color: colors.slate400, marginTop: 2, marginBottom: 6 },
  error: { color: colors.red, fontSize: 13, marginTop: 4, marginBottom: 4 },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  primaryBtnText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  payBtn: {
    backgroundColor: colors.emerald,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  payBtnText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.slate100,
  },
  tabActive: { backgroundColor: colors.brand },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.slate600 },
  tabTextActive: { color: colors.white },
});

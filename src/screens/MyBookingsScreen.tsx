import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { BookingResponse } from "@trip-sync/contracts";
import { listBookings, updateBookingStatus } from "../api/client";
import { useAuth } from "../state/auth-context";
import { useNavigation } from "../state/navigation";
import { colors } from "../theme";

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

const STATUS_LABEL = { PENDING: "Pendente", CONFIRMED: "Emitida", CANCELLED: "Cancelada" } as const;
const STATUS_COLOR = {
  PENDING: colors.amberBg,
  CONFIRMED: colors.emeraldBg,
  CANCELLED: colors.redBg,
} as const;

export function MyBookingsScreen() {
  const { state } = useAuth();
  const { push } = useNavigation();
  const [bookings, setBookings] = useState<BookingResponse[] | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!state.user) return;
    setError(null);
    listBookings({ page: 1, pageSize: 20 })
      .then((res) => setBookings(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar reservas"));
  }, [state.user]);

  useEffect(() => {
    load();
  }, [load]);

  async function onCancel(id: string) {
    setCancellingId(id);
    try {
      await updateBookingStatus(id, { status: "CANCELLED" });
      load();
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Não foi possível cancelar");
    } finally {
      setCancellingId(null);
    }
  }

  if (!state.user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Entre para ver suas reservas</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => push({ name: "Login" })}>
            <Text style={styles.loginBtnText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Minhas reservas</Text>
      </View>

      {!bookings && !error && <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {bookings?.length === 0 && (
          <Text style={styles.empty}>Nenhuma passagem emitida ainda.</Text>
        )}
        {bookings?.map((booking) => (
          <View key={booking.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.reference}>{booking.reference}</Text>
                <Text style={styles.route}>
                  {booking.originAirport} → {booking.destinationAirport}
                </Text>
                <Text style={styles.flightInfo}>
                  {booking.airline} · {booking.flightNumber} · {formatDate(booking.departureAt)}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[booking.status] }]}>
                <Text style={styles.statusText}>{STATUS_LABEL[booking.status]}</Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.price}>{formatMoney(booking.amountCents, booking.currency)}</Text>
              {booking.status !== "CANCELLED" &&
                (cancellingId === booking.id ? (
                  <ActivityIndicator color={colors.red} />
                ) : (
                  <TouchableOpacity onPress={() => onCancel(booking.id)}>
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.slate50 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: colors.slate950 },
  content: { padding: 20, paddingTop: 4, gap: 12 },
  empty: { textAlign: "center", color: colors.slate500, marginTop: 40 },
  errorBox: { alignItems: "center", marginTop: 40, paddingHorizontal: 20, gap: 12 },
  error: { color: colors.red, textAlign: "center" },
  retryBtn: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  reference: { fontSize: 11, color: colors.slate500 },
  route: { fontSize: 15, fontWeight: "700", color: colors.slate900, marginTop: 2 },
  flightInfo: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: "700", color: colors.slate900 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  price: { fontSize: 15, fontWeight: "700", color: colors.slate900 },
  cancelText: { fontSize: 13, fontWeight: "600", color: colors.red },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  emptyTitle: { fontSize: 16, color: colors.slate600, fontWeight: "600" },
  loginBtn: { backgroundColor: colors.brand, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  loginBtnText: { color: colors.white, fontWeight: "700" },
});

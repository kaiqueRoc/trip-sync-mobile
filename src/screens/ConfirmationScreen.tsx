import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { BookingResponse } from "@trip-sync/contracts";
import { getBooking } from "../api/client";
import { useNavigation } from "../state/navigation";
import { colors } from "../theme";

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function ConfirmationScreen() {
  const { current, reset } = useNavigation();
  const { bookingId } = current.params as { bookingId: string };
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    getBooking(bookingId)
      .then((res) => {
        if (!cancelled) setBooking(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar reserva");
      });

    return () => {
      cancelled = true;
    };
  }, [bookingId, reloadKey]);

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setReloadKey((k) => k + 1)}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeTitle}>Passagem emitida ✓</Text>
          <Text style={styles.reference}>{booking.reference}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.route}>
            {booking.originAirport} → {booking.destinationAirport}
          </Text>
          <Text style={styles.airline}>
            {booking.airline} · {booking.flightNumber}
          </Text>

          <View style={styles.grid}>
            <Detail label="Passageiro" value={booking.passengerName} />
            <Detail label="Assento" value={booking.seatNumber} />
            <Detail label="Embarque" value={formatDateTime(booking.departureAt)} />
            <Detail label="Chegada" value={formatDateTime(booking.arrivalAt)} />
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total pago</Text>
            <Text style={styles.totalValue}>
              {formatMoney(booking.amountCents, booking.currency)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.myBookingsBtn}
          onPress={() => reset({ name: "MyBookings" })}
        >
          <Text style={styles.myBookingsBtnText}>Ver minhas reservas</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: "50%", marginBottom: 12 }}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.slate50 },
  errorBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, gap: 12 },
  error: { color: colors.red, textAlign: "center" },
  retryBtn: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  content: { padding: 20 },
  badge: {
    backgroundColor: colors.emeraldBg,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  badgeTitle: { color: colors.emerald, fontWeight: "700", fontSize: 13 },
  reference: { color: colors.slate950, fontWeight: "800", fontSize: 22, marginTop: 4 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  route: { fontSize: 18, fontWeight: "800", color: colors.slate950 },
  airline: { fontSize: 13, color: colors.slate500, marginTop: 2, marginBottom: 14 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
    paddingTop: 14,
  },
  detailLabel: { fontSize: 12, color: colors.slate500 },
  detailValue: { fontSize: 14, fontWeight: "600", color: colors.slate900, marginTop: 2 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
    paddingTop: 14,
  },
  totalLabel: { fontSize: 13, color: colors.slate500 },
  totalValue: { fontSize: 20, fontWeight: "800", color: colors.slate950 },
  myBookingsBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  myBookingsBtnText: { fontSize: 14, fontWeight: "700", color: colors.slate600 },
});

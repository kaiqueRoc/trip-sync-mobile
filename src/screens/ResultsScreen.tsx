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
import { AIRPORTS, type Flight } from "@trip-sync/contracts";
import { searchFlights } from "../api/client";
import { useNavigation } from "../state/navigation";
import { colors } from "../theme";

const CABIN_LABEL = { ECONOMY: "Econômica", PREMIUM: "Premium", BUSINESS: "Executiva" } as const;

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? ` ${m}min` : ""}`;
}

export function ResultsScreen() {
  const { current, push, pop } = useNavigation();
  const params = current.params as {
    origin: string;
    destination: string;
    departureDate: string;
    passengers: number;
  };

  const [flights, setFlights] = useState<Flight[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFlights(null);
    setError(null);

    searchFlights({
      origin: params.origin,
      destination: params.destination,
      departureDate: `${params.departureDate}T00:00:00.000Z`,
      passengers: params.passengers,
    })
      .then((res) => {
        if (!cancelled) setFlights(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao buscar voos");
      });

    return () => {
      cancelled = true;
    };
  }, [params.origin, params.destination, params.departureDate, params.passengers]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={pop}>
          <Text style={styles.back}>← Nova busca</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {AIRPORTS[params.origin] ?? params.origin} → {AIRPORTS[params.destination] ?? params.destination}
        </Text>
        <Text style={styles.subtitle}>
          {params.departureDate} · {params.passengers} passageiro(s)
        </Text>
      </View>

      {!flights && !error && (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <ScrollView contentContainerStyle={styles.content}>
        {flights?.map((flight) => (
          <View key={flight.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.airline}>
                  {flight.airline} · {flight.flightNumber}
                </Text>
                <Text style={styles.aircraft}>{flight.aircraft}</Text>
              </View>
              <Text style={styles.time}>
                {formatTime(flight.departureAt)} — {formatTime(flight.arrivalAt)}
              </Text>
            </View>
            <Text style={styles.duration}>{formatDuration(flight.durationMinutes)}</Text>

            <View style={styles.cabinRow}>
              {flight.cabinClasses.map((option) => (
                <TouchableOpacity
                  key={option.cabinClass}
                  style={styles.cabinBtn}
                  onPress={() =>
                    push({
                      name: "SeatMap",
                      params: {
                        flightId: flight.id,
                        cabinClass: option.cabinClass,
                        airline: flight.airline,
                        flightNumber: flight.flightNumber,
                        originAirport: flight.originAirport,
                        destinationAirport: flight.destinationAirport,
                        departureAt: flight.departureAt,
                        arrivalAt: flight.arrivalAt,
                        amountCents: option.priceCents,
                      },
                    })
                  }
                >
                  <Text style={styles.cabinLabel}>{CABIN_LABEL[option.cabinClass]}</Text>
                  <Text style={styles.cabinPrice}>{formatMoney(option.priceCents)}</Text>
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
  header: { paddingHorizontal: 20, paddingTop: 16 },
  back: { color: colors.brand, fontSize: 14, fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "800", color: colors.slate950, marginTop: 6 },
  subtitle: { fontSize: 13, color: colors.slate500, marginTop: 2, marginBottom: 12 },
  error: { color: colors.red, textAlign: "center", marginTop: 24, paddingHorizontal: 20 },
  content: { padding: 20, paddingTop: 4, gap: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  airline: { fontSize: 15, fontWeight: "700", color: colors.slate900 },
  aircraft: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  time: { fontSize: 13, color: colors.slate600, fontWeight: "600" },
  duration: { fontSize: 12, color: colors.slate500, marginTop: 4 },
  cabinRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  cabinBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  cabinLabel: { fontSize: 11, color: colors.slate500, fontWeight: "600" },
  cabinPrice: { fontSize: 14, color: colors.slate900, fontWeight: "700", marginTop: 2 },
});

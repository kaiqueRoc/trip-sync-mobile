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
import type { CabinClass, Seat } from "@trip-sync/contracts";
import { getSeatMap } from "../api/client";
import { useNavigation } from "../state/navigation";
import { colors } from "../theme";

const CABIN_LABEL = { ECONOMY: "Econômica", PREMIUM: "Premium", BUSINESS: "Executiva" } as const;
const COLUMNS = ["A", "B", "C", "D", "E", "F"];

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
}

type SeatMapParams = {
  flightId: string;
  cabinClass: CabinClass;
  airline: string;
  flightNumber: string;
  originAirport: string;
  destinationAirport: string;
  departureAt: string;
  arrivalAt: string;
  amountCents: number;
};

export function SeatMapScreen() {
  const { current, push, pop } = useNavigation();
  const params = current.params as SeatMapParams;

  const [seats, setSeats] = useState<Seat[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    getSeatMap(params.flightId, params.cabinClass).then((res) => setSeats(res.seats));
  }, [params.flightId, params.cabinClass]);

  const rows = seats ? Array.from(new Set(seats.map((s) => s.row))).sort((a, b) => a - b) : [];
  const byKey = new Map((seats ?? []).map((s) => [`${s.row}${s.column}`, s]));

  function onContinue() {
    if (!selected) return;
    push({
      name: "Checkout",
      params: { ...params, seatNumber: selected },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={pop}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.cabin}>{CABIN_LABEL[params.cabinClass]}</Text>
        <Text style={styles.title}>
          {params.airline} · {params.flightNumber}
        </Text>
        <Text style={styles.subtitle}>
          {params.originAirport} → {params.destinationAirport} · {formatMoney(params.amountCents)}
        </Text>
      </View>

      {!seats && <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />}

      <ScrollView contentContainerStyle={styles.content}>
        {rows.map((row) => (
          <View key={row} style={styles.row}>
            <Text style={styles.rowLabel}>{row}</Text>
            {COLUMNS.map((col, i) => {
              const seat = byKey.get(`${row}${col}`);
              if (!seat) return <View key={col} style={styles.seatGap} />;
              const isSelected = selected === seat.seatNumber;
              return (
                <View key={col} style={{ flexDirection: "row" }}>
                  <TouchableOpacity
                    disabled={!seat.available}
                    onPress={() => setSelected(seat.seatNumber)}
                    style={[
                      styles.seat,
                      !seat.available && styles.seatUnavailable,
                      isSelected && styles.seatSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.seatText,
                        !seat.available && styles.seatTextUnavailable,
                        isSelected && styles.seatTextSelected,
                      ]}
                    >
                      {seat.seatNumber}
                    </Text>
                  </TouchableOpacity>
                  {i === 2 && <View style={styles.aisle} />}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {selected ? `Assento ${selected} selecionado` : "Escolha um assento disponível"}
        </Text>
        <TouchableOpacity
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
          disabled={!selected}
          onPress={onContinue}
        >
          <Text style={styles.continueBtnText}>Continuar →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.slate50 },
  header: { paddingHorizontal: 20, paddingTop: 16 },
  back: { color: colors.brand, fontSize: 14, fontWeight: "600" },
  cabin: { fontSize: 11, color: colors.brand, fontWeight: "700", marginTop: 10, textTransform: "uppercase" },
  title: { fontSize: 18, fontWeight: "800", color: colors.slate950, marginTop: 2 },
  subtitle: { fontSize: 13, color: colors.slate500, marginTop: 2, marginBottom: 8 },
  content: { padding: 20, alignItems: "center", gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowLabel: { width: 20, fontSize: 11, color: colors.slate400, textAlign: "center" },
  seat: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.emeraldBg,
    alignItems: "center",
    justifyContent: "center",
  },
  seatUnavailable: { backgroundColor: colors.slate100 },
  seatSelected: { backgroundColor: colors.brand },
  seatText: { fontSize: 9, fontWeight: "700", color: colors.emerald },
  seatTextUnavailable: { color: colors.slate400 },
  seatTextSelected: { color: colors.white },
  aisle: { width: 10 },
  seatGap: { width: 32, height: 32 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
    padding: 16,
    backgroundColor: colors.white,
  },
  footerText: { fontSize: 13, color: colors.slate600, marginBottom: 10, textAlign: "center" },
  continueBtn: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: colors.white, fontSize: 15, fontWeight: "700" },
});

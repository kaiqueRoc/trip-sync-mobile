import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AIRPORTS } from "@trip-sync/contracts";
import { useNavigation } from "../state/navigation";
import { colors } from "../theme";

const AIRPORT_ENTRIES = Object.entries(AIRPORTS);
const DATE_PRESETS = [7, 14, 21, 30];

function inDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function SearchScreen() {
  const { push } = useNavigation();
  const [origin, setOrigin] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [dateDays, setDateDays] = useState(14);
  const [passengers, setPassengers] = useState(1);

  const canSearch = origin && destination && origin !== destination;

  function onSearch() {
    if (!canSearch) return;
    push({
      name: "Results",
      params: {
        origin,
        destination,
        departureDate: inDaysIso(dateDays),
        passengers,
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>TripSync</Text>
        <Text style={styles.subtitle}>Encontre e emita sua passagem aérea</Text>

        <Text style={styles.label}>Origem</Text>
        <ChipRow
          entries={AIRPORT_ENTRIES}
          selected={origin}
          onSelect={setOrigin}
        />

        <Text style={styles.label}>Destino</Text>
        <ChipRow
          entries={AIRPORT_ENTRIES}
          selected={destination}
          onSelect={setDestination}
        />

        <Text style={styles.label}>Data de ida</Text>
        <View style={styles.row}>
          {DATE_PRESETS.map((days) => (
            <TouchableOpacity
              key={days}
              onPress={() => setDateDays(days)}
              style={[styles.pill, dateDays === days && styles.pillActive]}
            >
              <Text
                style={[
                  styles.pillText,
                  dateDays === days && styles.pillTextActive,
                ]}
              >
                {days} dias
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Passageiros</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => setPassengers((p) => Math.max(1, p - 1))}
          >
            <Text style={styles.stepperBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{passengers}</Text>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => setPassengers((p) => Math.min(9, p + 1))}
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.searchBtn, !canSearch && styles.searchBtnDisabled]}
          disabled={!canSearch}
          onPress={onSearch}
        >
          <Text style={styles.searchBtnText}>Buscar voos</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChipRow({
  entries,
  selected,
  onSelect,
}: {
  entries: [string, string][];
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
      {entries.map(([code, city]) => (
        <TouchableOpacity
          key={code}
          onPress={() => onSelect(code)}
          style={[styles.chip, selected === code && styles.chipActive]}
        >
          <Text style={[styles.chipText, selected === code && styles.chipTextActive]}>
            {city} ({code})
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.slate50 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "800", color: colors.brandDark },
  subtitle: { fontSize: 15, color: colors.slate600, marginTop: 4, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "600", color: colors.slate600, marginTop: 16, marginBottom: 8 },
  chipRow: { flexDirection: "row" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 13, color: colors.slate600, fontWeight: "500" },
  chipTextActive: { color: colors.white },
  row: { flexDirection: "row", gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  pillActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  pillText: { fontSize: 13, color: colors.slate600, fontWeight: "500" },
  pillTextActive: { color: colors.white },
  stepper: { flexDirection: "row", alignItems: "center", gap: 16 },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: { fontSize: 20, color: colors.slate900, fontWeight: "600" },
  stepperValue: { fontSize: 17, fontWeight: "700", color: colors.slate900, minWidth: 24, textAlign: "center" },
  searchBtn: {
    marginTop: 32,
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  searchBtnDisabled: { opacity: 0.5 },
  searchBtnText: { color: colors.white, fontSize: 16, fontWeight: "700" },
});

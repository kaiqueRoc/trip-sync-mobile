import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AuthProvider, useAuth } from "./src/state/auth-context";
import { NavigationProvider, useNavigation } from "./src/state/navigation";
import { SearchScreen } from "./src/screens/SearchScreen";
import { ResultsScreen } from "./src/screens/ResultsScreen";
import { SeatMapScreen } from "./src/screens/SeatMapScreen";
import { CheckoutScreen } from "./src/screens/CheckoutScreen";
import { ConfirmationScreen } from "./src/screens/ConfirmationScreen";
import { MyBookingsScreen } from "./src/screens/MyBookingsScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { colors } from "./src/theme";

const SCREENS: Record<string, React.ComponentType> = {
  Search: SearchScreen,
  Results: ResultsScreen,
  SeatMap: SeatMapScreen,
  Checkout: CheckoutScreen,
  Confirmation: ConfirmationScreen,
  MyBookings: MyBookingsScreen,
  Login: LoginScreen,
};

// These screens render their own full-bleed header/back button.
const HIDE_TOP_BAR = new Set(["Results", "SeatMap", "Checkout", "Login"]);

function TopBar() {
  const { current, reset } = useNavigation();
  const { state, signOut } = useAuth();

  if (HIDE_TOP_BAR.has(current.name)) return null;

  return (
    <SafeAreaView style={styles.topBarSafe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => reset({ name: "Search" })}>
          <Text style={styles.brand}>TripSync</Text>
        </TouchableOpacity>
        <View style={styles.topBarRight}>
          <TouchableOpacity onPress={() => reset({ name: "MyBookings" })}>
            <Text style={styles.link}>Minhas reservas</Text>
          </TouchableOpacity>
          {state.user ? (
            <TouchableOpacity onPress={signOut}>
              <Text style={styles.linkMuted}>Sair</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => reset({ name: "Login" })}>
              <Text style={styles.linkMuted}>Entrar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function Screens() {
  const { current } = useNavigation();
  const Screen = SCREENS[current.name] ?? SearchScreen;
  return (
    <View style={{ flex: 1 }}>
      <TopBar />
      <Screen />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <Screens />
        <StatusBar style="dark" />
      </NavigationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  topBarSafe: { backgroundColor: colors.white },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  brand: { fontSize: 16, fontWeight: "800", color: colors.brandDark },
  topBarRight: { flexDirection: "row", gap: 16, alignItems: "center" },
  link: { fontSize: 13, fontWeight: "600", color: colors.slate600 },
  linkMuted: { fontSize: 13, fontWeight: "600", color: colors.brand },
});

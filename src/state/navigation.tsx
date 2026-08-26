import { createContext, useContext, useState, type ReactNode } from "react";

export type Screen = { name: string; params?: Record<string, unknown> };

type NavContextValue = {
  current: Screen;
  push: (screen: Screen) => void;
  pop: () => void;
  reset: (screen: Screen) => void;
  canGoBack: boolean;
};

const NavContext = createContext<NavContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Screen[]>([{ name: "Search" }]);

  return (
    <NavContext.Provider
      value={{
        current: stack[stack.length - 1],
        canGoBack: stack.length > 1,
        push: (screen) => setStack((s) => [...s, screen]),
        pop: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
        reset: (screen) => setStack([screen]),
      }}
    >
      {children}
    </NavContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNavigation must be used within NavigationProvider");
  return ctx;
}

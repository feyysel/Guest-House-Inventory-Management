import { combineReducers, configureStore, createSlice } from "@reduxjs/toolkit";
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";
import { DEFAULT_GUESTHOUSE_NAME } from "@/lib/branding";
import type { SessionUser } from "@/lib/session";
import type { ThemeMode } from "@/lib/theme";

export type ReservationDraft = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  openEnded: boolean;
  adults: string;
  children: string;
  notes: string;
  paymentAmount: string;
  paymentMethod: string;
  paymentTransactionRef: string;
};

const emptyDraft: ReservationDraft = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  roomId: "",
  checkIn: "",
  checkOut: "",
  openEnded: false,
  adults: "1",
  children: "0",
  notes: "",
  paymentAmount: "",
  paymentMethod: "CASH",
  paymentTransactionRef: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState: { user: null as SessionUser | null },
  reducers: {
    setUser(state, action: { payload: SessionUser | null }) {
      state.user = action.payload;
    },
  },
});

export const initialUiState = {
  sidebarOpen: false,
  guesthouseName: DEFAULT_GUESTHOUSE_NAME,
  pendingReservations: 0,
  reservationFormOpen: false,
  reservationSearch: "",
  reservationStatusFilter: "ALL",
  theme: "light" as ThemeMode,
};

const uiSlice = createSlice({
  name: "ui",
  initialState: initialUiState,
  reducers: {
    setSidebarOpen(state, action: { payload: boolean }) {
      state.sidebarOpen = action.payload;
    },
    setGuesthouseName(state, action: { payload: string }) {
      state.guesthouseName = action.payload;
    },
    setPendingReservations(state, action: { payload: number }) {
      state.pendingReservations = action.payload;
    },
    setReservationFormOpen(state, action: { payload: boolean }) {
      state.reservationFormOpen = action.payload;
    },
    setReservationSearch(state, action: { payload: string }) {
      state.reservationSearch = action.payload;
    },
    setReservationStatusFilter(state, action: { payload: string }) {
      state.reservationStatusFilter = action.payload;
    },
    setTheme(state, action: { payload: ThemeMode }) {
      state.theme = action.payload;
    },
  },
});

const reservationDraftSlice = createSlice({
  name: "reservationDraft",
  initialState: emptyDraft,
  reducers: {
    setReservationDraft(state, action: { payload: Partial<ReservationDraft> }) {
      Object.assign(state, action.payload);
    },
    resetReservationDraft() {
      return emptyDraft;
    },
  },
});

const rootReducer = combineReducers({
  auth: authSlice.reducer,
  ui: uiSlice.reducer,
  reservationDraft: reservationDraftSlice.reducer,
});

export const { setUser } = authSlice.actions;
export const {
  setSidebarOpen,
  setGuesthouseName,
  setPendingReservations,
  setReservationFormOpen,
  setReservationSearch,
  setReservationStatusFilter,
  setTheme,
} = uiSlice.actions;
export const { setReservationDraft, resetReservationDraft } =
  reservationDraftSlice.actions;

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

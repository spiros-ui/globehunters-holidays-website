// Airline and board type configuration for package pricing

export interface AirlineOption {
  code: string;
  name: string;
  logo: string;
  priceModifier: number;
  stops: number;
  outboundDepartureTime: string;
  outboundArrivalTime: string;
  inboundDepartureTime: string;
  inboundArrivalTime: string;
  cabinBaggage: string;
  checkedBaggage: string;
}

export const AIRLINE_OPTIONS: AirlineOption[] = [
  {
    code: "BA",
    name: "British Airways",
    logo: "https://pics.avs.io/400/160/BA.png",
    priceModifier: 0,
    stops: 0,
    outboundDepartureTime: "09:00",
    outboundArrivalTime: "12:30",
    inboundDepartureTime: "14:00",
    inboundArrivalTime: "17:30",
    cabinBaggage: "1 x 23kg",
    checkedBaggage: "1 x 23kg",
  },
  {
    code: "EK",
    name: "Emirates",
    logo: "https://pics.avs.io/400/160/EK.png",
    priceModifier: 15, // 15% more expensive
    stops: 1,
    outboundDepartureTime: "07:30",
    outboundArrivalTime: "18:45",
    inboundDepartureTime: "21:00",
    inboundArrivalTime: "06:30",
    cabinBaggage: "1 x 7kg",
    checkedBaggage: "2 x 23kg",
  },
  {
    code: "QR",
    name: "Qatar Airways",
    logo: "https://pics.avs.io/400/160/QR.png",
    priceModifier: 10, // 10% more expensive
    stops: 1,
    outboundDepartureTime: "08:00",
    outboundArrivalTime: "17:30",
    inboundDepartureTime: "22:30",
    inboundArrivalTime: "07:15",
    cabinBaggage: "1 x 7kg",
    checkedBaggage: "2 x 23kg",
  },
  {
    code: "TK",
    name: "Turkish Airlines",
    logo: "https://pics.avs.io/400/160/TK.png",
    priceModifier: -5, // 5% cheaper
    stops: 1,
    outboundDepartureTime: "06:30",
    outboundArrivalTime: "16:00",
    inboundDepartureTime: "19:30",
    inboundArrivalTime: "23:45",
    cabinBaggage: "1 x 8kg",
    checkedBaggage: "1 x 23kg",
  },
];

// Board type options with price modifiers
export type BoardType = "Room Only" | "Bed & Breakfast" | "Half Board" | "All Inclusive";

export interface BoardOption {
  id: string;
  type: BoardType;
  description: string;
  priceModifier: number; // Percentage modifier on hotel price
}

export const BOARD_OPTIONS: BoardOption[] = [
  {
    id: "room-only",
    type: "Room Only",
    description: "Accommodation only",
    priceModifier: 0,
  },
  {
    id: "bb",
    type: "Bed & Breakfast",
    description: "Breakfast included daily",
    priceModifier: 15,
  },
  {
    id: "hb",
    type: "Half Board",
    description: "Breakfast & dinner included",
    priceModifier: 35,
  },
  {
    id: "ai",
    type: "All Inclusive",
    description: "All meals & selected drinks",
    priceModifier: 60,
  },
];

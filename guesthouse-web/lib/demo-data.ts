export interface DemoRoom {
  id: string;
  number: string;
  type: string;
  floor: string;
  maxOccupancy: number;
  bedType: string;
  sizeSqm: number;
  pricePerNight: number;
  amenities: string[];
  status: "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE" | "RESERVED" | "BLOCKED";
}

// Shared across the rooms list, room details, the new-booking room-select step,
// and walk-in check-in's room picker so every screen agrees on the same inventory.
export const DEMO_ROOMS: DemoRoom[] = [
  {
    id: "101",
    number: "101",
    type: "Standard Room",
    floor: "Floor 1",
    maxOccupancy: 2,
    bedType: "1 Double Bed",
    sizeSqm: 18,
    pricePerNight: 20,
    amenities: ["Wi-Fi", "Air Conditioning", "Hot Water", "Television"],
    status: "AVAILABLE",
  },
  {
    id: "102",
    number: "102",
    type: "Deluxe Room",
    floor: "Floor 1",
    maxOccupancy: 2,
    bedType: "1 Queen Bed",
    sizeSqm: 22,
    pricePerNight: 25,
    amenities: ["Wi-Fi", "Air Conditioning", "Mini Fridge", "Balcony"],
    status: "OCCUPIED",
  },
  {
    id: "103",
    number: "103",
    type: "VIP Room",
    floor: "Floor 1",
    maxOccupancy: 2,
    bedType: "1 King Bed",
    sizeSqm: 28,
    pricePerNight: 40,
    amenities: ["Wi-Fi", "Air Conditioning", "Mini Bar", "Bathtub"],
    status: "CLEANING",
  },
  {
    id: "104",
    number: "104",
    type: "Family Room",
    floor: "Floor 2",
    maxOccupancy: 4,
    bedType: "2 Double Beds",
    sizeSqm: 32,
    pricePerNight: 35,
    amenities: ["Wi-Fi", "Air Conditioning", "Television", "Sofa"],
    status: "AVAILABLE",
  },
  {
    id: "105",
    number: "105",
    type: "Standard Room",
    floor: "Floor 2",
    maxOccupancy: 2,
    bedType: "1 Double Bed",
    sizeSqm: 18,
    pricePerNight: 20,
    amenities: ["Wi-Fi", "Air Conditioning", "Hot Water"],
    status: "MAINTENANCE",
  },
];

export function getRoomById(id: string): DemoRoom | undefined {
  return DEMO_ROOMS.find((room) => room.id === id);
}

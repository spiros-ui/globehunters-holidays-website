import { NextRequest, NextResponse } from "next/server";
import { getHotelDetails, getBoardName } from "@/lib/hotelbeds";

export interface RoomRate {
  roomName: string;
  boardCode: string;
  boardName: string;
  totalPrice: number;
  pricePerNight: number;
  currency: string;
  freeCancellation: boolean;
  cancellationDeadline?: string;
  rateKey: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codeParam = searchParams.get("code");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const adults = parseInt(searchParams.get("adults") || "2");
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const currency = searchParams.get("currency") || "GBP";

  if (!codeParam || !checkIn || !checkOut) {
    return NextResponse.json(
      { status: false, error: "Missing required parameters: code, checkIn, checkOut" },
      { status: 400 }
    );
  }

  const code = parseInt(codeParam, 10);
  if (isNaN(code)) {
    return NextResponse.json(
      { status: false, error: "Invalid hotel code" },
      { status: 400 }
    );
  }

  try {
    const result = await getHotelDetails(code, checkIn, checkOut, adults, 0, rooms, currency);

    if (result.error === "no_credentials") {
      return NextResponse.json(
        { status: false, error: "Hotel API not configured" },
        { status: 503 }
      );
    }

    if (!result.hotel) {
      return NextResponse.json(
        { status: false, error: result.error || "No rates available" },
        { status: 404 }
      );
    }

    // Calculate nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Extract all room rates, deduplicate by boardCode (keep cheapest per board)
    const ratesByBoard = new Map<string, RoomRate>();

    for (const room of result.hotel.rooms) {
      for (const rate of room.rates) {
        const boardCode = rate.boardCode || "RO";
        const totalPrice = parseFloat(rate.net);

        if (totalPrice <= 0) continue;

        const existing = ratesByBoard.get(boardCode);
        if (!existing || totalPrice < existing.totalPrice) {
          const hasCancellation = rate.cancellationPolicies &&
            rate.cancellationPolicies.length > 0 &&
            parseFloat(rate.cancellationPolicies[0].amount) === 0;

          ratesByBoard.set(boardCode, {
            roomName: room.name,
            boardCode,
            boardName: getBoardName(boardCode),
            totalPrice: Math.round(totalPrice * 100) / 100,
            pricePerNight: Math.round((totalPrice / nights) * 100) / 100,
            currency: result.hotel!.currency || currency,
            freeCancellation: hasCancellation || false,
            cancellationDeadline: hasCancellation && rate.cancellationPolicies?.[0]?.from
              ? rate.cancellationPolicies[0].from
              : undefined,
            rateKey: rate.rateKey,
          });
        }
      }
    }

    // Sort rates by price
    const rates = Array.from(ratesByBoard.values()).sort((a, b) => a.totalPrice - b.totalPrice);

    return NextResponse.json({
      status: true,
      data: {
        hotelCode: code,
        hotelName: result.hotel.name,
        nights,
        rates,
      },
    });
  } catch (error: any) {
    console.error("Hotel rates error:", error.message);
    return NextResponse.json(
      { status: false, error: "Failed to fetch hotel rates" },
      { status: 500 }
    );
  }
}

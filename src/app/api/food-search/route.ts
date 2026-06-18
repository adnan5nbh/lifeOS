import { NextRequest, NextResponse } from "next/server";

interface OFFProduct {
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: {
    "energy-kcal_serving"?: number;
    "energy-kcal_100g"?: number;
    proteins_serving?: number;
    proteins_100g?: number;
    carbohydrates_serving?: number;
    carbohydrates_100g?: number;
    fat_serving?: number;
    fat_100g?: number;
  };
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&json=1&page_size=8&fields=product_name,product_name_en,brands,serving_size,nutriments`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return NextResponse.json({ results: [] });

    const data = (await res.json()) as { products?: OFFProduct[] };
    const products = data.products ?? [];

    const results = products
      .map((p) => {
        const n = p.nutriments ?? {};
        const per: "serving" | "100g" = n["energy-kcal_serving"] != null ? "serving" : "100g";
        const calories = n["energy-kcal_serving"] ?? n["energy-kcal_100g"];
        const protein = n.proteins_serving ?? n.proteins_100g;
        const carbs = n.carbohydrates_serving ?? n.carbohydrates_100g;
        const fat = n.fat_serving ?? n.fat_100g;
        const name = p.product_name || p.product_name_en;
        if (!name || calories == null) return null;
        return {
          name: name.trim(),
          brand: p.brands?.split(",")[0]?.trim() ?? undefined,
          servingSize: p.serving_size ?? (per === "100g" ? "100g" : undefined),
          calories: Math.round(calories),
          protein: protein != null ? Math.round(protein * 10) / 10 : 0,
          carbs: carbs != null ? Math.round(carbs * 10) / 10 : undefined,
          fat: fat != null ? Math.round(fat * 10) / 10 : undefined,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}

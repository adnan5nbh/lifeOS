interface OpenFoodFactsNutriments {
  "energy-kcal_serving"?: number;
  "energy-kcal_100g"?: number;
  proteins_serving?: number;
  proteins_100g?: number;
  carbohydrates_serving?: number;
  carbohydrates_100g?: number;
  fat_serving?: number;
  fat_100g?: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode");
  if (!barcode) {
    return Response.json({ error: "Missing barcode" }, { status: 400 });
  }

  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`);
  if (!res.ok) {
    return Response.json({ found: false }, { status: 404 });
  }

  const data = await res.json();
  if (data.status !== 1 || !data.product) {
    return Response.json({ found: false }, { status: 404 });
  }

  const product = data.product;
  const nutriments: OpenFoodFactsNutriments = product.nutriments ?? {};
  const per: "serving" | "100g" = nutriments["energy-kcal_serving"] != null ? "serving" : "100g";

  return Response.json({
    found: true,
    barcode,
    name: product.product_name || product.product_name_en || "Unknown product",
    brand: product.brands || undefined,
    servingSize: product.serving_size || undefined,
    calories: nutriments["energy-kcal_serving"] ?? nutriments["energy-kcal_100g"],
    protein: nutriments.proteins_serving ?? nutriments.proteins_100g,
    carbs: nutriments.carbohydrates_serving ?? nutriments.carbohydrates_100g,
    fat: nutriments.fat_serving ?? nutriments.fat_100g,
    per,
  });
}

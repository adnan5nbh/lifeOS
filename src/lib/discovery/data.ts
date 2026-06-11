/** Day-of-year (1-366), used to deterministically pick "today's" item from a list. */
export function dayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

export function pickForToday<T>(list: T[]): T {
  return list[dayOfYear() % list.length];
}

// A curated list of interesting, less-everyday words — all should resolve
// in the Free Dictionary API (api.dictionaryapi.dev).
export const WORD_LIST: string[] = [
  "serendipity", "ephemeral", "luminous", "mellifluous", "petrichor",
  "wanderlust", "ineffable", "ethereal", "labyrinth", "nostalgia",
  "resilience", "solitude", "euphoria", "tranquil", "vivid",
  "whimsical", "zenith", "cascade", "harbinger", "iridescent",
  "kaleidoscope", "quintessential", "serene", "tangent", "velvet",
  "wistful", "yearning", "zephyr", "amalgam", "brevity",
  "candor", "diligent", "elixir", "fortitude", "gossamer",
  "halcyon", "incandescent", "juxtapose", "lucid", "myriad",
  "nuance", "oasis", "paradox", "quaint", "radiant",
  "sanctuary", "tenacious", "ubiquitous", "valiant", "whisper",
  "yonder", "zealous", "abundant", "bliss", "candid",
  "dawn", "enchant", "frolic", "glimmer", "horizon",
  "infinite", "jubilant", "keen", "lush", "marvel",
  "novel", "opulent", "pristine", "quiver", "ripple",
  "spark", "thrive", "unwind", "vibrant", "wander",
];

export interface FlowerInfo {
  name: string;
  wikipediaTitle: string;
  meaning: string;
  funFact: string;
}

export const FLOWER_LIST: FlowerInfo[] = [
  { name: "Rose", wikipediaTitle: "Rose", meaning: "Love, passion, and beauty — different colors carry different meanings, from red (romantic love) to yellow (friendship).", funFact: "Roses are one of the oldest cultivated plants, with fossil evidence dating back 35 million years." },
  { name: "Tulip", wikipediaTitle: "Tulip", meaning: "Perfect or deep love. In the 17th century, tulips were so prized in the Netherlands that bulbs sold for more than houses.", funFact: "Tulip 'mania' in the 1630s is considered one of the first recorded speculative bubbles in history." },
  { name: "Sunflower", wikipediaTitle: "Sunflower", meaning: "Adoration, loyalty, and longevity. Their bright form has made them a symbol of warmth and positivity.", funFact: "Young sunflowers track the sun across the sky, a behavior called heliotropism." },
  { name: "Lily", wikipediaTitle: "Lily", meaning: "Purity, refined beauty, and renewal — often associated with motherhood and rebirth.", funFact: "Lilies have been cultivated for over 3,000 years and appear in ancient Egyptian and Greek art." },
  { name: "Orchid", wikipediaTitle: "Orchidaceae", meaning: "Luxury, strength, and exotic beauty. In Victorian times, orchids symbolized rare and delicate love.", funFact: "Orchidaceae is one of the largest plant families, with over 25,000 known species." },
  { name: "Daisy", wikipediaTitle: "Bellis perennis", meaning: "Innocence, purity, and new beginnings — its name comes from 'day's eye', as it opens at dawn.", funFact: "A daisy 'flower' is actually a cluster of dozens of tiny individual flowers." },
  { name: "Lavender", wikipediaTitle: "Lavandula", meaning: "Calm, grace, and devotion. Long associated with relaxation and purification.", funFact: "Ancient Romans used lavender to scent their bathwater — its name comes from the Latin 'lavare', to wash." },
  { name: "Iris", wikipediaTitle: "Iris (plant)", meaning: "Wisdom, hope, and trust — named after the Greek goddess of the rainbow.", funFact: "The fleur-de-lis, a symbol used in heraldry for centuries, is widely believed to be a stylized iris." },
  { name: "Peony", wikipediaTitle: "Peony", meaning: "Honor, wealth, and a happy marriage — a symbol of prosperity in East Asian cultures.", funFact: "Some peony plants can live and bloom for over 100 years." },
  { name: "Lotus", wikipediaTitle: "Nelumbo nucifera", meaning: "Purity and spiritual awakening — it rises clean from muddy water, a symbol used across many religions.", funFact: "Lotus seeds can remain viable for over 1,000 years and still germinate." },
  { name: "Cherry Blossom", wikipediaTitle: "Prunus serrulata", meaning: "The fleeting, beautiful nature of life — central to the Japanese concept of 'mono no aware'.", funFact: "Cherry blossoms typically bloom for only one to two weeks each year." },
  { name: "Marigold", wikipediaTitle: "Tagetes", meaning: "Passion and creativity, but also remembrance — used in Día de los Muertos celebrations.", funFact: "Marigold petals are edible and used to color foods like cheese and rice." },
  { name: "Hydrangea", wikipediaTitle: "Hydrangea", meaning: "Gratitude and heartfelt emotion, though in some traditions it can also mean apology.", funFact: "A hydrangea's flower color can change based on the acidity of the soil it grows in." },
  { name: "Daffodil", wikipediaTitle: "Narcissus (plant)", meaning: "New beginnings and rebirth — often the first flower to bloom after winter.", funFact: "In the Netherlands, daffodils are a symbol of hope and are given out on national cancer awareness day." },
  { name: "Carnation", wikipediaTitle: "Dianthus caryophyllus", meaning: "Fascination and distinction — pink carnations are traditionally linked to a mother's undying love.", funFact: "Carnations have been cultivated for over 2,000 years." },
  { name: "Chrysanthemum", wikipediaTitle: "Chrysanthemum", meaning: "Friendship, joy, and long life — the national flower of Japan.", funFact: "In Japan, the Chrysanthemum Throne refers to the seat of the emperor." },
  { name: "Magnolia", wikipediaTitle: "Magnolia", meaning: "Nobility, perseverance, and dignity.", funFact: "Magnolias are one of the most ancient flowering plants, predating bees — they evolved to be pollinated by beetles." },
  { name: "Poppy", wikipediaTitle: "Papaver", meaning: "Remembrance and consolation — worn in many countries to honor fallen soldiers.", funFact: "Poppy seeds found in ancient tombs have been known to remain dormant for decades." },
  { name: "Jasmine", wikipediaTitle: "Jasminum", meaning: "Sensuality, grace, and purity — its scent is strongest at night.", funFact: "Jasmine flowers are picked at night and used to scent tea while it's still fresh." },
  { name: "Violet", wikipediaTitle: "Viola (plant)", meaning: "Modesty, faithfulness, and remembrance.", funFact: "Violets contain compounds that can desensitize taste buds to smell, which is why they're used in some candies." },
  { name: "Hibiscus", wikipediaTitle: "Hibiscus", meaning: "Delicate beauty and fleeting fame — each flower often lasts only a single day.", funFact: "Hibiscus flowers are used to make a tart, ruby-red tea enjoyed in many cultures." },
  { name: "Dahlia", wikipediaTitle: "Dahlia", meaning: "Inner strength, elegance, and commitment.", funFact: "The dahlia is the national flower of Mexico, where it grows wild in the mountains." },
  { name: "Camellia", wikipediaTitle: "Camellia", meaning: "Admiration, perfection, and longing.", funFact: "The leaves of one camellia species, Camellia sinensis, are used to make all true tea." },
  { name: "Azalea", wikipediaTitle: "Azalea", meaning: "Temperance, passion, and taking care of yourself.", funFact: "Azaleas are part of the rhododendron genus and can bloom in nearly every color except true blue." },
  { name: "Wisteria", wikipediaTitle: "Wisteria", meaning: "Devotion, patience, and the rewards of long-term commitment.", funFact: "A single wisteria vine in Japan covers over 2,000 square meters and is more than 150 years old." },
  { name: "Forget-me-not", wikipediaTitle: "Myosotis", meaning: "True love and lasting memories — the name comes from a medieval legend of a knight who fell into a river.", funFact: "Forget-me-nots are used as a symbol for Alzheimer's awareness in several countries." },
  { name: "Gardenia", wikipediaTitle: "Gardenia", meaning: "Secret love and purity.", funFact: "Gardenia flowers turn from white to yellow as they age, even after being cut." },
  { name: "Bluebell", wikipediaTitle: "Hyacinthoides non-scripta", meaning: "Humility, gratitude, and everlasting love.", funFact: "It can take a bluebell seed five to seven years to develop into a mature, flowering plant." },
  { name: "Anemone", wikipediaTitle: "Anemone", meaning: "Anticipation and protection against evil — its name means 'daughter of the wind' in Greek.", funFact: "Anemone flowers close up at night and reopen each morning." },
  { name: "Freesia", wikipediaTitle: "Freesia", meaning: "Trust, friendship, and thoughtfulness.", funFact: "Freesia's strong, sweet scent is one of the most popular in the perfume industry." },
];

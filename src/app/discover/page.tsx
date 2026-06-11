import DigestCard from "@/components/discovery/DigestCard";
import RandomArticleCard from "@/components/discovery/RandomArticleCard";
import WordOfDayCard from "@/components/discovery/WordOfDayCard";
import FlowerOfDayCard from "@/components/discovery/FlowerOfDayCard";

export default function DiscoverPage() {
  return (
    <div className="flex flex-1 justify-center bg-slate-950">
      <main className="flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Daily Discovery</h1>
          <p className="text-sm text-slate-400">
            A little something new to read, learn, and enjoy each day.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <DigestCard />
          <RandomArticleCard />
          <WordOfDayCard />
          <FlowerOfDayCard />
        </div>
      </main>
    </div>
  );
}

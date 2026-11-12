import { Link } from "wouter";
import { HeroArt } from "@/components/art";

export default function NotFound() {
  return (
    <div className="zhero-wrap">
    <section className="zhero on-dark items-center px-6 py-6 text-center">
      <div className="relative">
        <div className="mb-2 flex justify-center"><HeroArt motif="lost" className="is-sm" /></div>
        <div className="eyebrow text-[#D1F470]">404 · Off the call path</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-[2rem]">This room <span className="serif italic text-[#D1F470]">doesn't exist.</span></h1>
        <Link href="/" className="mt-5 inline-flex rounded-full transition-transform hover:-translate-y-0.5 bg-[#D1F470] px-6 py-3 text-sm font-semibold text-[#11110D]" data-testid="link-404-home">Back to the depot</Link>
      </div>
    </section>
    </div>
  );
}

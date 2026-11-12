import { Link } from "wouter";

export default function NotFound() {
  return (
    <section className="on-dark grid min-h-[80dvh] place-items-center bg-[#203524] px-6 pt-24 text-center text-[#F5F5F2]">
      <div>
        <div className="eyebrow text-[#D1F470]">404 · Off the call path</div>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-7xl">This room <span className="serif italic text-[#D1F470]">doesn't exist.</span></h1>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-[#D1F470] px-6 py-3 text-sm font-semibold text-[#11110D]" data-testid="link-404-home">Back to the depot</Link>
      </div>
    </section>
  );
}

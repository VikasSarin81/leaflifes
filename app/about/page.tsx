import Image from "next/image";

export const metadata = {
  title: "About Us",
  description: "The story behind LEAFLIFE — born natural, stay natural.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl leading-tight text-ink">
        Born natural. Stay natural.
      </h1>
      <p className="mt-5 max-w-prose text-ink/70">
        LEAFLIFE started with a simple annoyance: reading the back of a
        "natural" skincare bottle and needing a chemistry degree to know
        what was actually in it. So we make things the older way instead —
        cold-pressed, hand-blended, small-batch — and we put exactly what's
        in the bottle on the label, in words a person can actually say out
        loud.
      </p>

      <div className="relative my-10 aspect-[16/9] overflow-hidden rounded-lg">
        <Image
          src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200"
          alt="Natural ingredients used in LEAFLIFE products"
          fill
          sizes="(min-width: 768px) 700px, 100vw"
          className="object-cover"
        />
      </div>

      <h2 className="font-display text-2xl text-ink">What we won't do</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-ink/70">
        <li>Add synthetic fragrance and call it "essential oil blend."</li>
        <li>Pad an ingredient list with water and call the rest "natural."</li>
        <li>Charge you for packaging that costs more than what's inside it.</li>
      </ul>

      <h2 className="mt-10 font-display text-2xl text-ink">What we do instead</h2>
      <p className="mt-4 max-w-prose text-ink/70">
        Every product is made in small batches, tested by actual people
        before it ships, and priced like the middleman was cut — because it
        was. If an ingredient doesn't earn its place in the bottle, it
        doesn't go in.
      </p>

      <div className="mt-12 rounded-lg bg-moss/5 p-6">
        <p className="font-display text-lg text-ink">Questions before you buy?</p>
        <p className="mt-2 text-ink/70">
          We'd rather answer a question upfront than deal with a return
          later.{" "}
          <a href="/contact" className="text-moss-dark underline">
            Get in touch
          </a>
          .
        </p>
      </div>
    </div>
  );
}

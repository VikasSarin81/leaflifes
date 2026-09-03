import ContactForm from "@/components/ContactForm";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with LEAFLIFE.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl text-ink">Get in touch</h1>
      <p className="mt-3 max-w-prose text-ink/70">
        Question about an order, an ingredient, or anything else — send it
        over and we'll get back to you.You may Directly reach us at +91 9878654329
      </p>

      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}

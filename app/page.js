export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Find the customers most likely to buy.
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
          AI-powered sales intelligence that helps businesses identify, prioritize, and understand their best prospects.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/signup" className="rounded-lg bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition">
            Start Free
          </a>
          <a href="#how-it-works" className="rounded-lg border border-slate-300 px-6 py-3 text-slate-700 font-semibold hover:bg-slate-50 transition">
            See How It Works
          </a>
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <Step number="1" title="Tell us about your business" text="Share what you sell and who you want as customers." />
            <Step number="2" title="AI finds your best prospects" text="We score and rank leads based on your ideal customer profile." />
            <Step number="3" title="Reach out with confidence" text="Get personalized outreach drafts, ready for you to review and send." />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">Features</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <Feature title="Ideal Customer Profiles" text="AI analyzes your business and builds a clear picture of who to target." />
            <Feature title="Lead Scoring" text="Every lead gets a 0-100 score with a plain-language reason why." />
            <Feature title="Outreach Drafts" text="Personalized message drafts for email and WhatsApp, ready for your review." />
            <Feature title="Simple Pipeline" text="Track leads from New to Won without a bloated CRM." />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">See it in action</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Welcome back</p>
            <p className="text-xl font-semibold mb-6">ABC Motors</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Stat label="Total Leads" value="127" />
              <Stat label="High Priority" value="23" />
              <Stat label="Interested" value="8" />
              <Stat label="Won" value="3" />
            </div>
            <p className="text-sm font-semibold text-slate-500 mb-3">Top Prospects</p>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span>Company A</span><span className="font-semibold text-indigo-600">94/100</span></li>
              <li className="flex justify-between"><span>Company B</span><span className="font-semibold text-indigo-600">89/100</span></li>
              <li className="flex justify-between"><span>Company C</span><span className="font-semibold text-indigo-600">84/100</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-2">Pricing</h2>
          <p className="text-center text-slate-500 mb-12">Simple plans, coming soon.</p>
          <div className="grid sm:grid-cols-4 gap-6">
            <PricingCard name="Free Trial" price="Free" />
            <PricingCard name="Starter" price="TBD" />
            <PricingCard name="Business" price="TBD" />
            <PricingCard name="Pro" price="TBD" />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">FAQ</h2>
          <div className="space-y-6">
            <FAQ q="Does the AI send messages automatically?" a="No. You always review and approve every message before it is sent." />
            <FAQ q="Where do leads come from?" a="You add them yourself, upload a CSV, or connect a permitted data source. We do not scrape private information." />
            <FAQ q="Can I use this for any type of business?" a="Yes. It is built to work for small and medium businesses across many industries." />
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-sm text-slate-500">
        Royal Sales Intelligence
      </footer>
    </main>
  );
}

function Step({ number, title, text }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold">
        {number}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  );
}

function Feature({ title, text }) {
  return (
    <div className="rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function PricingCard({ name, price }) {
  return (
    <div className="rounded-xl border border-slate-200 p-6 text-center">
      <p className="font-semibold mb-2">{name}</p>
      <p className="text-2xl font-bold text-indigo-600">{price}</p>
    </div>
  );
}

function FAQ({ q, a }) {
  return (
    <div>
      <p className="font-semibold">{q}</p>
      <p className="text-sm text-slate-600 mt-1">{a}</p>
    </div>
  );
}

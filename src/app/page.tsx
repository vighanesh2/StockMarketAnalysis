import Link from "next/link";
import styles from "./page.module.css";

const checklist = [
  "✅ Type-safe Next.js App Router",
  "✅ ESLint + strict mode enabled",
  "✅ Zero-config Vercel deploy",
  "✅ Observability via Analytics & Speed Insights",
];

const features = [
  {
    title: "Performance-first",
    body: "Server Components, image optimization, and streaming ready-to-ship without additional setup.",
  },
  {
    title: "Security aware",
    body: "HTTPS by default on Vercel, automatic headers, and sensible metadata for SEO & sharing.",
  },
  {
    title: "Scales effortlessly",
    body: "Ship using Vercel's global edge network with incremental adoption of data, cache, and ISR.",
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Production ready Next.js starter</p>
        <h1>
          Launch <span>Stock Market Analysis</span> on Vercel in minutes.
        </h1>
        <p>
          Opinionated project structure, built-in instrumentation, and deployment
          automation ensure you can focus on product—not boilerplate.
        </p>
        <div className={styles.actions}>
          <Link href="https://vercel.com/new" className={styles.primaryCta}>
            Deploy to Vercel
          </Link>
          <Link
            href="https://nextjs.org/docs/app"
            className={styles.secondaryCta}
            target="_blank"
          >
            Read the docs
          </Link>
        </div>
        <ul className={styles.checklist}>
          {checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.grid}>
        {features.map((feature) => (
          <article key={feature.title} className={styles.card}>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>

      <section className={styles.deploy}>
        <div>
          <p className={styles.eyebrow}>Deploy checklist</p>
          <h2>Ready for vercel.json or dashboard workflows.</h2>
          <p>
            Connect your GitHub repo, leave the default build command (`next build`),
            and Vercel will provision previews for every PR and a stable production URL
            on merge.
          </p>
        </div>
        <div className={styles.snippet}>
          <code>
            <span>$ </span>npm run lint
          </code>
          <code>
            <span>$ </span>npm run build
          </code>
          <code>
            <span>$ </span>vercel deploy --prod
          </code>
        </div>
      </section>
    </main>
  );
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <a href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
          ← Back to Gyra
        </a>

        <h1 className="text-4xl font-bold mt-6 mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-10">Last updated: September 2026</p>

        <div className="flex flex-col gap-6 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Gyra, you agree to these Terms of Service.
              If you do not agree, do not use Gyra.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              Gyra is an AI assistant platform provided by Genvia AI Company,
              owned by Victory Lord Himself. The service is provided "as is" and may
              change without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Acceptable Use</h2>
            <p className="mb-3">You agree NOT to use Gyra to:</p>
            <ul className="list-disc list-inside flex flex-col gap-2 ml-4">
              <li>Break any laws or regulations.</li>
              <li>Generate harmful, illegal, or abusive content.</li>
              <li>Harass, threaten, or harm others.</li>
              <li>Attempt to hack, reverse-engineer, or abuse the service.</li>
              <li>Scrape, mass-download, or overload the platform.</li>
              <li>Impersonate anyone or misrepresent your identity.</li>
              <li>Bypass rate limits, jailbreak the AI, or extract system prompts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Account Responsibilities</h2>
            <p>
              You are responsible for your account and API keys. Do not share
              your API key publicly. If your key is exposed, revoke it
              immediately from gyra.ng/api.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. AI Disclaimer</h2>
            <p>
              Gyra is an AI system. It can make mistakes, hallucinate facts, or
              provide incorrect information. Do not rely on Gyra for legal,
              medical, financial, or safety-critical decisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Intellectual Property</h2>
            <p>
              The Gyra name, logo, and platform are owned by Genvia AI Company.
              You retain ownership of the content you send to Gyra.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Service Availability</h2>
            <p>
              We do not guarantee uptime or availability. Gyra may be
              temporarily unavailable for maintenance or unexpected issues.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p>
              Gyra is not liable for any damages resulting from use of the
              service, including but not limited to data loss, incorrect AI
              output, or service interruption.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate any account that
              violates these terms, at any time, without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to Terms</h2>
            <p>
              We may update these Terms at any time. Continued use of Gyra
              after changes means you accept the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact</h2>
            <p>
              Questions? Contact us at gyraofficialai@gmail.com or via{" "}
              <a href="https://t.me/Gyra_AiBot" className="text-blue-400 hover:underline">
                Telegram Bot
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
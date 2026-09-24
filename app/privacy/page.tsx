export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <a href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
          ← Back to Gyra
        </a>

        <h1 className="text-4xl font-bold mt-6 mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-10">Last updated: September 2026</p>

        <div className="flex flex-col gap-6 text-sm text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Gyra ("we", "our", "us") is an AI assistant platform created by
              Genvia AI Company, owned by Victory Lord. This Privacy Policy
              explains what information we collect, how we use it, and your
              rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <ul className="list-disc list-inside flex flex-col gap-2 ml-4">
              <li><strong>Account information:</strong> Your email address (from Google sign-in or email magic link).</li>
              <li><strong>Conversations:</strong> Messages you send to Gyra, stored in our secure database.</li>
              <li><strong>Attachments:</strong> Images and files you upload to analyze.</li>
              <li><strong>Usage data:</strong> Anonymous information about how you use Gyra (visits, feature usage).</li>
              <li><strong>Device information:</strong> Browser type, operating system, and IP address (hashed).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside flex flex-col gap-2 ml-4">
              <li>To provide and improve the Gyra service.</li>
              <li>To generate AI responses to your messages.</li>
              <li>To detect abuse and prevent unauthorized access.</li>
              <li>To communicate with you about updates or issues.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p className="mb-3">Gyra uses trusted third-party services:</p>
            <ul className="list-disc list-inside flex flex-col gap-2 ml-4">
              <li><strong>Supabase:</strong> Database, authentication, and file storage.</li>
              <li><strong>Groq, Google Gemini, Hugging Face, xAI:</strong> AI inference providers.</li>
              <li><strong>Vercel:</strong> Web hosting.</li>
            </ul>
            <p className="mt-3">
              Your messages are sent to these AI providers to generate responses.
              They do not store your data long-term.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <p>
              Your conversations are stored indefinitely unless you delete them.
              You can delete all conversations from Settings → Data Controls.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your data. To
              request data deletion, contact us at hello@gyra.ng.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Children's Privacy</h2>
            <p>
              Gyra is not intended for children under 13. We do not knowingly
              collect data from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Security</h2>
            <p>
              We use industry-standard encryption, rate limiting, and access
              controls to protect your data. However, no system is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Updates will
              be posted at gyra.ng/privacy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
            <p>
              Questions? Contact us at gyraoffialai@gmail.com or via{" "}
              <a href="https://t.me/Gyra_AiBot" className="text-blue-400 hover:underline">
                Telegram Ai Bot
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Privacy Policy - SalesMAXXing",
	description:
		"Privacy policy for the SalesMAXXing Chrome extension and web app.",
};

export default function PrivacyPage() {
	return (
		<main className="min-h-screen bg-black px-6 py-16 text-white">
			<div className="mx-auto max-w-3xl">
				<p className="text-sm uppercase tracking-[0.35em] text-zinc-500">
					Legal
				</p>
				<h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
					Privacy Policy
				</h1>
				<p className="mt-4 text-sm text-zinc-500">Last updated: March 2026</p>

				<p className="mt-8 text-base leading-7 text-zinc-400">
					SalesMAXXing (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
					operates a Chrome extension and companion web application for
					AI-powered lead qualification from LinkedIn. This policy explains what
					data we collect, how we use it, and your rights.
				</p>

				<div className="mt-12 space-y-10 text-base leading-7 text-zinc-300">
					{/* Section 1 */}
					<section>
						<h2 className="text-lg font-semibold text-white">
							1. What Data We Collect
						</h2>
						<p className="mt-3">
							SalesMAXXing collects the following categories of data:
						</p>
						<ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-400">
							<li>
								<span className="text-zinc-300">LinkedIn profile data</span>{" "}
								&mdash; name, headline, company, location, experience, and
								profile URL for connections visible on your LinkedIn pages.
							</li>
							<li>
								<span className="text-zinc-300">LinkedIn connections list</span>{" "}
								&mdash; names, headlines, and profile URLs of your first-degree
								connections as displayed in the LinkedIn web interface.
							</li>
							<li>
								<span className="text-zinc-300">Qualification criteria</span>{" "}
								&mdash; any custom criteria, prompts, or preferences you provide
								to configure how leads are scored and ranked.
							</li>
							<li>
								<span className="text-zinc-300">Account information</span>{" "}
								&mdash; your name, email, and LinkedIn profile metadata obtained
								through LinkedIn OIDC sign-in via Supabase.
							</li>
						</ul>
					</section>

					{/* Section 2 */}
					<section>
						<h2 className="text-lg font-semibold text-white">
							2. How We Use Your Data
						</h2>
						<p className="mt-3">Your data is used exclusively to:</p>
						<ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-400">
							<li>
								<span className="text-zinc-300">
									AI-powered lead qualification
								</span>{" "}
								&mdash; LinkedIn profile and connection data is sent to
								Anthropic&apos;s Claude API to score, rank, and qualify leads
								based on your criteria.
							</li>
							<li>
								<span className="text-zinc-300">
									Personalized InMail draft generation
								</span>{" "}
								&mdash; Claude generates tailored outreach messages for
								qualified leads, which you can review and edit before sending.
							</li>
							<li>
								<span className="text-zinc-300">Displaying ranked leads</span>{" "}
								&mdash; qualified results are presented in the extension side
								panel and web dashboard for your review.
							</li>
							<li>
								<span className="text-zinc-300">Authentication</span> &mdash;
								account information is used to maintain your session across the
								web app and Chrome extension.
							</li>
						</ul>
					</section>

					{/* Section 3 */}
					<section>
						<h2 className="text-lg font-semibold text-white">
							3. Data Storage
						</h2>
						<ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-400">
							<li>
								<span className="text-zinc-300">Supabase (PostgreSQL)</span>{" "}
								&mdash; qualified lead results, account information, and your
								qualification preferences are stored in our Supabase database.
								Data is protected by row-level security policies.
							</li>
							<li>
								<span className="text-zinc-300">chrome.storage.local</span>{" "}
								&mdash; the extension caches session tokens, extracted
								connection data, and user preferences locally on your device.
								This data never leaves your browser unless you trigger a
								qualification run.
							</li>
							<li>
								<span className="text-zinc-300">Encryption in transit</span>{" "}
								&mdash; all data transmitted between the extension, our API
								endpoints, and third-party services is encrypted via HTTPS/TLS.
							</li>
						</ul>
					</section>

					{/* Section 4 */}
					<section>
						<h2 className="text-lg font-semibold text-white">
							4. Data Sharing
						</h2>
						<p className="mt-3">
							We do <strong className="text-white">not</strong> sell, rent, or
							share your personal data with third parties for marketing or
							advertising purposes. Your data is only shared with the following
							service providers as strictly necessary to operate the product:
						</p>
						<ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-400">
							<li>
								<span className="text-zinc-300">Anthropic</span> &mdash;
								LinkedIn profile and connection data is sent to the Claude API
								for AI-powered lead qualification and InMail generation.
								Anthropic does not use API inputs for model training. See{" "}
								<a
									href="https://www.anthropic.com/privacy"
									target="_blank"
									rel="noopener noreferrer"
									className="text-white underline underline-offset-4 transition hover:text-zinc-300"
								>
									Anthropic&apos;s Privacy Policy
								</a>
								.
							</li>
							<li>
								<span className="text-zinc-300">Vercel</span> &mdash; hosts our
								API endpoints and web application.
							</li>
							<li>
								<span className="text-zinc-300">Supabase</span> &mdash; provides
								authentication and database services.
							</li>
						</ul>
						<p className="mt-3">No other third parties receive your data.</p>
					</section>

					{/* Section 5 */}
					<section>
						<h2 className="text-lg font-semibold text-white">
							5. Data Retention and Deletion
						</h2>
						<p className="mt-3">
							You may request deletion of all your data at any time by
							contacting us. Specifically:
						</p>
						<ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-400">
							<li>
								<span className="text-zinc-300">Server-side data</span> &mdash;
								deleting your account removes all associated data from our
								Supabase database, including qualified leads, preferences, and
								profile information.
							</li>
							<li>
								<span className="text-zinc-300">Local cached data</span> &mdash;
								all data stored in chrome.storage.local is automatically cleared
								when you uninstall the extension. You can also manually clear
								extension data from your browser settings at any time.
							</li>
							<li>
								<span className="text-zinc-300">AI processing data</span>{" "}
								&mdash; data sent to Anthropic for processing is not retained by
								Anthropic after the API request completes.
							</li>
						</ul>
					</section>

					{/* Section 6 */}
					<section>
						<h2 className="text-lg font-semibold text-white">
							6. LinkedIn Data and Compliance
						</h2>
						<p className="mt-3">
							SalesMAXXing respects LinkedIn&apos;s platform and your
							connections&apos; privacy:
						</p>
						<ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-400">
							<li>
								<span className="text-zinc-300">Read-only access</span> &mdash;
								the extension only reads publicly visible data on LinkedIn pages
								you actively visit. It does not modify any content, send
								messages, or take automated actions on your behalf.
							</li>
							<li>
								<span className="text-zinc-300">No automated browsing</span>{" "}
								&mdash; the extension does not navigate to pages automatically
								or perform actions without your explicit initiation. All data
								extraction occurs on pages you are actively viewing.
							</li>
							<li>
								<span className="text-zinc-300">Visible data only</span> &mdash;
								we only access information that is already displayed to you in
								the LinkedIn web interface. We do not access private messages,
								hidden profile fields, or data behind access restrictions.
							</li>
						</ul>
					</section>

					{/* Section 7 */}
					<section>
						<h2 className="text-lg font-semibold text-white">7. Security</h2>
						<p className="mt-3">
							We take reasonable measures to protect your data. All data in
							transit is encrypted via TLS. Authentication tokens are stored
							securely in chrome.storage.local. Server-side data is protected by
							Supabase row-level security policies. Access to production systems
							is restricted to authorized personnel.
						</p>
					</section>

					{/* Section 8 */}
					<section>
						<h2 className="text-lg font-semibold text-white">
							8. Changes to This Policy
						</h2>
						<p className="mt-3">
							We may update this privacy policy from time to time. Changes will
							be posted on this page with an updated revision date. Continued
							use of SalesMAXXing after changes constitutes acceptance of the
							revised policy.
						</p>
					</section>

					{/* Section 9 */}
					<section>
						<h2 className="text-lg font-semibold text-white">9. Contact</h2>
						<p className="mt-3">
							For questions, concerns, or data deletion requests regarding this
							privacy policy, contact us at:{" "}
							<a
								href="mailto:privacy@salesmaxxing.com"
								className="text-white underline underline-offset-4 transition hover:text-zinc-300"
							>
								privacy@salesmaxxing.com
							</a>
						</p>
					</section>
				</div>
			</div>
		</main>
	);
}

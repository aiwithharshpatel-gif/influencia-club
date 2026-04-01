import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Terms = () => {
  const lastUpdated = 'April 1, 2026';

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <div className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-4">
              Terms & Conditions
            </h1>
            <p className="text-muted">Last updated: {lastUpdated}</p>
          </div>

          {/* Content */}
          <div className="luxury-card rounded-2xl p-8 md:p-12 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                Welcome to Influenzia Club (the "Platform"). By accessing or using our website, applications, or services, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use the Platform.
              </p>
              <p className="text-muted leading-relaxed">
                These Terms constitute a legally binding agreement between you ("User," "Creator," "Brand," or "you") and Influenzia Club, operated by ZCAD Nexoraa Pvt. Ltd. ("we," "us," or "our").
              </p>
            </section>

            {/* Platform Description */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                2. Description of Service
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                Influenzia Club is an influencer-brand marketplace that:
              </p>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li>Connects content creators with brands for collaboration opportunities</li>
                <li>Provides tools for creators to showcase their portfolios</li>
                <li>Facilitates brand campaigns and influencer marketing</li>
                <li>Offers a Refer & Earn rewards program</li>
                <li>Provides analytics and performance tracking</li>
              </ul>
              <p className="text-muted leading-relaxed">
                We reserve the right to modify, suspend, or discontinue any part of the Platform at any time without prior notice.
              </p>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                3. Eligibility
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                To use Influenzia Club, you must:
              </p>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li>Be at least 18 years of age</li>
                <li>Have the legal capacity to enter into binding contracts</li>
                <li>Provide accurate and complete registration information</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not be prohibited from using the Platform under applicable law</li>
              </ul>
            </section>

            {/* Account Registration */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                4. Account Registration
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                To access certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Not create multiple accounts or use false information</li>
              </ul>
              <p className="text-muted leading-relaxed">
                We reserve the right to suspend or terminate accounts that violate these Terms.
              </p>
            </section>

            {/* Creator Obligations */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                5. Creator Code of Conduct
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                As a Creator on the Platform, you agree to:
              </p>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li>Provide truthful information about your social media following and engagement</li>
                <li>Deliver content as agreed upon with brands</li>
                <li>Maintain professional communication with brands</li>
                <li>Disclose sponsored content as required by law (e.g., #ad, #sponsored)</li>
                <li>Not engage in fraudulent or misleading practices</li>
                <li>Respect intellectual property rights of others</li>
                <li>Not post offensive, harmful, or inappropriate content</li>
              </ul>
            </section>

            {/* Brand Obligations */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                6. Brand Obligations
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                As a Brand on the Platform, you agree to:
              </p>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li>Provide accurate campaign briefs and expectations</li>
                <li>Compensate creators as agreed upon</li>
                <li>Respect creators' creative freedom and rights</li>
                <li>Not request inappropriate or illegal content from creators</li>
                <li>Provide timely feedback and approvals</li>
                <li>Comply with advertising standards and regulations</li>
              </ul>
            </section>

            {/* Payments and Fees */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                7. Payments and Fees
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                <span className="text-gold">Platform Fees:</span> Influenzia Club may charge fees for certain services. Current fees are displayed on the Platform.
              </p>
              <p className="text-muted leading-relaxed mb-4">
                <span className="text-gold">Creator Payments:</span> Creators receive payments according to the terms agreed with brands. Platform fees may be deducted.
              </p>
              <p className="text-muted leading-relaxed mb-4">
                <span className="text-gold">Refund Policy:</span> Refunds are evaluated case-by-case. Contact support within 7 days of transaction.
              </p>
              <p className="text-muted leading-relaxed mb-4">
                <span className="text-gold">Taxes:</span> Users are responsible for any applicable taxes on their earnings or purchases.
              </p>
            </section>

            {/* Refer & Earn Program */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                8. Refer & Earn Program
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                Points earned through referrals:
              </p>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li>+10 points for signing up</li>
                <li>+50 points per successful referral</li>
                <li>+100 bonus points for every 5th referral</li>
              </ul>
              <p className="text-muted leading-relaxed mb-4">
                Points can be redeemed for:
              </p>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li>Featured Creator placement (200 points)</li>
                <li>Instagram promotion (150 points)</li>
                <li>Event priority access (100 points)</li>
                <li>Brand collaboration priority (300 points)</li>
              </ul>
              <p className="text-muted leading-relaxed">
                We reserve the right to modify or terminate the Refer & Earn program at any time.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                9. Intellectual Property Rights
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                <span className="text-gold">Platform Content:</span> All content on Influenzia Club (logos, designs, text, code) is owned by ZCAD Nexoraa Pvt. Ltd. and protected by copyright laws.
              </p>
              <p className="text-muted leading-relaxed mb-4">
                <span className="text-gold">User Content:</span> You retain ownership of content you post. By posting, you grant us a license to use, display, and distribute that content on the Platform.
              </p>
              <p className="text-muted leading-relaxed">
                <span className="text-gold">Prohibited Use:</span> You may not copy, modify, distribute, or create derivative works from Platform content without explicit permission.
              </p>
            </section>

            {/* Prohibited Activities */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                10. Prohibited Activities
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                You agree NOT to:
              </p>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li>Use the Platform for illegal or unauthorized purposes</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Transmit malware, viruses, or harmful code</li>
                <li>Interfere with or disrupt Platform servers</li>
                <li>Attempt to gain unauthorized access to accounts or systems</li>
                <li>Use automated systems (bots, scrapers) without permission</li>
                <li>Impersonate any person or entity</li>
                <li>Engage in fraudulent activities or payment disputes</li>
              </ul>
            </section>

            {/* Termination */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                11. Termination
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                We may suspend or terminate your account if you:
              </p>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li>Violate these Terms</li>
                <li>Engage in fraudulent or illegal activities</li>
                <li>Receive multiple complaints from other users</li>
                <li>Fail to maintain accurate account information</li>
              </ul>
              <p className="text-muted leading-relaxed">
                Upon termination, your right to use the Platform ends immediately. Provisions that should survive termination (intellectual property, disclaimers, etc.) will remain in effect.
              </p>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                12. Disclaimers
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li>Implied warranties of merchantability</li>
                <li>Implied warranties of fitness for a particular purpose</li>
                <li>Implied warranties of non-infringement</li>
                <li>Warranties of uninterrupted or error-free operation</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                13. Limitation of Liability
              </h2>
              <p className="text-muted leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, INFLUENZIA CLUB SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS INTERRUPTIONS ARISING FROM YOUR USE OF THE PLATFORM.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                14. Indemnification
              </h2>
              <p className="text-muted leading-relaxed">
                You agree to indemnify, defend, and hold harmless Influenzia Club, ZCAD Nexoraa Pvt. Ltd., and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses (including legal fees) arising from your use of the Platform, violation of these Terms, or infringement of any third-party rights.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                15. Governing Law and Dispute Resolution
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                <span className="text-gold">Governing Law:</span> These Terms shall be governed by the laws of India, without regard to conflict of law principles.
              </p>
              <p className="text-muted leading-relaxed mb-4">
                <span className="text-gold">Jurisdiction:</span> Any disputes shall be subject to the exclusive jurisdiction of courts in Ahmedabad, Gujarat, India.
              </p>
              <p className="text-muted leading-relaxed">
                <span className="text-gold">Arbitration:</span> We encourage users to resolve disputes through good-faith negotiation before pursuing legal action.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                16. Changes to These Terms
              </h2>
              <p className="text-muted leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of material changes via email or Platform notification. Your continued use of the Platform after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                17. Contact Information
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                For questions about these Terms, please contact us:
              </p>
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-6">
                <p className="text-white mb-2"><span className="text-gold">Email:</span> hello@influenziaclub.in</p>
                <p className="text-white mb-2"><span className="text-gold">Address:</span> Ahmedabad, Gujarat, India</p>
                <p className="text-white"><span className="text-gold">Parent Company:</span> ZCAD Nexoraa Pvt. Ltd.</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Terms;

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Privacy = () => {
  const lastUpdated = 'April 1, 2026';

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <div className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted">Last updated: {lastUpdated}</p>
          </div>

          {/* Content */}
          <div className="luxury-card rounded-2xl p-8 md:p-12 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                1. Introduction
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                Welcome to Influenzia Club ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
              <p className="text-muted leading-relaxed">
                By accessing or using Influenzia Club, you agree to the terms of this Privacy Policy. If you do not agree with the practices described in this policy, please do not use our platform.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                2. Information We Collect
              </h2>
              
              <h3 className="font-display text-lg font-semibold text-gold mb-3">
                2.1 Personal Information
              </h3>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li>Name and contact information (email, phone number)</li>
                <li>Social media handles and profile information</li>
                <li>Profile photos and portfolio content</li>
                <li>Payment and billing information</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="font-display text-lg font-semibold text-gold mb-3">
                2.2 Automatically Collected Information
              </h3>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li>Device information and IP address</li>
                <li>Browser type and operating system</li>
                <li>Usage data and interaction patterns</li>
                <li>Pages visited and time spent on the platform</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li>To create and manage your account</li>
                <li>To match creators with brand collaboration opportunities</li>
                <li>To process payments and transactions</li>
                <li>To send you updates, newsletters, and marketing communications (with your consent)</li>
                <li>To improve our platform and user experience</li>
                <li>To prevent fraud and ensure platform security</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                4. How We Share Your Information
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li><span className="text-gold">With Brands:</span> Your profile information may be shared with brands for collaboration opportunities</li>
                <li><span className="text-gold">Service Providers:</span> With vendors who perform services on our behalf (payment processing, email delivery, etc.)</li>
                <li><span className="text-gold">Legal Requirements:</span> When required by law or to protect our rights</li>
                <li><span className="text-gold">Business Transfers:</span> In connection with a merger, acquisition, or sale of assets</li>
                <li><span className="text-gold">With Your Consent:</span> When you explicitly agree to share information</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                5. Data Security
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure servers and network infrastructure</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Employee training on data protection</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                6. Your Rights and Choices
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li><span className="text-gold">Access:</span> Request a copy of your personal information</li>
                <li><span className="text-gold">Correction:</span> Update or correct inaccurate information</li>
                <li><span className="text-gold">Deletion:</span> Request deletion of your personal information</li>
                <li><span className="text-gold">Opt-Out:</span> Unsubscribe from marketing communications</li>
                <li><span className="text-gold">Portability:</span> Request transfer of your data to another service</li>
                <li><span className="text-gold">Withdraw Consent:</span> Withdraw consent for data processing</li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                7. Cookies and Tracking Technologies
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc list-inside text-muted space-y-2 mb-6 ml-4">
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our platform</li>
                <li>Personalize your experience</li>
                <li>Analyze traffic and usage patterns</li>
                <li>Serve relevant advertisements</li>
              </ul>
              <p className="text-muted leading-relaxed">
                You can control cookies through your browser settings, but disabling cookies may limit your ability to use certain features of our platform.
              </p>
            </section>

            {/* Third-Party Links */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                8. Third-Party Links and Services
              </h2>
              <p className="text-muted leading-relaxed">
                Our platform may contain links to third-party websites, applications, or services (such as Instagram, YouTube, etc.). This Privacy Policy does not apply to those third-party services. We encourage you to review the privacy policies of any third-party services you access.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                9. Children's Privacy
              </h2>
              <p className="text-muted leading-relaxed">
                Our platform is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18. If we become aware that we have collected personal information from a child under 18, we will take steps to delete that information.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                10. Changes to This Privacy Policy
              </h2>
              <p className="text-muted leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="font-display text-2xl font-bold text-white mb-4">
                11. Contact Us
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-6">
                <p className="text-white mb-2"><span className="text-gold">Email:</span> hello@influenziaclub.in</p>
                <p className="text-white"><span className="text-gold">Address:</span> Ahmedabad, Gujarat, India</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Privacy;

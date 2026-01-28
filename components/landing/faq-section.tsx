'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'What is BridgeIT?',
    answer:
      'BridgeIT is a pioneering platform that revolutionizes electricity management for businesses across India. We bridge the gap between complex energy systems and streamlined operations, helping organizations reduce costs, improve efficiency, and make data-driven decisions about their energy consumption.',
  },
  {
    question: 'How does BridgeIT help manage multiple locations?',
    answer:
      'BridgeIT provides centralized control for managing electricity bills from 92+ billers across India. You can easily onboard all your locations, map connections, and organize your portfolio efficiently through our intuitive interface. Smart meter integrations and FTP inputs enable seamless data collection across all your sites.',
  },
  {
    question: 'What types of electricity connections does BridgeIT support?',
    answer:
      'BridgeIT supports both prepaid and postpaid electricity connections. We also handle submeters for internal billing purposes. Our platform works with various site types including COCO, POPO, COPO, POCO, and Warehouse locations.',
  },
  {
    question: 'How does the automated bill processing work?',
    answer:
      'Our advanced OCR and AI systems automatically download, extract, and validate your electricity bills from diverse providers and formats. This eliminates manual data entry, reduces errors, and achieves 99.9% accuracy. Bills are processed and digitized instantly, saving up to 120 minutes per bill.',
  },
  {
    question: 'Can BridgeIT help reduce electricity costs?',
    answer:
      'Yes! BridgeIT provides advanced analytics to identify cost-saving opportunities and optimize electricity consumption patterns. By ensuring timely payments, you can eliminate late payment penalties and LPSC (Late Payment Surcharge). Our clients typically see an average ROI within 3 months.',
  },
  {
    question: 'How does payment tracking and reconciliation work?',
    answer:
      'BridgeIT enables centralized payment tracking with real-time updates on payment status across all your locations. You can process batch payments, track pending amounts, and automate reconciliation. Our platform ensures 100% timely payments, helping you avoid disconnections and penalties.',
  },
  {
    question: 'What reporting and analytics features are available?',
    answer:
      'BridgeIT offers comprehensive reporting including bill analysis, consumption trends, payment on-time rates, rebate tracking, LPSC monitoring, and sanction load analysis. Generate compliance reports for regulatory requirements and get actionable insights for informed decision-making.',
  },
  {
    question: 'Is my data secure on BridgeIT?',
    answer:
      'Yes, security is our top priority. BridgeIT uses industry-standard encryption and secure authentication methods. Your billing data and payment information are protected with enterprise-grade security measures. We also maintain complete audit trails for all transactions.',
  },
  {
    question: 'How do I get started with BridgeIT?',
    answer:
      'Getting started is simple! Sign up for an account, register your sites and electricity providers, and our system will begin automatically processing your bills. Our support team is available to help with onboarding and answer any questions you may have.',
  },
  {
    question: 'What support options are available?',
    answer:
      'We provide comprehensive support including documentation, email support, and dedicated account management for enterprise clients. You can also report issues directly through the platform and our team will respond promptly to resolve any concerns.',
  },
];

export default function FAQSection() {
  return (
    <section className="py-12 sm:py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl text-white font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Find answers to common questions about BridgeIT and how we can help
            streamline your electricity management.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-white/10"
                >
                  <AccordionTrigger className="text-left text-white hover:text-primary hover:no-underline py-4 text-base md:text-lg font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80 text-sm md:text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}

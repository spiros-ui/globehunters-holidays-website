"use client";

import { useState } from "react";
import { ChevronDown, Phone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const faqCategories = [
  {
    name: "Booking & Payments",
    faqs: [
      {
        question: "How do I book a holiday?",
        answer: "Simply call us on 020 8944 4555 to speak with one of our travel experts. They will discuss your requirements, find the best options, and guide you through the booking process. We handle everything from flights to hotels to activities.",
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit and debit cards including Visa, Mastercard, and American Express. We also offer payment plans on selected holidays - ask our team for details when booking.",
      },
      {
        question: "Do I need to pay a deposit?",
        answer: "Yes, most holidays require a deposit at the time of booking, typically 20-30% of the total cost. The balance is usually due 8-12 weeks before departure, depending on the booking.",
      },
      {
        question: "Can I pay in installments?",
        answer: "Yes, we offer flexible payment plans on many holidays. Speak with our team when booking to discuss the options available for your chosen holiday.",
      },
    ],
  },
  {
    name: "Changes & Cancellations",
    faqs: [
      {
        question: "Can I change my booking dates?",
        answer: "In most cases, yes. Changes are subject to availability and any price differences that may apply. Amendment fees may also apply depending on the booking. Contact us as soon as possible if you need to make changes.",
      },
      {
        question: "What is your cancellation policy?",
        answer: "Cancellation policies vary depending on the type of booking and how close to departure you cancel. Our team will explain the specific terms when you book. Generally, cancelling earlier results in lower fees.",
      },
      {
        question: "What happens if I need to cancel due to illness?",
        answer: "We strongly recommend purchasing travel insurance that covers cancellation due to illness. If you have insurance, you may be able to claim back cancellation fees. Contact both us and your insurer as soon as possible.",
      },
      {
        question: "Can I transfer my booking to someone else?",
        answer: "Transfers are sometimes possible but depend on the airline and hotel policies. There may be fees involved. Contact us to discuss your options.",
      },
    ],
  },
  {
    name: "Travel Protection",
    faqs: [
      {
        question: "Is my booking ATOL protected?",
        answer: "Yes, all our package holidays that include flights are fully ATOL protected under license number 12345. This means your money is 100% protected in the unlikely event of our insolvency.",
      },
      {
        question: "Do I need travel insurance?",
        answer: "We strongly recommend that all customers have comprehensive travel insurance. This should cover medical expenses, cancellation, lost luggage, and delays. We can recommend suitable policies if needed.",
      },
      {
        question: "What does ATOL protection cover?",
        answer: "ATOL protection ensures that if we cease trading, you won't lose your money or be stranded abroad. The CAA (Civil Aviation Authority) will arrange for you to continue your holiday or return home.",
      },
    ],
  },
  {
    name: "Flights",
    faqs: [
      {
        question: "Can I choose my airline seats?",
        answer: "Yes, in most cases we can arrange seat selection for you. Some airlines charge for this service. Let us know your preferences when booking and we'll do our best to accommodate.",
      },
      {
        question: "What is the baggage allowance?",
        answer: "Baggage allowances vary by airline and ticket type. We'll confirm your specific allowance when booking. If you need extra baggage, we can usually arrange this for an additional fee.",
      },
      {
        question: "What happens if my flight is delayed or cancelled?",
        answer: "If your outbound flight is delayed or cancelled, contact us immediately. We have a 24/7 emergency line for customers currently travelling. We'll work with the airline to find alternative arrangements.",
      },
    ],
  },
  {
    name: "Hotels & Accommodation",
    faqs: [
      {
        question: "Can I request a specific room type?",
        answer: "Yes, you can request specific room types, views, or floors. While we'll do our best to accommodate your preferences, these requests are subject to availability and cannot be guaranteed.",
      },
      {
        question: "What time can I check in and out?",
        answer: "Standard check-in is usually around 2-3pm and check-out is typically 10-11am. Early check-in or late check-out may be available for an additional fee - let us know if you need this.",
      },
      {
        question: "Are meals included?",
        answer: "This depends on the package you book. We offer room-only, bed & breakfast, half-board, full-board, and all-inclusive options. The meal plan will be clearly stated in your booking confirmation.",
      },
    ],
  },
  {
    name: "Before You Travel",
    faqs: [
      {
        question: "When will I receive my travel documents?",
        answer: "Most travel documents are now sent electronically. You'll typically receive your e-tickets and hotel vouchers 2-3 weeks before departure. For some bookings, you may receive them earlier.",
      },
      {
        question: "Do I need a visa?",
        answer: "Visa requirements depend on your nationality and destination. We can advise on requirements, but it's ultimately your responsibility to ensure you have the correct documentation.",
      },
      {
        question: "What about COVID-19 requirements?",
        answer: "Entry requirements change frequently. We recommend checking the latest government guidelines for your destination close to your travel date. We'll also keep you updated on any significant changes.",
      },
    ],
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        className="flex items-center justify-between w-full py-4 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium pr-4">{question}</span>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="pb-4 text-muted-foreground">{answer}</div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = faqCategories
    .map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(
      (category) =>
        category.faqs.length > 0 &&
        (!selectedCategory || category.name === selectedCategory)
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-primary py-20 text-white">
        <div className="container-wide text-center">
          <h1 className="text-4xl md:text-5xl font-serif mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Find answers to common questions about booking with GlobeHunters
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-white text-foreground"
            />
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-6 bg-muted border-b border-border">
        <div className="container-wide">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              className={cn(
                "px-4 py-2 rounded-full text-sm transition-colors",
                !selectedCategory
                  ? "bg-primary text-white"
                  : "bg-card border border-border hover:border-primary"
              )}
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </button>
            {faqCategories.map((category) => (
              <button
                key={category.name}
                className={cn(
                  "px-4 py-2 rounded-full text-sm transition-colors",
                  selectedCategory === category.name
                    ? "bg-primary text-white"
                    : "bg-card border border-border hover:border-primary"
                )}
                onClick={() => setSelectedCategory(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="section">
        <div className="container-wide max-w-4xl">
          {filteredCategories.length > 0 ? (
            <div className="space-y-8">
              {filteredCategories.map((category) => (
                <div
                  key={category.name}
                  className="bg-card rounded-xl border border-border p-6"
                >
                  <h2 className="text-xl font-semibold mb-4">{category.name}</h2>
                  <div>
                    {category.faqs.map((faq, index) => (
                      <FAQItem
                        key={index}
                        question={faq.question}
                        answer={faq.answer}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No results found for &quot;{searchQuery}&quot;
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Still Need Help */}
      <section className="section bg-muted">
        <div className="container-wide text-center">
          <h2 className="text-3xl font-serif mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Can&apos;t find the answer you&apos;re looking for? Our friendly team is
            here to help with any questions about your holiday.
          </p>
          <Button size="lg" asChild>
            <a href="tel:+442089444555" className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call 020 8944 4555
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}

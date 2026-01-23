"use client";

import { Phone, Mail, MapPin, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const contactMethods = [
  {
    icon: Phone,
    title: "Call Us",
    description: "Speak directly with a travel expert",
    primary: "020 8944 4555",
    secondary: "Mon-Sat: 9am-8pm, Sun: 10am-6pm",
    action: "tel:+442089444555",
    actionLabel: "Call Now",
  },
  {
    icon: Mail,
    title: "Email Us",
    description: "Send us your enquiry anytime",
    primary: "info@globehuntersholidays.com",
    secondary: "We aim to respond within 24 hours",
    action: "mailto:info@globehuntersholidays.com",
    actionLabel: "Send Email",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Chat with us in real-time",
    primary: "Available on website",
    secondary: "Mon-Fri: 9am-6pm",
    action: "#",
    actionLabel: "Start Chat",
  },
];

const offices = [
  {
    city: "London (Head Office)",
    address: "123 Travel Street, Wimbledon, London SW19 1AA",
    phone: "020 8944 4555",
    hours: "Mon-Sat: 9am-8pm, Sun: 10am-6pm",
  },
  {
    city: "Manchester",
    address: "456 Holiday Lane, Manchester M1 2AB",
    phone: "0161 123 4567",
    hours: "Mon-Sat: 9am-6pm",
  },
];

const faqs = [
  {
    question: "How do I book a holiday?",
    answer: "Simply call us on 020 8944 4555 and speak with one of our travel experts. They will help you find and book the perfect holiday package tailored to your preferences.",
  },
  {
    question: "Is my booking ATOL protected?",
    answer: "Yes, all our package holidays are fully ATOL protected under license number 12345, giving you complete financial security.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit and debit cards. We also offer payment plans on selected holidays - ask our team for details.",
  },
  {
    question: "Can I make changes to my booking?",
    answer: "Yes, most bookings can be modified subject to availability and any applicable fees. Contact our team as soon as possible to discuss changes.",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-primary py-20 text-white">
        <div className="container-wide text-center">
          <h1 className="text-4xl md:text-5xl font-serif mb-4">Contact Us</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Our friendly team is here to help you plan your perfect holiday
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="section">
        <div className="container-wide">
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method) => (
              <div
                key={method.title}
                className="bg-card rounded-xl p-6 border border-border text-center"
              >
                <method.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">{method.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {method.description}
                </p>
                <div className="mb-4">
                  <div className="font-semibold">{method.primary}</div>
                  <div className="text-sm text-muted-foreground">{method.secondary}</div>
                </div>
                <Button asChild className="w-full">
                  <a href={method.action}>{method.actionLabel}</a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Phone CTA */}
      <section className="py-12 bg-accent text-white">
        <div className="container-wide">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Phone className="w-12 h-12" />
              <div>
                <div className="text-2xl font-semibold">020 8944 4555</div>
                <div className="text-white/80">Speak to an expert now</div>
              </div>
            </div>
            <Button size="lg" variant="secondary" asChild>
              <a href="tel:+442089444555">Call Now</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Offices */}
      <section className="section bg-muted">
        <div className="container-wide">
          <h2 className="text-3xl font-serif text-center mb-12">Our Offices</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {offices.map((office) => (
              <div
                key={office.city}
                className="bg-card rounded-xl p-6 border border-border"
              >
                <h3 className="font-semibold text-lg mb-4">{office.city}</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{office.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <span className="text-muted-foreground">{office.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-muted-foreground">{office.hours}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container-wide max-w-3xl">
          <h2 className="text-3xl font-serif text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 border border-border"
              >
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">
              Can&apos;t find what you&apos;re looking for?
            </p>
            <Button asChild>
              <a href="tel:+442089444555" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Call Us
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="section bg-primary text-white">
        <div className="container-wide text-center">
          <h2 className="text-3xl font-serif mb-4">Emergency Support</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            If you&apos;re currently travelling and need urgent assistance,
            our 24/7 emergency line is here to help.
          </p>
          <div className="text-2xl font-semibold mb-4">+44 (0)20 8944 4999</div>
          <Button size="lg" variant="secondary" asChild>
            <a href="tel:+442089444999">Emergency Assistance</a>
          </Button>
        </div>
      </section>
    </div>
  );
}

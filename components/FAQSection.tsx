'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: 1,
    question: "How is IntenX different from regular video screening?",
    answer: "Unlike traditional video screening, IntenX conducts real, adaptive interviews. The AI asks follow-up questions, probes deeper based on responses, and evaluates skills, communication, and role-fit—just like a human interviewer, but faster and bias-aware."
  },
  {
    id: 2,
    question: "Will candidates feel comfortable talking to an AI interviewer?",
    answer: "Yes. IntenX is designed to be natural, conversational, and non-intimidating. Candidates can interview at their own pace, from anywhere, which often reduces anxiety compared to live panel interviews."
  },
  {
    id: 3,
    question: "How accurate are the interview suitability scores?",
    answer: "IntenX uses multi-factor evaluation models that analyze technical depth, communication clarity, confidence, and behavioral signals. Scores are consistent, data-driven, and aligned with role requirements—helping recruiters make faster, better decisions."
  },
  {
    id: 4,
    question: "Is candidate data secure and compliant?",
    answer: "Absolutely. IntenX follows enterprise-grade security standards, including encrypted data storage, secure access controls, and compliance with global data protection practices. Candidate data always remains confidential."
  },
  {
    id: 5,
    question: "Can IntenX integrate with our ATS or existing hiring workflow?",
    answer: "Yes. IntenX supports ATS and HR system integrations via APIs, allowing you to seamlessly plug AI interviews into your current hiring process without disrupting existing workflows."
  },
  {
    id: 6,
    question: "Does IntenX support multiple languages or accents?",
    answer: "Yes. IntenX is built to handle multiple languages and diverse accents, ensuring fair and accurate evaluations for global and multicultural talent pools."
  }
];

export default function FAQSection() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <section id="faqs" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <p className="text-xl text-gray-600">Everything you need to know about IntenX</p>
      </div>

      {/* FAQ Grid - 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className="faq-card bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:border-purple-300 hover:shadow-lg"
          >
            <button
              onClick={() => toggleExpand(faq.id)}
              className="w-full px-6 py-5 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-left text-lg font-semibold text-gray-900 leading-tight">
                {faq.question}
              </h3>
              <div
                className={`flex-shrink-0 mt-1 transform transition-transform duration-300 ${
                  expanded === faq.id ? 'rotate-180' : ''
                }`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold text-lg">
                  +
                </div>
              </div>
            </button>

            {/* Answer - Expandable */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                expanded === faq.id ? 'max-h-96' : 'max-h-0'
              }`}
            >
              <div className="px-6 pb-5 pt-0 border-t border-gray-100">
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

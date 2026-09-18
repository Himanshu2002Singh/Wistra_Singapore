export const membershipInfo = {
  types: [
    { id: 'individual', name: 'Individual', price: 'SGD 150/year', description: 'For women working in the maritime industry.' },
    { id: 'corporate', name: 'Corporate', price: 'SGD 500/year', description: 'For companies supporting diversity in maritime.' }
  ],
  benefits: [
    'Access to WISTA International network',
    'Exclusive invitations to WISTA SG networking events',
    'Mentorship opportunities',
    'Discounted rates for industry conferences',
    'Professional development workshops'
  ],
  eligibility: 'Women in management positions or with at least 3 years of experience in the maritime industry. Corporate members must demonstrate commitment to diversity and inclusion.',
  faqs: [
    { question: 'How do I apply for WISTA Singapore membership?', answer: 'You can apply online through our membership portal. Your application will be reviewed by the committee.' },
    { question: 'What is the membership fee?', answer: 'Individual membership is SGD 150/year and Corporate membership is SGD 500/year.' },
    { question: 'How long does the application process take?', answer: 'Typically 1-2 weeks for the committee to review and approve.' },
    { question: 'Can students join WISTA Singapore?', answer: 'We currently focus on working professionals, but keep an eye out for our upcoming student initiatives.' },
    { question: 'Do I have to be a Singapore citizen?', answer: 'No, but you should be working in the maritime industry in Singapore.' },
    { question: 'What payment methods are accepted?', answer: 'We accept bank transfer and major credit cards.' }
  ],
  workflowSteps: ['Submit Application', 'Committee Review', 'Approval Notification', 'Payment', 'Welcome Onboard']
}

export const membershipPricing = {
  individual: 'SGD 150/year',
  corporate: 'SGD 500/year'
}

export const membershipBenefits = [
  ['CONNECT', 'Build meaningful relationships across countries and maritime sectors.'],
  ['GROW', 'Learn through mentorship, events and shared industry expertise.'],
  ['LEAD', 'Shape a more inclusive and sustainable future for maritime in Singapore.']
]

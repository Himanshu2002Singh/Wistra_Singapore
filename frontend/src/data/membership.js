export const membershipInfo = {
  types: [
    { id: 'individual', name: 'Individual', price: 'SGD 150/year', description: 'For women working in the maritime industry.' },
    { id: 'corporate', name: 'Corporate', price: 'SGD 500/year', description: 'For companies supporting diversity in maritime.' },
    { id: 'student', name: 'Student', price: 'SGD 50/year', description: 'For students with current proof of enrollment.' }
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
    { question: 'What is the membership fee?', answer: 'Individual membership is SGD 150/year, Corporate membership is SGD 500/year, and Student membership is SGD 50/year.' },
    { question: 'How long does the application process take?', answer: 'Typically 1-2 weeks for the committee to review and approve.' },
    { question: 'How can students apply for WISTA Singapore membership?', answer: 'Students can apply online by creating or signing into a Member account and submitting their education details and proof of current enrollment. The Student membership fee is SGD 50/year.' },
    { question: 'Do I have to be a Singapore citizen?', answer: 'No, but you should be working in the maritime industry in Singapore.' },
    { question: 'What payment methods are accepted?', answer: 'We accept bank transfer and major credit cards.' }
  ],
  workflowSteps: ['Submit Application', 'Committee Review', 'Approval Notification', 'Payment', 'Welcome Onboard']
}

export const membershipPricing = {
  individual: 'SGD 150/year',
  corporate: 'SGD 500/year',
  student: 'SGD 50/year'
}

export const membershipBenefits = [
  ['CONNECT', 'Build meaningful relationships across countries and maritime sectors.'],
  ['GROW', 'Learn through mentorship, events and shared industry expertise.'],
  ['LEAD', 'Shape a more inclusive and sustainable future for maritime in Singapore.']
]

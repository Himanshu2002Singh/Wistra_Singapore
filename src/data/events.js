export const events = [
  { id: 1, title: 'WISTA SG AGM 2026', date: '2026-10-15', location: 'Singapore Cricket Club', type: 'AGM', description: 'Annual General Meeting for WISTA Singapore.', image: '/placeholder.jpg', registrationOpen: true, isPast: false },
  { id: 2, title: 'Maritime Networking Night', date: '2026-11-20', location: 'Marina Bay Sands', type: 'Networking', description: 'Join us for an evening of networking with maritime professionals.', image: '/placeholder.jpg', registrationOpen: true, isPast: false },
  { id: 3, title: 'Women in Shipping Panel', date: '2026-12-05', location: 'PSA Horizons', type: 'Panel', description: 'Panel discussion on the future of women in shipping.', image: '/placeholder.jpg', registrationOpen: true, isPast: false },
  { id: 4, title: 'Tech in Maritime Symposium', date: '2027-01-15', location: 'Suntec Convention Centre', type: 'Conference', description: 'Exploring the latest technological advancements in the maritime industry.', image: '/placeholder.jpg', registrationOpen: false, isPast: false },
  { id: 5, title: 'WISTA Asia Pacific Regional Conference', date: '2026-05-10', location: 'Swissôtel The Stamford', type: 'Conference', description: 'Regional conference bringing together WISTA chapters across Asia Pacific.', image: '/placeholder.jpg', registrationOpen: false, isPast: true },
  { id: 6, title: 'Mentorship Kickoff 2026', date: '2026-03-22', location: 'Keppel Bay', type: 'Workshop', description: 'Kickoff event for the 2026 mentorship program.', image: '/placeholder.jpg', registrationOpen: false, isPast: true }
]

export const upcomingEvents = events.filter(e => !e.isPast)
export const pastEvents = events.filter(e => e.isPast)

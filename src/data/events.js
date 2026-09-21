import eventCard1 from '../assets/images/wista/events/event-card-1.jpg'
import eventCard2 from '../assets/images/wista/events/event-card-2.jpg'
import eventCard3 from '../assets/images/wista/events/event-card-3.jpg'
import eventCard4 from '../assets/images/wista/events/event-card-4.jpg'
import eventCard5 from '../assets/images/wista/events/event-card-5.jpg'
import eventCard6 from '../assets/images/wista/events/event-card-6.jpg'

export const events = [
  { id: 1, title: 'WISTA SG AGM & Executive Session', date: '2026-10-15', location: 'Singapore Cricket Club', type: 'AGM', description: 'Annual General Meeting and strategic planning for WISTA Singapore members.', image: eventCard1, registrationOpen: true, isPast: false },
  { id: 2, title: 'WISTA Singapore Annual Gala', date: '2026-11-20', location: 'Marina Bay Sands', type: 'Gala Dinner', description: 'Join us for an evening of networking, awards, and celebration with maritime leaders.', image: eventCard2, registrationOpen: true, isPast: false },
  { id: 3, title: 'Asia Pacific Maritime Forum & Panel', date: '2026-12-05', location: 'Marina Bay Sands Expo', type: 'Panel', description: 'Keynote and panel discussion on port technology, decarbonization, and diversity in shipping.', image: eventCard3, registrationOpen: true, isPast: false },
  { id: 4, title: 'WISTA x Royal Navy Maritime Exchange', date: '2026-02-20', location: 'HMS Speck Warship Tour', type: 'Vessel Visit', description: 'Exclusive warship tour, maritime security briefing, and leadership exchange on deck.', image: eventCard4, registrationOpen: false, isPast: true },
  { id: 5, title: 'WISTA x ICS x WIMAR IMO Symposium', date: '2026-05-18', location: 'Singapore International Maritime Centre', type: 'Conference', description: 'Joint international maritime session on global shipping regulations and gender equity.', image: eventCard5, registrationOpen: false, isPast: true },
  { id: 6, title: 'WISTA x Rio Tinto Decarbonization Forum', date: '2025-10-24', location: 'Rio Tinto Asia Headquarters', type: 'Forum', description: 'Executive roundtable on sustainable supply chains and maritime ESG leadership.', image: eventCard6, registrationOpen: false, isPast: true }
]

export const upcomingEvents = events.filter(e => !e.isPast)
export const pastEvents = events.filter(e => e.isPast)



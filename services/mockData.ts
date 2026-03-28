import type { Business, BusinessPostcard, Deal, Event, Post, Story } from '../types';

export const FALLBACK_GOVERNORATE = 'baghdad';

const byGov = <T,>(baghdad: T[], erbil: T[], basra: T[], sulaymaniyah: T[]) => ({
  baghdad,
  erbil,
  basra,
  sulaymaniyah,
});

export const normalizeGovernorate = (value?: string | null): string => {
  if (!value) return 'all';
  const normalized = value.toLowerCase().replace(/\s+/g, '_');
  const aliasMap: Record<string, string> = {
    'dhi_qar': 'dhi_qar',
    'sulaymaniyah': 'sulaymaniyah',
    'as_sulaymaniyah': 'sulaymaniyah',
  };
  return aliasMap[normalized] || normalized;
};

export const governorateDisplayName = (value?: string | null) => {
  const normalized = normalizeGovernorate(value);
  const map: Record<string, string> = {
    baghdad: 'Baghdad',
    erbil: 'Erbil',
    basra: 'Basra',
    sulaymaniyah: 'Sulaymaniyah',
  };
  return map[normalized] || 'Baghdad';
};

const mockStoriesByGov: Record<string, Story[]> = byGov<Story>(
  [
    {
      id: 901,
      avatar: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80',
      name: 'Shanasheel',
      thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
      userName: 'Shanasheel Cafe Baghdad',
      type: 'business',
      aiVerified: true,
      isLive: true,
      media: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80',
        'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=900&q=80',
      ],
      timeAgo: '15m ago',
      governorate: 'baghdad',
    },
    {
      id: 902,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80',
      name: 'Mutanabbi',
      thumbnail: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&q=80',
      userName: 'Mutanabbi Walkers',
      type: 'community',
      media: ['https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=900&q=80'],
      timeAgo: '1h ago',
      governorate: 'baghdad',
    },
  ],
  [
    {
      id: 911,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80',
      name: 'Citadel Brew',
      thumbnail: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&q=80',
      userName: 'Citadel Brew Erbil',
      type: 'business',
      aiVerified: true,
      media: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&q=80'],
      timeAgo: '45m ago',
      governorate: 'erbil',
    },
    {
      id: 912,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80',
      name: 'Sami Park',
      thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80',
      userName: 'Sami Abdulrahman Runners',
      type: 'community',
      media: ['https://images.unsplash.com/photo-1472396961693-142e6e269027?w=900&q=80'],
      timeAgo: '3h ago',
      governorate: 'erbil',
    },
  ],
  [
    {
      id: 921,
      avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&q=80',
      name: 'Shatt Spot',
      thumbnail: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=80',
      userName: 'Shatt Al-Arab Nights',
      type: 'community',
      isLive: true,
      media: ['https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&q=80'],
      timeAgo: '30m ago',
      governorate: 'basra',
    },
    {
      id: 922,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80',
      name: 'Basra Beans',
      thumbnail: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600&q=80',
      userName: 'Basra Beans Roastery',
      type: 'business',
      media: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80'],
      timeAgo: '2h ago',
      governorate: 'basra',
    },
  ],
  [
    {
      id: 931,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&q=80',
      name: 'Slemani',
      thumbnail: 'https://images.unsplash.com/photo-1476041800959-2f6bb412c8ce?w=600&q=80',
      userName: 'Slemani Food Walk',
      type: 'community',
      aiVerified: true,
      media: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80'],
      timeAgo: '50m ago',
      governorate: 'sulaymaniyah',
    },
    {
      id: 932,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80',
      name: 'Azadi',
      thumbnail: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&q=80',
      userName: 'Azadi Book Cafe',
      type: 'business',
      media: ['https://images.unsplash.com/photo-1481833761820-0509d3217039?w=900&q=80'],
      timeAgo: '4h ago',
      governorate: 'sulaymaniyah',
    },
  ],
);

const mockPostsByGov: Record<string, Post[]> = byGov<Post>(
  [
    { id: 'p901', businessId: 'b901', businessName: 'Shanasheel Cafe', businessAvatar: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&q=80', caption: 'Fresh cardamom latte + Iraqi date cake served now in Karrada. Live oud tonight at 8 PM.', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80', createdAt: new Date('2026-03-26T11:30:00Z'), likes: 128, isVerified: true, governorate: 'baghdad' },
    { id: 'p902', businessId: 'b902', businessName: 'Baghdad Bites', businessAvatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&q=80', caption: 'Family platter promo in Mansour this weekend. Reservation slots are filling fast.', imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=900&q=80', createdAt: new Date('2026-03-25T18:20:00Z'), likes: 89, governorate: 'baghdad' },
  ],
  [
    { id: 'p911', businessId: 'b911', businessName: 'Citadel Brew', businessAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', caption: 'Sunset terrace is open in Erbil Citadel district. New pistachio cold brew launched.', imageUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=900&q=80', createdAt: new Date('2026-03-27T15:10:00Z'), likes: 144, isVerified: true, governorate: 'erbil' },
    { id: 'p912', businessId: 'b912', businessName: 'Erbil Clay Oven', businessAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80', caption: 'Hot tandoor batches every evening near Family Mall. Ask for the saffron set menu.', imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=900&q=80', createdAt: new Date('2026-03-24T17:45:00Z'), likes: 71, governorate: 'erbil' },
  ],
  [
    { id: 'p921', businessId: 'b921', businessName: 'Shatt Riverside', businessAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80', caption: 'Tonight: grilled samak masgouf by the river. Live family seating from 7 PM.', imageUrl: 'https://images.unsplash.com/photo-1485963631004-f2f00b1d6606?w=900&q=80', createdAt: new Date('2026-03-27T20:15:00Z'), likes: 167, isVerified: true, governorate: 'basra' },
    { id: 'p922', businessId: 'b922', businessName: 'Basra Beans Roastery', businessAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', caption: 'Single-origin beans from northern Iraq now available. Free tasting this Friday.', imageUrl: 'https://images.unsplash.com/photo-1494314671902-399b18174975?w=900&q=80', createdAt: new Date('2026-03-23T13:25:00Z'), likes: 63, governorate: 'basra' },
  ],
  [
    { id: 'p931', businessId: 'b931', businessName: 'Azadi Book Cafe', businessAvatar: 'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=200&q=80', caption: 'Poetry and coffee night in Slemani. Kurdish and Arabic open mic starts at 6 PM.', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80', createdAt: new Date('2026-03-26T16:00:00Z'), likes: 112, governorate: 'sulaymaniyah' },
    { id: 'p932', businessId: 'b932', businessName: 'Mountain Table', businessAvatar: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=200&q=80', caption: 'Now serving breakfast platters with local honey and Kurdish cheese.', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80', createdAt: new Date('2026-03-22T08:40:00Z'), likes: 79, governorate: 'sulaymaniyah' },
  ],
);

const mockBusinessesByGov: Record<string, Business[]> = byGov<Business>(
  [
    { id: 'fb901', name: 'Shanasheel Cafe', category: 'cafes', rating: 4.8, status: 'open', isFeatured: true, isPremium: true, governorate: 'baghdad', city: 'Baghdad', imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&q=80' },
    { id: 'fb902', name: 'Babylon Terrace', category: 'restaurants', rating: 4.6, status: 'open', isFeatured: true, governorate: 'baghdad', city: 'Baghdad', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80' },
  ],
  [
    { id: 'fb911', name: 'Citadel Brew', category: 'cafes', rating: 4.9, status: 'open', isFeatured: true, isPremium: true, governorate: 'erbil', city: 'Erbil', imageUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=900&q=80' },
    { id: 'fb912', name: 'Sami Park Eatery', category: 'restaurants', rating: 4.7, status: 'open', isFeatured: true, governorate: 'erbil', city: 'Erbil', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80' },
  ],
  [
    { id: 'fb921', name: 'Shatt Riverside', category: 'restaurants', rating: 4.9, status: 'open', isFeatured: true, isPremium: true, governorate: 'basra', city: 'Basra', imageUrl: 'https://images.unsplash.com/photo-1485963631004-f2f00b1d6606?w=900&q=80' },
    { id: 'fb922', name: 'Basra Beans', category: 'cafes', rating: 4.6, status: 'open', isFeatured: true, governorate: 'basra', city: 'Basra', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80' },
  ],
  [
    { id: 'fb931', name: 'Azadi Book Cafe', category: 'cafes', rating: 4.8, status: 'open', isFeatured: true, governorate: 'sulaymaniyah', city: 'Sulaymaniyah', imageUrl: 'https://images.unsplash.com/photo-1481833761820-0509d3217039?w=900&q=80' },
    { id: 'fb932', name: 'Slemani Roof Dining', category: 'restaurants', rating: 4.7, status: 'open', isFeatured: true, governorate: 'sulaymaniyah', city: 'Sulaymaniyah', imageUrl: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=900&q=80' },
  ],
);

const mockPostcardsByGov: Record<string, BusinessPostcard[]> = byGov<BusinessPostcard>(
  [
    { id: 'pc901', title: 'Shanasheel Cafe', city: 'Baghdad', neighborhood: 'Karrada', governorate: 'baghdad', category_tag: 'Cafe', phone: '+9647701234567', hero_image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80', image_gallery: ['https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=900&q=80'], postcard_content: 'Riverside-style specialty coffee, Iraqi sweets, and cozy late-night seating.', google_maps_url: 'https://maps.google.com/?q=Baghdad+Karrada', rating: 4.8, review_count: 240, verified: true },
    { id: 'pc902', title: 'Baghdad Bites', city: 'Baghdad', neighborhood: 'Mansour', governorate: 'baghdad', category_tag: 'Restaurant', phone: '+9647812233445', hero_image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=900&q=80', image_gallery: ['https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=900&q=80'], postcard_content: 'Popular family restaurant serving modern Iraqi classics and weekend specials.', google_maps_url: 'https://maps.google.com/?q=Baghdad+Mansour', rating: 4.6, review_count: 180, verified: true },
  ],
  [
    { id: 'pc911', title: 'Citadel Brew', city: 'Erbil', neighborhood: 'Citadel District', governorate: 'erbil', category_tag: 'Cafe', phone: '+9647505551133', hero_image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&q=80', image_gallery: ['https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=900&q=80'], postcard_content: 'Rooftop coffee bar with old-city views and dessert flights.', google_maps_url: 'https://maps.google.com/?q=Erbil+Citadel', rating: 4.9, review_count: 310, verified: true },
    { id: 'pc912', title: 'Erbil Clay Oven', city: 'Erbil', neighborhood: 'Ankawa', governorate: 'erbil', category_tag: 'Restaurant', phone: '+9647506677889', hero_image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=900&q=80', image_gallery: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80'], postcard_content: 'Wood-fired plates and grilled specialties near Family Mall.', google_maps_url: 'https://maps.google.com/?q=Erbil+Ankawa', rating: 4.7, review_count: 202, verified: true },
  ],
  [
    { id: 'pc921', title: 'Shatt Riverside', city: 'Basra', neighborhood: 'Ashar', governorate: 'basra', category_tag: 'Restaurant', phone: '+9647709988776', hero_image: 'https://images.unsplash.com/photo-1485963631004-f2f00b1d6606?w=900&q=80', image_gallery: ['https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=900&q=80'], postcard_content: 'Evening river-view dining with signature masgouf and seafood plates.', google_maps_url: 'https://maps.google.com/?q=Basra+Ashar', rating: 4.9, review_count: 355, verified: true },
    { id: 'pc922', title: 'Basra Beans Roastery', city: 'Basra', neighborhood: 'Jumhuriya', governorate: 'basra', category_tag: 'Cafe', phone: '+9647814556622', hero_image: 'https://images.unsplash.com/photo-1494314671902-399b18174975?w=900&q=80', image_gallery: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80'], postcard_content: 'Local and imported beans roasted daily with tasting bar.', google_maps_url: 'https://maps.google.com/?q=Basra+Jumhuriya', rating: 4.6, review_count: 167, verified: true },
  ],
  [
    { id: 'pc931', title: 'Azadi Book Cafe', city: 'Sulaymaniyah', neighborhood: 'Sarchnar', governorate: 'sulaymaniyah', category_tag: 'Cafe', phone: '+9647701122334', hero_image: 'https://images.unsplash.com/photo-1481833761820-0509d3217039?w=900&q=80', image_gallery: ['https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=900&q=80'], postcard_content: 'Quiet reading lounge, Kurdish poetry nights, and artisan drinks.', google_maps_url: 'https://maps.google.com/?q=Sulaymaniyah+Sarchnar', rating: 4.8, review_count: 221, verified: true },
    { id: 'pc932', title: 'Mountain Table', city: 'Sulaymaniyah', neighborhood: 'Salim Street', governorate: 'sulaymaniyah', category_tag: 'Restaurant', phone: '+9647711122244', hero_image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=900&q=80', image_gallery: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80'], postcard_content: 'Modern Kurdish comfort food with mountain-inspired menu.', google_maps_url: 'https://maps.google.com/?q=Sulaymaniyah+Salim+Street', rating: 4.7, review_count: 192, verified: true },
  ],
);

const mockEventsByGov: Record<string, Event[]> = byGov<Event>(
  [
    { id: 'e901', image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=900&q=80', title: 'Baghdad Night Market', date: new Date('2026-04-04T18:00:00Z'), venue: 'Mutanabbi Street', attendees: 1200, price: 0, category: 'events_entertainment', governorate: 'baghdad' },
    { id: 'e902', image: 'https://images.unsplash.com/photo-1468476396571-4d6f2a427ee7?w=900&q=80', title: 'Coffee Cupping Workshop', date: new Date('2026-04-08T16:00:00Z'), venue: 'Karrada', attendees: 140, price: 10000, category: 'food_drink', governorate: 'baghdad' },
  ],
  [
    { id: 'e911', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=900&q=80', title: 'Erbil Tech Founder Meetup', date: new Date('2026-04-02T15:30:00Z'), venue: 'Erbil International Fair', attendees: 520, price: 20000, category: 'business_services', governorate: 'erbil' },
    { id: 'e912', image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=900&q=80', title: 'Sami Park Family Day', date: new Date('2026-04-05T10:00:00Z'), venue: 'Sami Abdulrahman Park', attendees: 780, price: 0, category: 'public_essential', governorate: 'erbil' },
  ],
  [
    { id: 'e921', image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=900&q=80', title: 'Basra Waterfront Concert', date: new Date('2026-04-03T19:00:00Z'), venue: 'Shatt Al-Arab Promenade', attendees: 980, price: 15000, category: 'events_entertainment', governorate: 'basra' },
    { id: 'e922', image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=900&q=80', title: 'Date Market Expo', date: new Date('2026-04-07T09:30:00Z'), venue: 'Ashar District', attendees: 430, price: 0, category: 'shopping', governorate: 'basra' },
  ],
  [
    { id: 'e931', image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=900&q=80', title: 'Slemani Book Walk', date: new Date('2026-04-06T17:00:00Z'), venue: 'Salim Street', attendees: 340, price: 5000, category: 'culture_heritage', governorate: 'sulaymaniyah' },
    { id: 'e932', image: 'https://images.unsplash.com/photo-1453733190371-0a9bedd82893?w=900&q=80', title: 'Mountain Trail Social', date: new Date('2026-04-09T06:30:00Z'), venue: 'Azmar Trails', attendees: 160, price: 0, category: 'health_wellness', governorate: 'sulaymaniyah' },
  ],
);

const mockDealsByGov: Record<string, Deal[]> = byGov<Deal>(
  [
    { id: 'd901', discount: 30, businessLogo: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=120&q=80', title: 'Weekend Iraqi Breakfast', description: '30% off family breakfast platters in Karrada.', expiresIn: '3 Days', claimed: 64, total: 120 },
    { id: 'd902', discount: 20, businessLogo: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=120&q=80', title: 'Dinner Bundle', description: 'Dinner set for four with free appetizer.', expiresIn: '5 Days', claimed: 41, total: 100 },
  ],
  [
    { id: 'd911', discount: 25, businessLogo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80', title: 'Citadel Sunset Menu', description: 'Book rooftop table and get 25% off desserts.', expiresIn: '4 Days', claimed: 55, total: 90 },
    { id: 'd912', discount: 15, businessLogo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80', title: 'Coffee Tasting Pass', description: 'Try 4 signature brews at a discounted rate.', expiresIn: '1 Week', claimed: 33, total: 80 },
  ],
  [
    { id: 'd921', discount: 35, businessLogo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&q=80', title: 'River Dinner Deal', description: '35% off evening seafood menu.', expiresIn: '2 Days', claimed: 70, total: 110 },
    { id: 'd922', discount: 20, businessLogo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80', title: 'Roastery Bundle', description: 'Buy 2 bags of beans and get 1 free.', expiresIn: '6 Days', claimed: 26, total: 60 },
  ],
  [
    { id: 'd931', discount: 25, businessLogo: 'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=120&q=80', title: 'Book & Brew Combo', description: 'Free drink with selected book purchases.', expiresIn: '3 Days', claimed: 44, total: 90 },
    { id: 'd932', discount: 18, businessLogo: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=120&q=80', title: 'Lunch Express', description: '18% off weekday lunch specials.', expiresIn: '5 Days', claimed: 39, total: 75 },
  ],
);

const pickData = <T,>(map: Record<string, T[]>, governorate: string): T[] => {
  if (governorate === 'all') {
    return [
      ...(map.baghdad || []),
      ...(map.erbil || []),
      ...(map.basra || []),
      ...(map.sulaymaniyah || []),
    ];
  }

  return map[governorate] || map[FALLBACK_GOVERNORATE] || [];
};

export const mockData = {
  stories(governorate: string) {
    return pickData(mockStoriesByGov, normalizeGovernorate(governorate));
  },
  posts(governorate: string) {
    return pickData(mockPostsByGov, normalizeGovernorate(governorate));
  },
  featuredBusinesses(governorate: string) {
    return pickData(mockBusinessesByGov, normalizeGovernorate(governorate));
  },
  postcards(governorate: string) {
    return pickData(mockPostcardsByGov, normalizeGovernorate(governorate));
  },
  events(governorate: string) {
    return pickData(mockEventsByGov, normalizeGovernorate(governorate));
  },
  deals(governorate: string) {
    return pickData(mockDealsByGov, normalizeGovernorate(governorate));
  },
};

import type { Business, BusinessPostcard, Post, Story } from '../types';

export type GovernorateId =
  | 'all'
  | 'baghdad'
  | 'basra'
  | 'erbil'
  | 'sulaymaniyah'
  | 'dohuk'
  | 'nineveh';

const byGov = <T,>(data: Record<Exclude<GovernorateId, 'all'>, T[]>) => data;

export const normalizeGovernorate = (value?: string | null): GovernorateId => {
  if (!value || value === 'all') return 'all';
  const normalized = value.toLowerCase().replace(/\s+/g, '_');
  return normalized as GovernorateId;
};

const featuredByGovernorate = byGov<Business>({
  baghdad: [
    {
      id: 'mock-baghdad-1',
      name: 'Shabandar Rooftop Café',
      nameAr: 'مقهى الشابندر روف توب',
      nameKu: 'کافێی شابەندەر روفتۆپ',
      category: 'cafes',
      subcategory: 'specialty_coffee',
      governorate: 'baghdad',
      city: 'Baghdad',
      address: 'Mutanabbi Street, Al-Rusafa',
      phone: '+964 770 445 1122',
      rating: 4.8,
      reviewCount: 342,
      isFeatured: true,
      isPremium: true,
      isVerified: true,
      status: 'open',
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
      coverImage: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31',
      description: 'Popular evening coffee lounge overlooking old Baghdad.',
      openHours: '8:00 AM - 12:00 AM',
      tags: ['coffee', 'rooftop', 'culture'],
      priceRange: 2,
    },
  ],
  basra: [
    {
      id: 'mock-basra-1',
      name: 'Shatt Al-Arab Seafood House',
      nameAr: 'بيت مأكولات شط العرب',
      nameKu: 'ماڵی خواردنی شەطی عەرەب',
      category: 'restaurants',
      governorate: 'basra',
      city: 'Basra',
      address: 'Corniche Road, Basra',
      phone: '+964 781 220 5533',
      rating: 4.7,
      reviewCount: 510,
      isFeatured: true,
      isVerified: true,
      status: 'open',
      imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de',
      coverImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9',
      description: 'Fresh fish and masgouf by the riverfront.',
      openHours: '1:00 PM - 1:00 AM',
      tags: ['seafood', 'family'],
      priceRange: 3,
    },
  ],
  erbil: [
    {
      id: 'mock-erbil-1',
      name: 'Citadel View Lounge',
      nameAr: 'لاونج إطلالة القلعة',
      nameKu: 'لاونجی دیمەنی قەڵا',
      category: 'cafes',
      governorate: 'erbil',
      city: 'Erbil',
      address: 'Khanqah Street, Erbil Citadel',
      phone: '+964 750 998 4411',
      rating: 4.9,
      reviewCount: 802,
      isFeatured: true,
      isPremium: true,
      isVerified: true,
      status: 'open',
      imageUrl: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247',
      coverImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
      description: 'Specialty coffee with sunset views of Erbil Citadel.',
      openHours: '9:00 AM - 1:00 AM',
      tags: ['citadel', 'coffee', 'tourist'],
      priceRange: 2,
    },
  ],
  sulaymaniyah: [
    {
      id: 'mock-suli-1',
      name: 'Azadi Book & Brew',
      nameAr: 'أزادي بوك آند برو',
      nameKu: 'ئازادی بوک و برو',
      category: 'cafes',
      governorate: 'sulaymaniyah',
      city: 'Sulaymaniyah',
      address: 'Salim Street, Sulaymaniyah',
      phone: '+964 770 663 7722',
      rating: 4.6,
      reviewCount: 289,
      isFeatured: true,
      isVerified: true,
      status: 'open',
      imageUrl: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814',
      coverImage: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2',
      description: 'A calm café for readers and students.',
      openHours: '7:30 AM - 11:30 PM',
      tags: ['books', 'study'],
      priceRange: 1,
    },
  ],
  dohuk: [],
  nineveh: [],
});

const postsByGovernorate = byGov<Post>({
  baghdad: [
    { id: 'p-baghdad-1', businessId: 'mock-baghdad-1', businessName: 'Shabandar Rooftop Café', businessAvatar: 'https://i.pravatar.cc/120?u=shabandar', caption: 'Live oud performance starts at 8 PM tonight on the rooftop 🎶', imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7', createdAt: new Date('2026-03-25T19:00:00Z'), likes: 31, isVerified: true, governorate: 'baghdad' },
    { id: 'p-baghdad-2', businessId: 'baghdad-river-cafe', businessName: 'Baghdad River Cafe', businessAvatar: 'https://i.pravatar.cc/120?u=rivercafe', caption: 'Masala latte + date cake combo available all weekend.', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085', createdAt: new Date('2026-03-24T10:00:00Z'), likes: 24, isVerified: true, governorate: 'baghdad' },
  ],
  basra: [
    { id: 'p-basra-1', businessId: 'mock-basra-1', businessName: 'Shatt Al-Arab Seafood House', businessAvatar: 'https://i.pravatar.cc/120?u=shatt', caption: 'Tonight’s catch: grilled zubaidi and shrimp soup by the water.', imageUrl: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252', createdAt: new Date('2026-03-26T16:30:00Z'), likes: 44, governorate: 'basra' },
  ],
  erbil: [
    { id: 'p-erbil-1', businessId: 'mock-erbil-1', businessName: 'Citadel View Lounge', businessAvatar: 'https://i.pravatar.cc/120?u=citadel', caption: 'New pistachio cold brew launched today at the Citadel branch.', imageUrl: 'https://images.unsplash.com/photo-1461988320302-91bde64fc8e4', createdAt: new Date('2026-03-27T14:15:00Z'), likes: 52, isVerified: true, governorate: 'erbil' },
  ],
  sulaymaniyah: [
    { id: 'p-suli-1', businessId: 'mock-suli-1', businessName: 'Azadi Book & Brew', businessAvatar: 'https://i.pravatar.cc/120?u=azadi', caption: 'Friday poetry night with local writers starts at 7 PM.', imageUrl: 'https://images.unsplash.com/photo-1481833761820-0509d3217039', createdAt: new Date('2026-03-23T13:00:00Z'), likes: 19, governorate: 'sulaymaniyah' },
  ],
  dohuk: [],
  nineveh: [],
});

const storiesByGovernorate = byGov<Story>({
  baghdad: [
    { id: 601, avatar: 'https://i.pravatar.cc/160?u=bag1', name: 'Nahrain Studio', viewed: false, verified: true, thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', userName: 'Nahrain Studio', type: 'business', aiVerified: true, isLive: true, media: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4','https://images.unsplash.com/photo-1453614512568-c4024d13c247'], timeAgo: '45m ago', governorate: 'baghdad' as any },
  ],
  basra: [
    { id: 602, avatar: 'https://i.pravatar.cc/160?u=bas1', name: 'Basra Walks', viewed: false, thumbnail: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187', userName: 'Basra Walks', type: 'community', media: ['https://images.unsplash.com/photo-1470337458703-46ad1756a187'], timeAgo: '1h ago', governorate: 'basra' as any },
  ],
  erbil: [
    { id: 603, avatar: 'https://i.pravatar.cc/160?u=erb1', name: 'Citadel Life', viewed: false, verified: true, thumbnail: 'https://images.unsplash.com/photo-1470123808288-1e59739e4c92', userName: 'Citadel Life', type: 'community', media: ['https://images.unsplash.com/photo-1470123808288-1e59739e4c92','https://images.unsplash.com/photo-1453614512568-c4024d13c247'], timeAgo: '30m ago', isLive: true, governorate: 'erbil' as any },
  ],
  sulaymaniyah: [
    { id: 604, avatar: 'https://i.pravatar.cc/160?u=sul1', name: 'Slemani Eats', viewed: true, thumbnail: 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b', userName: 'Slemani Eats', type: 'business', media: ['https://images.unsplash.com/photo-1424847651672-bf20a4b0982b'], timeAgo: '3h ago', governorate: 'sulaymaniyah' as any },
  ],
  dohuk: [],
  nineveh: [],
});

const postcardsByGovernorate = byGov<BusinessPostcard>({
  baghdad: [
    { id: 'pc-baghdad-1', title: 'Al-Mutanabbi Corner Cafe', city: 'Baghdad', neighborhood: 'Al-Rasheed St', governorate: 'baghdad', category_tag: 'Cafe', phone: '+9647801012233', website: 'https://mutanabbi.example', instagram: '@mutanabbi_corner', hero_image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085', image_gallery: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085'], postcard_content: 'Historic-bookstreet café known for cardamom tea and writer meetups.', google_maps_url: 'https://maps.google.com/?q=mutanabbi+baghdad', rating: 4.7, review_count: 188, verified: true },
  ],
  basra: [
    { id: 'pc-basra-1', title: 'Palm Breeze Bakery', city: 'Basra', neighborhood: 'Al-Jazaer', governorate: 'basra', category_tag: 'Bakery', phone: '+9647816639911', instagram: '@palmbreeze.bakery', hero_image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff', image_gallery: ['https://images.unsplash.com/photo-1509440159596-0249088772ff'], postcard_content: 'Khubz tanoor, date maamoul, and morning delivery around central Basra.', google_maps_url: 'https://maps.google.com/?q=basra+breeze+bakery', rating: 4.5, review_count: 91, verified: true },
  ],
  erbil: [
    { id: 'pc-erbil-1', title: 'Qalat Fitness Club', city: 'Erbil', neighborhood: '100m Road', governorate: 'erbil', category_tag: 'Gym', phone: '+9647505527700', instagram: '@qalatfitness', hero_image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f', image_gallery: ['https://images.unsplash.com/photo-1571902943202-507ec2618e8f'], postcard_content: 'Modern gym with women-only sessions, trainers, and steam recovery.', google_maps_url: 'https://maps.google.com/?q=erbil+fitness+club', rating: 4.8, review_count: 265, verified: true },
  ],
  sulaymaniyah: [
    { id: 'pc-suli-1', title: 'Sarchnar Family Market', city: 'Sulaymaniyah', neighborhood: 'Sarchnar', governorate: 'sulaymaniyah', category_tag: 'Supermarket', phone: '+9647703345500', hero_image: 'https://images.unsplash.com/photo-1542838132-92c53300491e', image_gallery: ['https://images.unsplash.com/photo-1542838132-92c53300491e'], postcard_content: 'Fresh produce, imported goods, and late-night grocery service.', google_maps_url: 'https://maps.google.com/?q=sarchnar+market', rating: 4.4, review_count: 139, verified: false },
  ],
  dohuk: [],
  nineveh: [],
});

const collect = <T,>(data: Record<string, T[]>, governorate: GovernorateId) => {
  if (governorate === 'all') return Object.values(data).flat();
  return data[governorate] || [];
};

export const mockData = {
  getFeaturedBusinesses(governorate: GovernorateId = 'all') {
    return collect(featuredByGovernorate, governorate);
  },
  getPosts(governorate: GovernorateId = 'all') {
    return collect(postsByGovernorate, governorate).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  getStories(governorate: GovernorateId = 'all') {
    return collect(storiesByGovernorate, governorate);
  },
  getPostcards(governorate: GovernorateId = 'all') {
    return collect(postcardsByGovernorate, governorate);
  },
};

import type React from 'react';

export interface Story {
  id: number;
  avatar: string;
  name: string;
  viewed?: boolean;
  verified?: boolean;
  thumbnail: string;
  userName: string;
  type: 'business' | 'community';
  aiVerified?: boolean;
  isLive?: boolean;
  media: string[];
  timeAgo: string;
  governorate?: string;
}

export interface Subcategory {
  id: string;
  icon: React.ReactNode;
  nameKey: string;
  count?: number;
  subcategories?: Subcategory[];
}

export interface Category {
  id: string;
  icon: React.ReactNode;
  nameKey: string;
  eventCount: number;
  recommended?: boolean;
  subcategories?: Subcategory[];
}

export interface Business {
  id: string | number;
  name: string;
  nameAr?: string;
  nameKu?: string;
  imageUrl?: string;
  coverImage?: string;
  isPremium?: boolean;
  isFeatured?: boolean;
  category: string;
  subcategory?: string;
  rating: number;
  distance?: number;
  status?: string;
  isVerified?: boolean;
  reviewCount?: number;
  governorate?: string;
  city?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  description?: string;
  descriptionAr?: string;
  descriptionKu?: string;
  openHours?: string;
  priceRange?: 1 | 2 | 3 | 4;
  tags?: string[];
  lat?: number;
  lng?: number;
}

export interface Event {
  id: string | number;
  image: string;
  title: string;
  titleKey?: string;
  aiRecommended?: boolean;
  date: Date;
  venue: string;
  venueKey?: string;
  location?: string;
  attendees: number;
  price: number;
  category: string;
  governorate: string;
  accessibility?: {
    wheelchairAccessible?: boolean;
    familyFriendly?: boolean;
    womenOnly?: boolean;
    sensoryFriendly?: boolean;
    signLanguage?: boolean;
    audioDescription?: boolean;
  };
}

export interface Deal {
  id: string | number;
  discount: number;
  businessLogo: string;
  title: string;
  titleKey?: string;
  description: string;
  descriptionKey?: string;
  expiresIn: string;
  expiresInKey?: string;
  claimed: number;
  total: number;
  createdAt?: any;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'user' | 'admin';
  businessId?: string;
  updatedAt?: any;
}

export interface Post {
  id: string;
  businessId: string;
  businessName: string;
  businessAvatar: string;
  caption: string;
  imageUrl: string;
  createdAt: Date;
  likes: number;
  isVerified?: boolean;
  governorate?: string;
}

export interface BusinessPostcard {
  id?: string;
  title: string;
  city: string;
  neighborhood: string;
  governorate: string;
  category_tag: 'Cafe' | 'Restaurant' | 'Bakery' | 'Hotel' | 'Gym' | 'Salon' | 'Pharmacy' | 'Supermarket';
  phone: string;
  website?: string;
  instagram?: string;
  hero_image: string;
  image_gallery: string[];
  postcard_content: string;
  google_maps_url: string;
  rating: number;
  review_count: number;
  verified: boolean;
  updatedAt?: any;
}

export interface HeroSlide {
    id: number;
    title?: string;
    subtitle?: string;
    titleKey: string;
    subtitleKey: string;
    image: string;
}
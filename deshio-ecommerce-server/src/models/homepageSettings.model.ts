import { Schema, model } from 'mongoose';

export type HomeSectionType =
  | 'new_arrival'
  | 'best_selling'
  | 'top_categories'
  | 'featured'
  | 'gender'
  | 'category';

export const HOME_SECTION_TYPES: HomeSectionType[] = [
  'new_arrival',
  'best_selling',
  'top_categories',
  'featured',
  'gender',
  'category',
];

export interface IHomeSection {
  key: string;
  type: HomeSectionType;
  title: string;
  enabled: boolean;
  order: number;
  /** Number of products (or categories) to show */
  limit: number;
  /** gender (men/women/kids/unisex) or category slug depending on type */
  value?: string;
}

export interface IHomepageSettings {
  banner: {
    enabled: boolean;
    image: string;
    mobileImage?: string;
    link?: string;
    alt?: string;
  };
  sections: IHomeSection[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const DEFAULT_HOME_SECTIONS: IHomeSection[] = [
  { key: 'new-arrival', type: 'new_arrival', title: 'New Arrival', enabled: true, order: 1, limit: 8 },
  { key: 'top-categories', type: 'top_categories', title: 'Top Categories', enabled: true, order: 2, limit: 8 },
  { key: 'best-selling', type: 'best_selling', title: 'Best Selling', enabled: true, order: 3, limit: 8 },
  { key: 'mens-fashion', type: 'gender', title: "Men's Fashion", enabled: true, order: 4, limit: 8, value: 'men' },
  { key: 'womens-fashion', type: 'gender', title: "Women's Fashion", enabled: false, order: 5, limit: 8, value: 'women' },
];

const sectionSchema = new Schema<IHomeSection>(
  {
    key: { type: String, required: true, trim: true },
    type: { type: String, enum: HOME_SECTION_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    limit: { type: Number, default: 8, min: 1, max: 24 },
    value: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const homepageSettingsSchema = new Schema<IHomepageSettings>(
  {
    banner: {
      enabled: { type: Boolean, default: true },
      image: {
        type: String,
        default:
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
      },
      mobileImage: { type: String, default: '' },
      link: { type: String, default: '/products' },
      alt: { type: String, default: 'Shop the latest collection' },
    },
    sections: { type: [sectionSchema], default: () => DEFAULT_HOME_SECTIONS },
  },
  { timestamps: true }
);

const HomepageSettings = model<IHomepageSettings>('HomepageSettings', homepageSettingsSchema);
export default HomepageSettings;

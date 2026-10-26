import { Schema, model } from 'mongoose';
import { ISiteSettings } from '../types';

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    siteName: {
      type: String,
      default: 'Deshio',
      trim: true,
    },
    siteTitle: {
      type: String,
      default: 'Deshio — Timeless Elegance & Contemporary Fashion',
      trim: true,
    },
    titleTemplate: {
      type: String,
      default: '%s | Deshio',
      trim: true,
    },
    metaDescription: {
      type: String,
      default:
        'Discover curated luxury essentials, exquisite handlooms, and contemporary everyday wear crafted from breathable, premium fabrics. Nationwide delivery across Bangladesh.',
      trim: true,
    },
    metaKeywords: {
      type: [String],
      default: [
        'fashion bangladesh',
        'panjabi online',
        'jamdani saree',
        'handloom cotton',
        'mens fashion dhaka',
        'womens kurti',
        'deshio fashion',
      ],
    },
    canonicalUrl: {
      type: String,
      default: 'https://deshio.com',
      trim: true,
    },
    ogImage: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80',
    },
    twitterHandle: {
      type: String,
      default: '@deshio_official',
      trim: true,
    },
    googleSiteVerification: {
      type: String,
      default: '',
      trim: true,
    },
    bingSiteVerification: {
      type: String,
      default: '',
      trim: true,
    },
    indexSite: {
      type: Boolean,
      default: true,
    },
    contactEmail: {
      type: String,
      default: 'care@deshio.com',
      trim: true,
    },
    contactPhone: {
      type: String,
      default: '+880 1700-000000',
      trim: true,
    },
      socialLinks: {
      facebook: { type: String, default: 'https://facebook.com/deshio' },
      instagram: { type: String, default: 'https://instagram.com/deshio' },
      youtube: { type: String, default: '' },
      pinterest: { type: String, default: '' },
      tiktok: { type: String, default: '' },
      whatsapp: { type: String, default: '+880 1700-000000' },
      messenger: { type: String, default: 'https://m.me/deshio' },
    },
    whatsappSupport: {
      type: String,
      default: '+880 1700-000000',
      trim: true,
    },
    messengerSupport: {
      type: String,
      default: 'https://m.me/deshio',
      trim: true,
    },
    logoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Haute & Contemporary',
      trim: true,
    },
    announcementText: {
      type: String,
      default: 'Complimentary Express Shipping on Orders Above ৳2,500',
      trim: true,
    },
    showAnnouncement: {
      type: Boolean,
      default: true,
    },
    address: {
      type: String,
      default: 'Road 11, Banani, Dhaka 1213, Bangladesh',
      trim: true,
    },
    showroomHours: {
      type: String,
      default: '11:00 AM – 9:00 PM (Open 7 Days)',
      trim: true,
    },
    helplineHours: {
      type: String,
      default: 'Sat – Thu, 10:00 AM – 8:00 PM BST',
      trim: true,
    },
    footerDescription: {
      type: String,
      default:
        'Curated luxury essentials, exquisite handlooms, and contemporary everyday wear crafted from breathable, premium fabrics.',
      trim: true,
    },
    copyrightText: {
      type: String,
      default: '© {year} Deshio Fashion. All rights reserved.',
      trim: true,
    },
    contactPageTitle: {
      type: String,
      default: "We'd Love to Hear From You",
      trim: true,
    },
    contactPageSubtitle: {
      type: String,
      default:
        'Whether you need sizing guidance, fabric care advice, or assistance with an existing order, our Dhaka studio team is ready to assist.',
      trim: true,
    },
    contactFaqs: {
      type: [
        {
          question: { type: String, required: true },
          answer: { type: String, required: true },
        },
      ],
      default: [
        {
          question: 'How long does delivery take inside and outside Dhaka?',
          answer:
            'Orders inside Dhaka arrive within 24–48 hours. Nationwide courier deliveries across all 64 districts take 3–5 business days.',
        },
        {
          question: 'Can I exchange a garment if the size doesn’t fit?',
          answer:
            'Yes! We offer a hassle-free 7-day size exchange on all unworn garments with original tags attached.',
        },
        {
          question: 'What payment methods do you accept?',
          answer:
            'We accept Cash on Delivery (COD) nationwide as well as Mobile Banking (bKash, Nagad, and Rocket).',
        },
        {
          question: 'How can I be sure of my Panjabi or Kurti measurements?',
          answer:
            'Every product page includes an interactive Size Guide with chest, shoulder, and garment length measurements in inches.',
        },
      ],
    },
    aboutHeroBadge: {
      type: String,
      default: 'Our Heritage & Philosophy',
      trim: true,
    },
    aboutHeroTitle: {
      type: String,
      default: 'Rooted in Craft. Tailored for Today.',
      trim: true,
    },
    aboutHeroSubtitle: {
      type: String,
      default:
        'Deshio was born from a simple conviction: everyday clothing in Bangladesh should honor our rich textile heritage while embracing clean, contemporary tailoring and breathable comfort.',
      trim: true,
    },
    aboutStoryBadge: {
      type: String,
      default: 'The Deshio Standard',
      trim: true,
    },
    aboutStoryTitle: {
      type: String,
      default: 'Every Thread Tells a Story of Patience & Precision',
      trim: true,
    },
    aboutStoryParagraph1: {
      type: String,
      default:
        'In an era of disposable fast fashion, we choose a slower, more deliberate path. Our design studio in Dhaka works hand-in-hand with generational weavers across rural Bangladesh to develop slow textiles that soften with every wash.',
      trim: true,
    },
    aboutStoryParagraph2: {
      type: String,
      default:
        'Whether it is a festive embroidered Panjabi, a hand-woven Jamdani saree, or an everyday relaxed linen shirt, every silhouette is proportioned for effortless grace and lasting durability.',
      trim: true,
    },
    aboutStats: {
      type: [
        {
          value: { type: String, required: true },
          label: { type: String, required: true },
        },
      ],
      default: [
        { value: '45K+', label: 'Patrons Across Bangladesh' },
        { value: '180+', label: 'Master Weavers & Artisans' },
        { value: '64', label: 'Districts Delivered' },
        { value: '99.2%', label: 'Fit & Quality Satisfaction' },
      ],
    },
    aboutPillars: {
      type: [
        {
          title: { type: String, required: true },
          description: { type: String, required: true },
        },
      ],
      default: [
        {
          title: 'Breathable Natural Fibers',
          description:
            'Every garment begins with thoughtfully sourced textiles — combed organic cotton, pure linen, mulberry silk, and hand-spun muslin engineered for our tropical climate.',
        },
        {
          title: 'Artisanal Heritage',
          description:
            'We collaborate directly with weaving clusters in Tangail, Sonargaon, and Sirajganj to preserve authentic Jamdani and handloom traditions with fair artisan wages.',
        },
        {
          title: 'Architectural Tailoring',
          description:
            'Our Dhaka atelier refines every pattern through multiple fittings, ensuring clean drapes, reinforced seams, and effortless movement from morning to evening.',
        },
        {
          title: 'Uncompromising Quality',
          description:
            'Each piece undergoes a 12-point garment inspection for colorfastness, stitch density, and fabric finish before it leaves our studio.',
        },
        {
          title: 'Effortless Size Exchanges',
          description:
            'Finding your ideal fit should be worry-free. We offer a seamless 7-day size exchange and return policy across all collections.',
        },
        {
          title: 'Nationwide Doorstep Delivery',
          description:
            'From express dispatch inside Dhaka to reliable courier coverage across all 64 districts, with Cash on Delivery and Mobile Banking options.',
        },
      ],
    },
    aboutMilestones: {
      type: [
        {
          year: { type: String, required: true },
          title: { type: String, required: true },
          description: { type: String, required: true },
        },
      ],
      default: [
        {
          year: '2020',
          title: 'The Atelier Begins in Dhaka',
          description:
            'Founded with a capsule collection of 12 handloom Panjabis and breathable everyday Kurtis crafted alongside five master tailors.',
        },
        {
          year: '2022',
          title: 'Direct Weaver Partnerships',
          description:
            'Established direct partnerships with weaving communities in Tangail and Narayanganj, eliminating middlemen and elevating textile purity.',
        },
        {
          year: '2024',
          title: 'Contemporary Ready-to-Wear Expansion',
          description:
            'Introduced women’s Festive Sarees, tailored linen co-ords, and children’s organic cotton wear, serving over 30,000 customers nationwide.',
        },
        {
          year: 'Today',
          title: 'A Modern Bangladeshi Wardrobe',
          description:
            'Continuing to blend timeless heritage craftsmanship with minimalist modern design for discerning dressers across Bangladesh.',
        },
      ],
    },
    showFloatingSupport: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const SiteSettings = model<ISiteSettings>('SiteSettings', siteSettingsSchema);
export default SiteSettings;

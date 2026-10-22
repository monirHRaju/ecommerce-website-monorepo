import mongoose from 'mongoose';
import config from '../config';
import Category from '../models/category.model';
import Coupon from '../models/coupon.model';
import DeliveryZone from '../models/deliveryZone.model';
import Order from '../models/order.model';
import Product from '../models/product.model';
import Review from '../models/review.model';
import User from '../models/user.model';

const makeVariants = (
  slug: string,
  sizes: string[],
  colors: { name: string; hex: string }[],
  baseStock = 8
) =>
  colors.flatMap((c) =>
    sizes.map((size, idx) => ({
      size,
      color: c.name,
      colorHex: c.hex,
      sku: `${slug}-${size}-${c.name}`.toUpperCase().replace(/[^A-Z0-9]+/g, '-'),
      stock: Math.max(2, baseStock + ((idx * 3) % 7)),
    }))
  );

const seed = async () => {
  await mongoose.connect(config.database_url as string);
  console.log('Connected to DB for fashion seeding...');

  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Review.deleteMany({}),
    Order.deleteMany({}),
    DeliveryZone.deleteMany({}),
    Coupon.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // ─── Users ───────────────────────────────────────────────────────────────────
  const [adminUser, demoUser] = await User.create([
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: '123456',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
      phone: '01711000000',
      isVerified: true,
    },
    {
      name: 'Demo Shopper',
      email: 'user@example.com',
      password: '123456',
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
      phone: '01811000000',
      isVerified: true,
    },
  ]);
  console.log('Users created');

  // ─── Main Categories ─────────────────────────────────────────────────────────
  const mainCategoryData = [
    {
      name: 'Men',
      slug: 'men',
      description: 'Tailored essentials, breathable shirts, panjabis, and everyday trousers.',
      image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&q=80',
    },
    {
      name: 'Women',
      slug: 'women',
      description: 'Effortless silhouettes, handloom sarees, kurtis, and contemporary dresses.',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
    },
    {
      name: 'Kids',
      slug: 'kids',
      description: 'Soft organic cotton playwear and festive outfits for boys and girls.',
      image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&q=80',
    },
    {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Minimal leather goods, structured totes, footwear, and timeless watches.',
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
    },
  ];

  const mainCategories = await Category.create(mainCategoryData);
  const mainMap = Object.fromEntries(mainCategories.map((c) => [c.slug, c._id]));

  // ─── Sub-Categories ──────────────────────────────────────────────────────────
  const subCategories = await Category.create([
    // Men
    { name: 'Shirts', slug: 'men-shirts', parentCategory: mainMap['men'], image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80' },
    { name: 'T-Shirts & Polos', slug: 'men-tshirts', parentCategory: mainMap['men'], image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80' },
    { name: 'Trousers & Chinos', slug: 'men-trousers', parentCategory: mainMap['men'], image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80' },
    { name: 'Panjabi & Ethnic', slug: 'men-panjabi', parentCategory: mainMap['men'], image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80' },
    // Women
    { name: 'Dresses', slug: 'women-dresses', parentCategory: mainMap['women'], image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80' },
    { name: 'Sarees', slug: 'women-sarees', parentCategory: mainMap['women'], image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80' },
    { name: 'Kurtis & Kameez', slug: 'women-kurtis', parentCategory: mainMap['women'], image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80' },
    { name: 'Tops & Blouses', slug: 'women-tops', parentCategory: mainMap['women'], image: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=600&q=80' },
    // Kids
    { name: 'Boys Wear', slug: 'boys-wear', parentCategory: mainMap['kids'], image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80' },
    { name: 'Girls Wear', slug: 'girls-wear', parentCategory: mainMap['kids'], image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600&q=80' },
    // Accessories
    { name: 'Bags & Totes', slug: 'bags-totes', parentCategory: mainMap['accessories'], image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80' },
    { name: 'Footwear', slug: 'footwear', parentCategory: mainMap['accessories'], image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80' },
    { name: 'Watches & Minimal Jewelry', slug: 'watches-jewelry', parentCategory: mainMap['accessories'], image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&q=80' },
  ]);

  const catMap = Object.fromEntries([
    ...mainCategories.map((c) => [c.slug, c._id]),
    ...subCategories.map((c) => [c.slug, c._id]),
  ]);
  console.log('Fashion categories created');

  // ─── Products ────────────────────────────────────────────────────────────────
  const standardCare = 'Machine wash cold on gentle cycle. Do not bleach. Line dry in shade and warm iron on reverse.';
  const standardSizeGuide = 'S: Chest 38", Length 28" | M: Chest 40", Length 29" | L: Chest 42", Length 30" | XL: Chest 44", Length 31"';

  const productData = [
    {
      title: 'Relaxed Pure Linen Camp Shirt',
      slug: 'relaxed-pure-linen-camp-shirt',
      description:
        'Woven from 100% European flax linen, this breathable camp-collar shirt softens with every wash. Cut in an easy, relaxed drape that transitions effortlessly from warm city afternoons to coastal evenings.',
      images: [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&q=80',
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&q=80',
      ],
      price: 2490,
      category: catMap['men-shirts'],
      brand: 'Atelier Dhaka',
      discount: 10,
      isFeatured: true,
      gender: 'men' as const,
      material: '100% Pure Linen',
      fit: 'Relaxed Fit',
      careInstructions: standardCare,
      sizeGuide: standardSizeGuide,
      tags: ['linen', 'shirt', 'summer', 'menswear', 'breathable'],
      rating: 4.9,
      reviewCount: 0,
      sold: 42,
      variants: makeVariants(
        'relaxed-pure-linen-camp-shirt',
        ['S', 'M', 'L', 'XL'],
        [
          { name: 'Oatmeal', hex: '#E5DEC9' },
          { name: 'Olive', hex: '#556B2F' },
          { name: 'Charcoal', hex: '#2F353B' },
        ]
      ),
      specifications: new Map([
        ['Fabric', '100% Flax Linen (165 GSM)'],
        ['Collar', 'Cuban / Camp Collar'],
        ['Buttons', 'Natural Mother-of-Pearl'],
      ]),
      createdBy: adminUser._id,
    },
    {
      title: 'Tailored Oxford Button-Down Shirt',
      slug: 'tailored-oxford-button-down-shirt',
      description:
        'A wardrobe cornerstone crafted from brushed long-staple organic cotton Oxford cloth. Features a softly structured button-down collar, single chest pocket, and box pleat at the back for ease of movement.',
      images: [
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&q=80',
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&q=80',
      ],
      price: 2190,
      category: catMap['men-shirts'],
      brand: 'Atelier Dhaka',
      discount: 0,
      isFeatured: true,
      gender: 'men' as const,
      material: '100% Organic Cotton Oxford',
      fit: 'Tailored Fit',
      careInstructions: standardCare,
      sizeGuide: standardSizeGuide,
      tags: ['oxford', 'formal', 'cotton', 'shirt', 'men'],
      rating: 4.8,
      reviewCount: 0,
      sold: 38,
      variants: makeVariants(
        'tailored-oxford-button-down-shirt',
        ['S', 'M', 'L', 'XL'],
        [
          { name: 'Crisp White', hex: '#F9F9F6' },
          { name: 'Sky Blue', hex: '#B9D3EE' },
        ]
      ),
      specifications: new Map([
        ['Fabric', '100% Organic Combed Cotton'],
        ['Weave', 'Pinpoint Oxford'],
        ['Cuff', 'Adjustable Barrel Cuff'],
      ]),
      createdBy: adminUser._id,
    },
    {
      title: 'Heavyweight Supima Crewneck Tee',
      slug: 'heavyweight-supima-crewneck-tee',
      description:
        'Knitted from extra-long-staple Supima cotton at a substantial 240 GSM weight. Holds its clean, structured shape all day without clinging, finished with a bound ribbed collar that never loses elasticity.',
      images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=80',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=900&q=80',
      ],
      price: 1290,
      category: catMap['men-tshirts'],
      brand: 'Knit & Co.',
      discount: 0,
      isFeatured: true,
      gender: 'unisex' as const,
      material: '100% Supima Cotton (240 GSM)',
      fit: 'Boxy Relaxed Fit',
      careInstructions: standardCare,
      sizeGuide: standardSizeGuide,
      tags: ['tshirt', 'supima', 'heavyweight', 'essentials', 'unisex'],
      rating: 4.9,
      reviewCount: 0,
      sold: 95,
      variants: makeVariants(
        'heavyweight-supima-crewneck-tee',
        ['XS', 'S', 'M', 'L', 'XL'],
        [
          { name: 'Off-White', hex: '#F4F1EA' },
          { name: 'Jet Black', hex: '#181818' },
          { name: 'Espresso', hex: '#4B3621' },
        ],
        12
      ),
      specifications: new Map([
        ['Weight', '240 GSM Heavy Jersey'],
        ['Neckline', 'Double-needle Ribbed Crew'],
        ['Origin', 'Knitted in Bangladesh'],
      ]),
      createdBy: adminUser._id,
    },
    {
      title: 'Pleated Tapered Cotton Twill Chinos',
      slug: 'pleated-tapered-cotton-twill-chinos',
      description:
        'Modern single-pleat trousers cut from peached organic cotton twill with a hint of comfort stretch. Roomy through the seat and thigh with a clean taper toward the ankle.',
      images: [
        'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=900&q=80',
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=900&q=80',
      ],
      price: 2790,
      category: catMap['men-trousers'],
      brand: 'Atelier Dhaka',
      discount: 12,
      isFeatured: false,
      gender: 'men' as const,
      material: '98% Cotton, 2% Elastane Twill',
      fit: 'Relaxed Tapered',
      careInstructions: standardCare,
      sizeGuide: 'S (30W) | M (32W) | L (34W) | XL (36W) — Inseam 30"',
      tags: ['chinos', 'trousers', 'pants', 'tailored', 'menswear'],
      rating: 4.7,
      reviewCount: 0,
      sold: 29,
      variants: makeVariants(
        'pleated-tapered-cotton-twill-chinos',
        ['S', 'M', 'L', 'XL'],
        [
          { name: 'Sand Khaki', hex: '#C2B280' },
          { name: 'Deep Navy', hex: '#1D2951' },
        ]
      ),
      specifications: new Map([
        ['Fabric', '280 GSM Peached Cotton Twill'],
        ['Rise', 'Mid-to-High Rise'],
        ['Pockets', 'Slanted Side & Welted Back Pockets'],
      ]),
      createdBy: adminUser._id,
    },
    {
      title: 'Handloom Textured Cotton Festive Panjabi',
      slug: 'handloom-textured-cotton-festive-panjabi',
      description:
        'Crafted on traditional looms using breathable mercerized cotton with subtle tone-on-tone kantha embroidery along the mandarin placket. Designed for effortless sophistication at gatherings and celebrations.',
      images: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&q=80',
        'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=900&q=80',
      ],
      price: 3290,
      category: catMap['men-panjabi'],
      brand: 'Desh Heritage',
      discount: 5,
      isFeatured: true,
      gender: 'men' as const,
      material: '100% Handloom Mercerized Cotton',
      fit: 'Regular Comfort Fit',
      careInstructions: 'Gentle hand wash separately in cold water. Dry in shade.',
      sizeGuide: 'S (38) | M (40) | L (42) | XL (44)',
      tags: ['panjabi', 'ethnic', 'handloom', 'festive', 'eid'],
      rating: 4.9,
      reviewCount: 0,
      sold: 64,
      variants: makeVariants(
        'handloom-textured-cotton-festive-panjabi',
        ['S', 'M', 'L', 'XL'],
        [
          { name: 'Ivory Gold', hex: '#F5F0E1' },
          { name: 'Midnight Indigo', hex: '#1F263D' },
        ]
      ),
      specifications: new Map([
        ['Craft', 'Artisanal Handloom Weave'],
        ['Collar', 'Embroidered Band Collar'],
        ['Pockets', 'Dual Side Seam Pockets'],
      ]),
      createdBy: adminUser._id,
    },
    {
      title: 'Belted Midi Linen Wrap Dress',
      slug: 'belted-midi-linen-wrap-dress',
      description:
        'A timeless wrap silhouette cut from airy linen-viscose blend that drapes fluidly without creasing easily. Features softly gathered bishop sleeves, a flattering V-neckline, and a removable self-tie waist belt.',
      images: [
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=900&q=80',
        'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=900&q=80',
      ],
      price: 3690,
      category: catMap['women-dresses'],
      brand: 'Noor Studio',
      discount: 15,
      isFeatured: true,
      gender: 'women' as const,
      material: '55% Linen, 45% EcoVero Viscose',
      fit: 'Adjustable Wrap Fit',
      careInstructions: standardCare,
      sizeGuide: 'XS (Bust 32") | S (Bust 34") | M (Bust 36") | L (Bust 38") | XL (Bust 40")',
      tags: ['dress', 'midi dress', 'linen', 'womenswear', 'summer'],
      rating: 4.9,
      reviewCount: 0,
      sold: 71,
      variants: makeVariants(
        'belted-midi-linen-wrap-dress',
        ['XS', 'S', 'M', 'L', 'XL'],
        [
          { name: 'Terracotta', hex: '#C66B49' },
          { name: 'Sage Green', hex: '#9CAF88' },
          { name: 'Ecru', hex: '#F3EFE6' },
        ]
      ),
      specifications: new Map([
        ['Length', 'Midi (47 inches)'],
        ['Lining', '100% Breathable Cotton Voile'],
        ['Closure', 'Internal Button + Wrap Tie'],
      ]),
      createdBy: adminUser._id,
    },
    {
      title: 'Jamdani Weave Muslin Silk Saree',
      slug: 'jamdani-weave-muslin-silk-saree',
      description:
        'Handwoven by master weavers with delicate geometric jamdani motifs floating across luminous muslin silk. Featherlight on the drape and accompanied by an unstitched matching blouse piece.',
      images: [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&q=80',
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&q=80',
      ],
      price: 6890,
      category: catMap['women-sarees'],
      brand: 'Desh Heritage',
      discount: 8,
      isFeatured: true,
      gender: 'women' as const,
      material: 'Handwoven Muslin Silk Blend',
      fit: 'Standard 6.2 Yards + Blouse Piece',
      careInstructions: 'Dry clean only. Store wrapped in soft cotton muslin.',
      sizeGuide: 'Free Size — Saree Length: 5.5m, Blouse Piece: 0.8m',
      tags: ['saree', 'jamdani', 'muslin', 'festive', 'handloom'],
      rating: 5.0,
      reviewCount: 0,
      sold: 33,
      variants: makeVariants(
        'jamdani-weave-muslin-silk-saree',
        ['Free Size'],
        [
          { name: 'Blush Rose', hex: '#E8B4B8' },
          { name: 'Champagne Gold', hex: '#E6D5B8' },
        ],
        6
      ),
      specifications: new Map([
        ['Weave', 'Authentic Tangail Jamdani'],
        ['Length', '5.5 Meters + 0.8m Blouse Piece'],
        ['Occasion', 'Festive & Evening'],
      ]),
      createdBy: adminUser._id,
    },
    {
      title: 'Embroidered Lawn Cotton Kurti Set',
      slug: 'embroidered-lawn-cotton-kurti-set',
      description:
        'Breezy fine-combed lawn cotton kurti featuring tonal threadwork along the neckline and cuffs. Paired with straight-cut cropped trousers for effortless everyday elegance.',
      images: [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&q=80',
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=80',
      ],
      price: 2890,
      category: catMap['women-kurtis'],
      brand: 'Noor Studio',
      discount: 10,
      isFeatured: false,
      gender: 'women' as const,
      material: '100% Combed Lawn Cotton',
      fit: 'Straight Kurta Fit',
      careInstructions: standardCare,
      sizeGuide: 'S (Bust 36") | M (Bust 38") | L (Bust 40") | XL (Bust 42")',
      tags: ['kurti', 'kameez', 'cotton', 'embroidered', 'women'],
      rating: 4.8,
      reviewCount: 0,
      sold: 54,
      variants: makeVariants(
        'embroidered-lawn-cotton-kurti-set',
        ['S', 'M', 'L', 'XL'],
        [
          { name: 'Powder Blue', hex: '#B0E0E6' },
          { name: 'Dusty Mauve', hex: '#B784A7' },
        ]
      ),
      specifications: new Map([
        ['Set Includes', 'Embroidered Kurti + Straight Trouser'],
        ['Sleeves', 'Three-Quarter Sleeves'],
        ['Embroidery', 'Fine Resham Threadwork'],
      ]),
      createdBy: adminUser._id,
    },
    {
      title: 'Pleated Satin Mandarin Collar Blouse',
      slug: 'pleated-satin-mandarin-collar-blouse',
      description:
        'Cut from fluid matte-lustre satin with delicate pintuck pleats across the front yoke. Styles seamlessly tucked into high-waisted trousers for work or draped over denim on weekends.',
      images: [
        'https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=900&q=80',
        'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=900&q=80',
      ],
      price: 2150,
      category: catMap['women-tops'],
      brand: 'Noor Studio',
      discount: 0,
      isFeatured: false,
      gender: 'women' as const,
      material: '100% Recycled Matte Satin',
      fit: 'Fluid Regular Fit',
      careInstructions: 'Cold hand wash or gentle cycle in laundry bag.',
      sizeGuide: 'XS (32") | S (34") | M (36") | L (38")',
      tags: ['blouse', 'top', 'satin', 'workwear', 'women'],
      rating: 4.7,
      reviewCount: 0,
      sold: 26,
      variants: makeVariants(
        'pleated-satin-mandarin-collar-blouse',
        ['XS', 'S', 'M', 'L'],
        [
          { name: 'Pearl Ivory', hex: '#F7F5F0' },
          { name: 'Emerald', hex: '#1B4D3E' },
        ]
      ),
      specifications: new Map([
        ['Finish', 'Soft Matte Lustre'],
        ['Neckline', 'Split Mandarin Collar'],
        ['Cuffs', 'Covered Button Cuffs'],
      ]),
      createdBy: adminUser._id,
    },
    {
      title: 'Organic Cotton Boys Co-ord Shirt & Shorts Set',
      slug: 'organic-cotton-boys-coord-shirt-shorts-set',
      description:
        'Super-soft GOTS-certified organic cotton muslin two-piece set designed for active play and sunny outings. Elasticated drawstring waist ensures an easy, comfortable fit.',
      images: [
        'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=900&q=80',
      ],
      price: 1690,
      category: catMap['boys-wear'],
      brand: 'Little Loom',
      discount: 0,
      isFeatured: false,
      gender: 'kids' as const,
      material: '100% Organic Double-Gauze Cotton',
      fit: 'Comfort Play Fit',
      careInstructions: standardCare,
      sizeGuide: '3-4Y | 5-6Y | 7-8Y | 9-10Y',
      tags: ['kids', 'boys', 'organic cotton', 'coord set'],
      rating: 4.8,
      reviewCount: 0,
      sold: 31,
      variants: makeVariants(
        'organic-cotton-boys-coord-shirt-shorts-set',
        ['3-4Y', '5-6Y', '7-8Y', '9-10Y'],
        [
          { name: 'Sage Stripe', hex: '#A3B19B' },
          { name: 'Ochre', hex: '#CC8E35' },
        ]
      ),
      specifications: new Map([
        ['Fabric', 'Hypoallergenic Double-Gauze Cotton'],
        ['Pieces', 'Short-Sleeve Shirt + Pull-On Shorts'],
      ]),
      createdBy: adminUser._id,
    },
    {
      title: 'Smocked Floral Cotton Girls Sundress',
      slug: 'smocked-floral-cotton-girls-sundress',
      description:
        'Hand-smocked bodice sundress in breathable block-printed cotton voile with flutter shoulder straps and a twirl-ready gathered skirt.',
      images: [
        'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=900&q=80',
      ],
      price: 1790,
      category: catMap['girls-wear'],
      brand: 'Little Loom',
      discount: 10,
      isFeatured: false,
      gender: 'kids' as const,
      material: '100% Cotton Voile',
      fit: 'Regular Fit',
      careInstructions: standardCare,
      sizeGuide: '3-4Y | 5-6Y | 7-8Y | 9-10Y',
      tags: ['kids', 'girls', 'dress', 'cotton', 'floral'],
      rating: 4.9,
      reviewCount: 0,
      sold: 28,
      variants: makeVariants(
        'smocked-floral-cotton-girls-sundress',
        ['3-4Y', '5-6Y', '7-8Y', '9-10Y'],
        [
          { name: 'Meadow Floral', hex: '#F3D6DC' },
          { name: 'Buttercup Yellow', hex: '#F6E58D' },
        ]
      ),
      specifications: new Map([
        ['Lining', '100% Soft Cambric Cotton'],
        ['Closure', 'Back Pearl Buttons'],
      ]),
      createdBy: adminUser._id,
    },
    {
      title: 'Structured Full-Grain Leather Everyday Tote',
      slug: 'structured-full-grain-leather-everyday-tote',
      description:
        'Minimal architectural tote handcrafted from vegetable-tanned full-grain leather. Fits a 15" laptop alongside daily essentials, with an internal zippered pochette and reinforced shoulder straps.',
      images: [
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=900&q=80',
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=900&q=80',
      ],
      price: 5490,
      category: catMap['bags-totes'],
      brand: 'Tanner & Guild',
      discount: 10,
      isFeatured: true,
      gender: 'unisex' as const,
      material: '100% Vegetable-Tanned Full-Grain Leather',
      fit: '38cm × 31cm × 14cm (26cm Strap Drop)',
      careInstructions: 'Wipe with a soft dry cloth. Condition with natural leather balm twice a year.',
      sizeGuide: 'One Size — Fits up to 15" laptop',
      tags: ['tote', 'leather bag', 'accessories', 'handbag', 'work bag'],
      rating: 4.9,
      reviewCount: 0,
      sold: 47,
      variants: makeVariants(
        'structured-full-grain-leather-everyday-tote',
        ['One Size'],
        [
          { name: 'Cognac Tan', hex: '#9A5B32' },
          { name: 'Obsidian Black', hex: '#1C1C1C' },
        ],
        10
      ),
      specifications: new Map([
        ['Leather', 'Full-Grain Vegetable-Tanned Cowhide'],
        ['Hardware', 'Brushed Antique Brass'],
        ['Compartments', 'Padded 15" Sleeve + Zip Pocket'],
      ]),
      createdBy: adminUser._id,
    },
    {
      title: 'Hand-Stitched Suede Penny Loafers',
      slug: 'hand-stitched-suede-penny-loafers',
      description:
        'Supple water-repellent Italian suede loafers set on a flexible Blake-stitched leather and crepe outsole. Unlined through the vamp for glove-like comfort from the very first wear.',
      images: [
        'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=80',
        'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=900&q=80',
      ],
      price: 4990,
      category: catMap['footwear'],
      brand: 'Tanner & Guild',
      discount: 0,
      isFeatured: true,
      gender: 'men' as const,
      material: 'Italian Calf Suede Upper, Leather Insole',
      fit: 'True to European Size',
      careInstructions: 'Brush gently with a suede brush. Protect with water-repellent spray.',
      sizeGuide: 'EU 40 (UK 6.5) | EU 41 (UK 7.5) | EU 42 (UK 8) | EU 43 (UK 9) | EU 44 (UK 10)',
      tags: ['loafers', 'shoes', 'footwear', 'suede', 'menswear'],
      rating: 4.8,
      reviewCount: 0,
      sold: 22,
      variants: makeVariants(
        'hand-stitched-suede-penny-loafers',
        ['40', '41', '42', '43', '44'],
        [
          { name: 'Snuff Brown', hex: '#6E4726' },
          { name: 'Taupe', hex: '#8B7D6B' },
        ],
        5
      ),
      specifications: new Map([
        ['Construction', 'Blake-Stitched Flex Sole'],
        ['Insole', 'Cushioned Vegetable-Tanned Calfskin'],
      ]),
      createdBy: adminUser._id,
    },
    {
      title: 'Minimal Bauhaus Mesh Dress Watch 38mm',
      slug: 'minimal-bauhaus-mesh-dress-watch-38mm',
      description:
        'Ultra-slim 6.8mm stainless steel case paired with a scratch-resistant sapphire crystal and Japanese Miyota quartz movement. Quick-release Milanese mesh strap adjusts effortlessly to any wrist.',
      images: [
        'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=900&q=80',
      ],
      price: 4490,
      category: catMap['watches-jewelry'],
      brand: 'Chrono Atelier',
      discount: 15,
      isFeatured: true,
      gender: 'unisex' as const,
      material: '316L Stainless Steel & Sapphire Crystal',
      fit: '38mm Case Diameter, 18mm Lug Width',
      careInstructions: 'Water resistant to 5 ATM. Wipe clean with microfiber cloth.',
      sizeGuide: 'One Size — Adjustable strap fits 145mm–205mm wrists',
      tags: ['watch', 'minimal', 'accessories', 'unisex', 'dress watch'],
      rating: 4.9,
      reviewCount: 0,
      sold: 36,
      variants: makeVariants(
        'minimal-bauhaus-mesh-dress-watch-38mm',
        ['One Size'],
        [
          { name: 'Brushed Silver / White Dial', hex: '#C0C0C0' },
          { name: 'Rose Gold / Charcoal Dial', hex: '#B76E79' },
        ],
        8
      ),
      specifications: new Map([
        ['Movement', 'Japanese Miyota Quartz'],
        ['Crystal', 'Domed Sapphire Crystal'],
        ['Water Resistance', '5 ATM (50 Meters)'],
      ]),
      createdBy: adminUser._id,
    },
  ];

  const products = await Product.create(productData);
  console.log(`${products.length} fashion products created`);

  // ─── Reviews ─────────────────────────────────────────────────────────────────
  const sampleComments = [
    'The fabric quality is genuinely impressive — breathable, soft on the skin, and fits true to size.',
    'Beautiful drape and stitching. Looks even more refined in person than in the photos.',
    'Ordered size M and the fit is spot on. Fast delivery within Dhaka too!',
    'Wore this all day in warm weather and stayed completely comfortable. Will order another color.',
    'Packaging was lovely and the craftsmanship feels like a much more expensive boutique label.',
  ];

  const reviewData = products.slice(0, 10).map((product, i) => ({
    userId: i % 2 === 0 ? demoUser._id : adminUser._id,
    productId: product._id,
    rating: i % 3 === 0 ? 5 : 4.5,
    comment: sampleComments[i % sampleComments.length],
  }));

  await Review.insertMany(reviewData);

  for (const product of products.slice(0, 10)) {
    const stats = await Review.aggregate([
      { $match: { productId: product._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
      await Product.findByIdAndUpdate(product._id, {
        rating: Math.round(stats[0].avg * 10) / 10,
        reviewCount: stats[0].count,
      });
    }
  }
  console.log('Reviews created');

  // ─── Sample Orders ───────────────────────────────────────────────────────────
  const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
  for (let i = 0; i < Math.min(8, products.length); i += 1) {
    const product = products[i];
    const v = product.variants?.[0];
    await Order.create({
      userId: i % 2 === 0 ? demoUser._id : adminUser._id,
      items: [
        {
          productId: product._id!,
          quantity: 1,
          price: product.price,
          title: product.title,
          image: product.images?.[0] ?? '',
          size: v?.size,
          color: v?.color,
          sku: v?.sku,
        },
      ],
      totalAmount: product.price + 80,
      deliveryCharge: 80,
      phone: '01811000000',
      shippingAddress: {
        street: `House ${12 + i}, Road 7, Gulshan`,
        city: 'Dhaka',
        country: 'Bangladesh',
        zip: '1212',
      },
      paymentMethod: 'cash_on_delivery',
      paymentStatus: i < 6 ? 'paid' : 'pending',
      orderStatus: orderStatuses[i % orderStatuses.length],
    });
  }
  console.log('Orders created');

  // ─── Delivery Zones & Sample Coupons ─────────────────────────────────────────
  await DeliveryZone.create([
    { name: 'Inside Dhaka Metro', charge: 70, estimatedDays: '1–2 business days', isActive: true },
    { name: 'Dhaka Suburbs (Gazipur, Narayanganj, Savar)', charge: 100, estimatedDays: '2–3 business days', isActive: true },
    { name: 'Outside Dhaka (Nationwide)', charge: 130, estimatedDays: '3–5 business days', isActive: true },
  ]);

  await Coupon.create([
    {
      code: 'WELCOME10',
      description: '10% off your first wardrobe order',
      type: 'percent',
      value: 10,
      minOrderAmount: 1500,
      maxUses: 500,
      usedCount: 0,
      isActive: true,
    },
    {
      code: 'FESTIVE300',
      description: 'Flat ৳300 off orders above ৳3,000',
      type: 'fixed',
      value: 300,
      minOrderAmount: 3000,
      maxUses: 200,
      usedCount: 0,
      isActive: true,
    },
  ]);
  console.log('Delivery zones and coupons created');

  console.log('\n✅ Fashion seed completed successfully!');
  console.log('Demo credentials:');
  console.log('  Admin → admin@example.com / 123456');
  console.log('  User  → user@example.com  / 123456');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

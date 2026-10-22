import { Request, Response } from 'express';
import Category from '../models/category.model';
import Product from '../models/product.model';
import Review from '../models/review.model';
import AppError from '../utils/AppError';
import asyncHandler from '../utils/asyncHandler';
import { geminiModelForChat, geminiModelTags } from '../utils/gemini';
import sendResponse from '../utils/sendResponse';

// POST /api/v1/ai/generate-description
// Body: { title, category, brand?, gender?, material?, fit?, specs? }
const generateProductDescription = asyncHandler(async (req: Request, res: Response) => {
  const { title, category, brand, gender, material, fit, specs } = req.body;
  if (!title || !category) throw new AppError('Title and category are required', 400);

  const specsText =
    specs && Array.isArray(specs) && specs.length > 0
      ? `\nAdditional details:\n${specs.map((s: string) => `- ${s}`).join('\n')}`
      : '';

  const prompt = `You are an editorial fashion copywriter for a modern clothing and accessories store.
Write a compelling, SEO-friendly product description for the following fashion piece.
The description should be 120-200 words, highlight fabric feel, silhouette/fit, and styling versatility, use bullet points for key details, and end with an understated editorial call-to-action.

Product: ${title}
Category: ${category}${brand ? `\nBrand/Label: ${brand}` : ''}${gender ? `\nCollection: ${gender}` : ''}${material ? `\nMaterial/Fabric: ${material}` : ''}${fit ? `\nFit: ${fit}` : ''}${specsText}

Format the response as:
[2-3 sentence editorial overview paragraph]

Key Details:
• [detail 1 — fabric & comfort]
• [detail 2 — cut/silhouette]
• [detail 3 — styling versatility]
• [detail 4 — craftsmanship/finish]

[1 sentence call-to-action]`;

  const result = await geminiModelTags.generateContent(prompt);
  const description = result.response.text();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Description generated successfully',
    data: { description },
  });
});

// POST /api/v1/ai/generate-tags
// Body: { title, category, gender?, material? }
const generateProductTags = asyncHandler(async (req: Request, res: Response) => {
  const { title, category, gender, material } = req.body;
  if (!title || !category) throw new AppError('Title and category are required', 400);

  const prompt = `Generate 6-8 relevant SEO tags/keywords for this fashion product.
Product: ${title}
Category: ${category}${gender ? `\nGender: ${gender}` : ''}${material ? `\nMaterial: ${material}` : ''}

Return ONLY a JSON array of lowercase strings. Example: ["linen shirt", "summer wear", "menswear"]
No explanation, just the JSON array.`;

  const result = await geminiModelTags.generateContent(prompt);
  const text = result.response.text().trim();

  let tags: string[] = [];
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) tags = JSON.parse(jsonMatch[0]);
  } catch {
    tags = text
      .replace(/["\[\]]/g, '')
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Tags generated successfully',
    data: { tags },
  });
});

// POST /api/v1/ai/smart-search
// Body: { query }
const smartSearch = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) throw new AppError('Search query is required', 400);

  const prompt = `You are a search assistant for a fashion and apparel e-commerce store.
Extract structured search filters from this natural language query.

Query: "${query}"

Return ONLY a valid JSON object with these optional fields:
{
  "search": "keyword string for text search",
  "category": "category slug or name or null",
  "brand": "brand name or null",
  "gender": "men | women | kids | unisex | null",
  "size": "XS | S | M | L | XL | XXL | Free Size | null",
  "color": "color name or null",
  "priceMin": number or null,
  "priceMax": number or null,
  "sort": "price | -price | rating | -createdAt | null"
}

No explanation, just the JSON object.`;

  const result = await geminiModelTags.generateContent(prompt);
  const text = result.response.text().trim();

  let filters: Record<string, any> = {};
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) filters = JSON.parse(jsonMatch[0]);
  } catch {
    filters = { search: query };
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Smart search filters extracted',
    data: { filters },
  });
});

// POST /api/v1/ai/summarize-reviews  (public — no auth required)
// Body: { productId }
const summarizeReviews = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.body;
  if (!productId) throw new AppError('productId is required', 400);

  const reviews = await Review.find({ productId }).populate('userId', 'name').lean();

  if (reviews.length === 0) {
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'No reviews to summarize',
      data: {
        summary: 'No customer reviews yet. Be the first to share your thoughts on fit and fabric!',
        reviewCount: 0,
      },
    });
  }

  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  const reviewLines = reviews.map((r) => `★${r.rating}/5 — "${r.comment}"`).join('\n');

  const prompt = `You are a style advisor for a fashion e-commerce store.
Analyze these ${reviews.length} customer reviews (avg rating: ${avgRating}/5) and write a concise, balanced summary (3–4 sentences) to help a shopper decide.
- Start with the overall sentiment
- Highlight what customers say about fabric quality, comfort, and sizing/fit accuracy
- Mention any notable concern if present
- End with a brief styling or sizing recommendation
Be objective, helpful, and conversational. Do NOT use bullet points.

Reviews:
${reviewLines}`;

  const result = await geminiModelTags.generateContent(prompt);
  const summary = result.response.text().trim();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review summary generated',
    data: { summary, reviewCount: reviews.length, avgRating: Number(avgRating) },
  });
});

// POST /api/v1/ai/chat  (public — no auth required)
// Body: { message, history: { role: 'user' | 'model', content: string }[] }
const chatWithAssistant = asyncHandler(async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new AppError('Message is required', 400);
  }

  // Fetch store context
  const [products, categories] = await Promise.all([
    Product.find({})
      .select('title slug price brand gender material fit rating stock discount variants')
      .populate('category', 'name')
      .limit(100)
      .lean(),
    Category.find({}).select('name slug').lean(),
  ]);

  const categoryList = categories.map((c) => c.name).join(', ');
  const productList = products
    .map((p) => {
      const catName =
        typeof p.category === 'object' && p.category !== null
          ? (p.category as any).name
          : 'Uncategorized';
      const stockStatus = p.stock === 0 ? 'OUT OF STOCK' : `${p.stock} in stock`;
      const discount = p.discount ?? 0;
      const priceStr =
        discount > 0
          ? `৳${Math.round(p.price * (1 - discount / 100))} (was ৳${p.price})`
          : `৳${p.price}`;
      const sizes = Array.from(new Set((p.variants ?? []).filter((v) => v.stock > 0).map((v) => v.size))).join('/');
      const colors = Array.from(new Set((p.variants ?? []).filter((v) => v.stock > 0).map((v) => v.color))).join(', ');
      return `- ${p.title} (/products/${p.slug}) | ${catName} | ${p.gender ?? 'unisex'} | ${priceStr}${
        p.material ? ` | ${p.material}` : ''
      }${sizes ? ` | Sizes: ${sizes}` : ''}${colors ? ` | Colors: ${colors}` : ''} | ★${p.rating}/5 | ${stockStatus}`;
    })
    .join('\n');

  const systemPrompt = `You are a friendly and knowledgeable personal stylist and shopping assistant for our modern fashion store.

Your capabilities:
- Help shoppers find clothing and accessories by occasion, season, fabric, or budget
- Answer questions about sizes, colors, fit, fabric care, and pricing
- Suggest outfit pairings and make recommendations from the catalog

Rules:
- Be concise and helpful. Keep responses under 140 words unless the customer asks for detail.
- When recommending products, mention the product name, price in ৳, available sizes/colors, and a key fabric or fit highlight.
- If a product is out of stock (stock = 0), mention that it is currently unavailable.
- Do not make up products that are not in the catalog below.
- If the customer asks about orders, returns, or delivery, let them know they can track orders or check their account page.

=== STORE CATALOG ===
Categories: ${categoryList}

Products:
${productList}
=== END CATALOG ===`;

  // Build conversation string from history (truncate to last 20 messages)
  const recentHistory = Array.isArray(history) ? history.slice(-20) : [];
  const conversationLines = recentHistory
    .map((h: { role: string; content: string }) =>
      h.role === 'user' ? `Customer: ${h.content}` : `Stylist: ${h.content}`
    )
    .join('\n');

  const fullPrompt = `${systemPrompt}\n\n${
    conversationLines ? `Conversation so far:\n${conversationLines}\n\n` : ''
  }Customer: ${message.trim()}`;

  const result = await geminiModelForChat.generateContent(fullPrompt);
  const reply = result.response.text().trim();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Chat response generated',
    data: { reply },
  });
});

export const aiControllers = {
  generateProductDescription,
  generateProductTags,
  smartSearch,
  summarizeReviews,
  chatWithAssistant,
};

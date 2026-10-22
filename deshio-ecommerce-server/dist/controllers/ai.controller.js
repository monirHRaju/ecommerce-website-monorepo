"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiControllers = void 0;
const product_model_1 = __importDefault(require("../models/product.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
const review_model_1 = __importDefault(require("../models/review.model"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const gemini_1 = require("../utils/gemini");
const gemini_2 = require("../utils/gemini");
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
// POST /api/v1/ai/generate-description
// Body: { title, category, brand?, specs? }
const generateProductDescription = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, category, brand, specs } = req.body;
    if (!title || !category)
        throw new AppError_1.default('Title and category are required', 400);
    const specsText = specs && Array.isArray(specs) && specs.length > 0
        ? `\nKey specifications:\n${specs.map((s) => `- ${s}`).join('\n')}`
        : '';
    const prompt = `You are a professional product copywriter for an electronics e-commerce store.
Write a compelling, SEO-friendly product description for the following electronics product.
The description should be 150-250 words, highlight key benefits, use bullet points for features, and end with a compelling call-to-action.

Product: ${title}
Category: ${category}${brand ? `\nBrand: ${brand}` : ''}${specsText}

Format the response as:
[2-3 sentence overview paragraph]

Key Features:
• [feature 1]
• [feature 2]
• [feature 3]
• [feature 4]
• [feature 5]

[1 sentence call-to-action]`;
    const result = yield gemini_2.geminiModelTags.generateContent(prompt);
    const description = result.response.text();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Description generated successfully',
        data: { description },
    });
}));
// POST /api/v1/ai/generate-tags
// Body: { title, category }
const generateProductTags = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, category } = req.body;
    if (!title || !category)
        throw new AppError_1.default('Title and category are required', 400);
    const prompt = `Generate 6-8 relevant SEO tags/keywords for this electronics product.
Product: ${title}
Category: ${category}

Return ONLY a JSON array of lowercase strings. Example: ["tag1", "tag2", "tag3"]
No explanation, just the JSON array.`;
    const result = yield gemini_2.geminiModelTags.generateContent(prompt);
    const text = result.response.text().trim();
    let tags = [];
    try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch)
            tags = JSON.parse(jsonMatch[0]);
    }
    catch (_a) {
        tags = text
            .replace(/["\[\]]/g, '')
            .split(',')
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean);
    }
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Tags generated successfully',
        data: { tags },
    });
}));
// POST /api/v1/ai/smart-search
// Body: { query }
const smartSearch = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query } = req.body;
    if (!query)
        throw new AppError_1.default('Search query is required', 400);
    const prompt = `You are a search assistant for an electronics e-commerce store.
Extract structured search filters from this natural language query.

Query: "${query}"

Return ONLY a valid JSON object with these optional fields:
{
  "search": "keyword string for text search",
  "category": "category name or null",
  "brand": "brand name or null",
  "priceMin": number or null,
  "priceMax": number or null,
  "sort": "price | -price | rating | -createdAt | null"
}

No explanation, just the JSON object.`;
    const result = yield gemini_2.geminiModelTags.generateContent(prompt);
    const text = result.response.text().trim();
    let filters = {};
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch)
            filters = JSON.parse(jsonMatch[0]);
    }
    catch (_a) {
        filters = { search: query };
    }
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Smart search filters extracted',
        data: { filters },
    });
}));
// POST /api/v1/ai/summarize-reviews  (public — no auth required)
// Body: { productId }
const summarizeReviews = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.body;
    if (!productId)
        throw new AppError_1.default('productId is required', 400);
    const reviews = yield review_model_1.default.find({ productId }).populate('userId', 'name').lean();
    if (reviews.length === 0) {
        return (0, sendResponse_1.default)(res, {
            statusCode: 200,
            success: true,
            message: 'No reviews to summarize',
            data: { summary: 'No customer reviews yet. Be the first to share your experience!', reviewCount: 0 },
        });
    }
    const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
    const reviewLines = reviews
        .map((r) => `★${r.rating}/5 — "${r.comment}"`)
        .join('\n');
    const prompt = `You are an AI assistant for an electronics e-commerce store.
Analyze these ${reviews.length} customer reviews (avg rating: ${avgRating}/5) and write a concise, balanced AI summary (3–4 sentences) to help a buyer decide.
- Start with the overall sentiment
- Highlight the top 2 pros customers mention
- Mention any notable concern if present
- End with a recommendation sentence
Be objective, helpful, and conversational. Do NOT use bullet points.

Reviews:
${reviewLines}`;
    const result = yield gemini_2.geminiModelTags.generateContent(prompt);
    const summary = result.response.text().trim();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Review summary generated',
        data: { summary, reviewCount: reviews.length, avgRating: Number(avgRating) },
    });
}));
// POST /api/v1/ai/chat  (public — no auth required)
// Body: { message, history: { role: 'user' | 'model', content: string }[] }
const chatWithAssistant = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
        throw new AppError_1.default('Message is required', 400);
    }
    // Fetch store context
    const [products, categories] = yield Promise.all([
        product_model_1.default.find({})
            .select('title price brand rating stock discount')
            .populate('category', 'name')
            .limit(100)
            .lean(),
        category_model_1.default.find({}).select('name slug').lean(),
    ]);
    const categoryList = categories.map((c) => c.name).join(', ');
    const productList = products
        .map((p) => {
        var _a;
        const catName = typeof p.category === 'object' && p.category !== null ? p.category.name : 'Uncategorized';
        const stockStatus = p.stock === 0 ? 'OUT OF STOCK' : `${p.stock} in stock`;
        const discount = (_a = p.discount) !== null && _a !== void 0 ? _a : 0;
        const priceStr = discount > 0 ? `৳${(p.price * (1 - discount / 100)).toFixed(2)} (was ৳${p.price})` : `৳${p.price}`;
        return `- ${p.title} | ${catName} | ${priceStr}${p.brand ? ` | ${p.brand}` : ''} | Rating: ${p.rating}/5 | ${stockStatus}`;
    })
        .join('\n');
    const systemPrompt = `You are "Deshio Assistant", a friendly and knowledgeable shopping assistant for Deshio, a modern electronics e-commerce store.

Your capabilities:
- Help customers find products by describing what they need
- Answer questions about specific products (specs, pricing, availability)
- Compare products and make recommendations
- Provide information about categories and brands available in the store

Rules:
- Be concise and helpful. Keep responses under 150 words unless the user asks for detail.
- When recommending products, mention the product name, price, and a key highlight.
- If a product is out of stock (stock = 0), mention that it is currently unavailable.
- Do not make up products that are not in the catalog below.
- Use a warm, conversational tone.
- If the user asks about orders, returns, or shipping, let them know they can check their account page or contact support.

=== STORE CATALOG ===
Categories: ${categoryList}

Products:
${productList}
=== END CATALOG ===`;
    // Build conversation string from history (truncate to last 20 messages)
    const recentHistory = Array.isArray(history) ? history.slice(-20) : [];
    const conversationLines = recentHistory
        .map((h) => h.role === 'user' ? `Customer: ${h.content}` : `Assistant: ${h.content}`)
        .join('\n');
    const fullPrompt = `${systemPrompt}\n\n${conversationLines ? `Conversation so far:\n${conversationLines}\n\n` : ''}Customer: ${message.trim()}`;
    const result = yield gemini_1.geminiModelForChat.generateContent(fullPrompt);
    const reply = result.response.text().trim();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Chat response generated',
        data: { reply },
    });
}));
exports.aiControllers = {
    generateProductDescription,
    generateProductTags,
    smartSearch,
    summarizeReviews,
    chatWithAssistant,
};

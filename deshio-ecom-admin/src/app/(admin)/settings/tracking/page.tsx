"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";

type TrackingEventKey =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Search"
  | "CompleteRegistration";

interface TrackingSettingsData {
  metaEnabled: boolean;
  metaPixelId: string;
  metaCapiEnabled: boolean;
  metaAccessToken: string;
  metaTestEventCode: string;
  hasAccessToken?: boolean;
  gaEnabled: boolean;
  gaMeasurementId: string;
  gtmContainerId: string;
  tiktokEnabled: boolean;
  tiktokPixelId: string;
  requireCookieConsent: boolean;
  consentBannerText: string;
  events: Record<TrackingEventKey, boolean>;
}

interface TrackingLogItem {
  _id: string;
  eventName: string;
  eventId: string;
  source: "browser" | "server_order" | "test";
  platform: string;
  status: "sent" | "failed" | "dry_run";
  pixelId?: string;
  eventSourceUrl?: string;
  value?: number;
  currency?: string;
  contentIds?: string[];
  orderNumber?: string;
  responseCode?: number;
  responseMessage?: string;
  fbtraceId?: string;
  createdAt: string;
}

interface TrackingLogsResponse {
  data: TrackingLogItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const EVENT_METADATA: {
  key: TrackingEventKey;
  title: string;
  description: string;
  badge: string;
}[] = [
  {
    key: "PageView",
    title: "PageView",
    description: "Fired automatically on initial page load and every Next.js route transition.",
    badge: "Browser + CAPI",
  },
  {
    key: "ViewContent",
    title: "ViewContent",
    description: "Fired when a shopper views a product detail page (includes SKU, price, and category).",
    badge: "Browser + CAPI",
  },
  {
    key: "AddToCart",
    title: "AddToCart",
    description: "Fired when a shopper adds a garment to their bag from product detail or quick-add.",
    badge: "Browser + CAPI",
  },
  {
    key: "InitiateCheckout",
    title: "InitiateCheckout",
    description: "Fired when a shopper lands on the checkout page with items in their bag.",
    badge: "Browser + CAPI",
  },
  {
    key: "AddPaymentInfo",
    title: "AddPaymentInfo",
    description: "Fired when a shopper selects a payment method or submits checkout details.",
    badge: "Browser + CAPI",
  },
  {
    key: "Purchase",
    title: "Purchase (Deduplicated)",
    description: "Fired on order creation from both Browser Pixel and Server Order Controller with shared event_id.",
    badge: "Server Order + Browser",
  },
  {
    key: "Search",
    title: "Search",
    description: "Fired when a shopper searches the catalog by keyword.",
    badge: "Browser + CAPI",
  },
  {
    key: "CompleteRegistration",
    title: "CompleteRegistration",
    description: "Fired when a new customer creates an account or is auto-registered at checkout.",
    badge: "Browser + CAPI",
  },
];

const DEFAULT_EVENTS: Record<TrackingEventKey, boolean> = {
  PageView: true,
  ViewContent: true,
  AddToCart: true,
  InitiateCheckout: true,
  AddPaymentInfo: true,
  Purchase: true,
  Search: true,
  CompleteRegistration: true,
};

export default function MarketingTrackingSettingsPage() {
  const qc = useQueryClient();

  // ── Settings state ────────────────────────────────────────────────────────
  const [metaEnabled, setMetaEnabled] = useState(true);
  const [metaPixelId, setMetaPixelId] = useState("");
  const [metaCapiEnabled, setMetaCapiEnabled] = useState(true);
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [metaTestEventCode, setMetaTestEventCode] = useState("");

  const [gaEnabled, setGaEnabled] = useState(false);
  const [gaMeasurementId, setGaMeasurementId] = useState("");
  const [gtmContainerId, setGtmContainerId] = useState("");

  const [tiktokEnabled, setTiktokEnabled] = useState(false);
  const [tiktokPixelId, setTiktokPixelId] = useState("");

  const [requireCookieConsent, setRequireCookieConsent] = useState(false);
  const [consentBannerText, setConsentBannerText] = useState(
    "We use cookies and analytics pixels to personalize your shopping experience and measure our campaigns."
  );

  const [events, setEvents] = useState<Record<TrackingEventKey, boolean>>(DEFAULT_EVENTS);

  // ── Test CAPI Event state ─────────────────────────────────────────────────
  const [testEventName, setTestEventName] = useState<TrackingEventKey>("Purchase");
  const [testPhone, setTestPhone] = useState("01712345678");
  const [testEmail, setTestEmail] = useState("customer@deshio.com");
  const [testValue, setTestValue] = useState("2490");

  // ── Logs filter & pagination ──────────────────────────────────────────────
  const [logPage, setLogPage] = useState(1);
  const [logStatus, setLogStatus] = useState<string>("");
  const [logEvent, setLogEvent] = useState<string>("");

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: trackingSettings, isLoading } = useQuery<TrackingSettingsData>({
    queryKey: ["tracking-settings"],
    queryFn: async () => {
      const res = await api.get("/settings/tracking");
      return res.data.data;
    },
  });

  const {
    data: logsResult,
    isLoading: loadingLogs,
    refetch: refetchLogs,
  } = useQuery<TrackingLogsResponse>({
    queryKey: ["tracking-logs", logPage, logStatus, logEvent],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(logPage),
        limit: "15",
      });
      if (logStatus) params.set("status", logStatus);
      if (logEvent) params.set("eventName", logEvent);
      const res = await api.get(`/settings/tracking/logs?${params.toString()}`);
      return {
        data: res.data.data || [],
        meta: res.data.meta || { page: 1, limit: 15, total: 0, totalPages: 1 },
      };
    },
  });

  useEffect(() => {
    if (trackingSettings) {
      setMetaEnabled(trackingSettings.metaEnabled ?? true);
      setMetaPixelId(trackingSettings.metaPixelId || "");
      setMetaCapiEnabled(trackingSettings.metaCapiEnabled ?? true);
      setMetaAccessToken(trackingSettings.metaAccessToken || "");
      setMetaTestEventCode(trackingSettings.metaTestEventCode || "");
      setGaEnabled(trackingSettings.gaEnabled ?? false);
      setGaMeasurementId(trackingSettings.gaMeasurementId || "");
      setGtmContainerId(trackingSettings.gtmContainerId || "");
      setTiktokEnabled(trackingSettings.tiktokEnabled ?? false);
      setTiktokPixelId(trackingSettings.tiktokPixelId || "");
      setRequireCookieConsent(trackingSettings.requireCookieConsent ?? false);
      setConsentBannerText(
        trackingSettings.consentBannerText ||
          "We use cookies and analytics pixels to personalize your shopping experience and measure our campaigns."
      );
      if (trackingSettings.events) {
        setEvents({
          ...DEFAULT_EVENTS,
          ...trackingSettings.events,
        });
      }
    }
  }, [trackingSettings]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutate: saveSettings, isPending: saving } = useMutation({
    mutationFn: async () => {
      const res = await api.patch("/settings/tracking", {
        metaEnabled,
        metaPixelId: metaPixelId.trim(),
        metaCapiEnabled,
        metaAccessToken: metaAccessToken.trim(),
        metaTestEventCode: metaTestEventCode.trim(),
        gaEnabled,
        gaMeasurementId: gaMeasurementId.trim(),
        gtmContainerId: gtmContainerId.trim(),
        tiktokEnabled,
        tiktokPixelId: tiktokPixelId.trim(),
        requireCookieConsent,
        consentBannerText: consentBannerText.trim(),
        events,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Marketing & Pixel settings saved!");
      qc.invalidateQueries({ queryKey: ["tracking-settings"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to save tracking settings");
    },
  });

  const { mutate: triggerTestEvent, isPending: sendingTest } = useMutation({
    mutationFn: async () => {
      const res = await api.post("/settings/tracking/test", {
        eventName: testEventName,
        testPhone: testPhone.trim(),
        testEmail: testEmail.trim(),
        value: Number(testValue) || 2490,
      });
      return res.data;
    },
    onSuccess: (res) => {
      const status = res?.data?.status;
      if (status === "sent") {
        toast.success(res.message || "Test event dispatched to Meta CAPI!");
      } else if (status === "dry_run") {
        toast(res.message || "Dry-Run logged (Pixel ID or Access Token not set yet)", {
          icon: "ℹ️",
        });
      } else {
        toast.error(res.message || "CAPI test failed");
      }
      qc.invalidateQueries({ queryKey: ["tracking-logs"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to send test event");
    },
  });

  const isCapiDryRun =
    !metaEnabled || !metaCapiEnabled || !metaPixelId.trim() || !metaAccessToken.trim();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Social Pixels, Meta CAPI & Server-Side Tracking
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure Meta Pixel, Conversions API (with SHA-256 user hashing &{" "}
            <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              event_id
            </code>{" "}
            deduplication), GA4, TikTok Pixel, and Cookie Consent.
          </p>
        </div>

        <button
          onClick={() => saveSettings()}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>{saving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      {/* ── Status Banner ───────────────────────────────────────────────── */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isCapiDryRun
            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200"
            : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200"
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <span
            className={`w-2.5 h-2.5 rounded-full mt-1.5 sm:mt-0 shrink-0 ${
              isCapiDryRun ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
            }`}
          />
          <div className="text-xs sm:text-sm">
            {isCapiDryRun ? (
              <>
                <span className="font-semibold">CAPI Dry-Run Mode Active:</span> Enter your Meta Pixel ID and Conversions API Access Token below and click Save Changes to dispatch live server events to{" "}
                <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50">
                  graph.facebook.com
                </code>
                . All browser & order events are currently logged below as Dry-Run for verification.
              </>
            ) : (
              <>
                <span className="font-semibold">Live Meta Pixel + CAPI Active:</span> Browser Pixel{" "}
                <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50">
                  {metaPixelId}
                </code>{" "}
                and Server-Side Conversions API are active with automatic{" "}
                <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50">
                  event_id
                </code>{" "}
                deduplication.
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Top Grid: Meta Pixel & CAPI (7 cols) + Test Event (5 cols) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Meta Pixel & Conversions API Configuration */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Meta (Facebook) Pixel & Conversions API
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Browser Pixel + Server CAPI with SHA-256 hashed phone, email, city, and fbp/fbc cookies.
              </p>
            </div>

            <label className="relative inline-flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {metaEnabled ? "Enabled" : "Disabled"}
              </span>
              <input
                type="checkbox"
                checked={metaEnabled}
                onChange={(e) => setMetaEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[22px] peer-checked:after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500" />
            </label>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Meta Pixel ID / Dataset ID
                </label>
                <input
                  type="text"
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  placeholder="e.g. 123456789012345"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-brand-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Found in Meta Events Manager → Data Sources → Settings.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Test Event Code (Optional)
                </label>
                <input
                  type="text"
                  value={metaTestEventCode}
                  onChange={(e) => setMetaTestEventCode(e.target.value)}
                  placeholder="e.g. TEST48291"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-brand-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Use during setup to inspect live server events in the Test Events tab. Clear in production.
                </p>
              </div>
            </div>

            {/* CAPI Access Token */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Conversions API System User Access Token
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={metaCapiEnabled}
                    onChange={(e) => setMetaCapiEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span>Enable Server CAPI</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type={showAccessToken ? "text" : "password"}
                  value={metaAccessToken}
                  onChange={(e) => setMetaAccessToken(e.target.value)}
                  placeholder="EAABwzLixnjYBO..."
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-4 pr-20 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowAccessToken((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700"
                >
                  {showAccessToken ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Kept strictly on the Express server — never exposed to the browser.
              </p>
            </div>
          </div>
        </div>

        {/* Send Test Server Event */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Test Server-Side CAPI Event
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Send a diagnostic event with hashed customer parameters to verify Event Match Quality.
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Event Name
                </label>
                <select
                  value={testEventName}
                  onChange={(e) => setTestEventName(e.target.value as TrackingEventKey)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white"
                >
                  <option value="Purchase">Purchase</option>
                  <option value="InitiateCheckout">InitiateCheckout</option>
                  <option value="AddToCart">AddToCart</option>
                  <option value="ViewContent">ViewContent</option>
                  <option value="PageView">PageView</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Order Value (BDT)
                </label>
                <input
                  type="number"
                  value={testValue}
                  onChange={(e) => setTestValue(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-xs sm:text-sm text-gray-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Test Phone (Hashed)
                </label>
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="01712345678"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-xs text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Test Email (Hashed)
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="customer@deshio.com"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-xs text-gray-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => triggerTestEvent()}
              disabled={sendingTest}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-brand-500 dark:hover:bg-brand-600 text-white text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              {sendingTest ? "Dispatching CAPI Event..." : `Send Test ${testEventName} Event`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Secondary Pixels: GA4 / GTM / TikTok + Cookie Consent ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Google Analytics 4 & GTM */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Google Analytics 4 & GTM
              </h3>
              <p className="text-[11px] text-gray-500">E-commerce dataLayer & gtag events</p>
            </div>
            <input
              type="checkbox"
              checked={gaEnabled}
              onChange={(e) => setGaEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                GA4 Measurement ID
              </label>
              <input
                type="text"
                value={gaMeasurementId}
                onChange={(e) => setGaMeasurementId(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-xs text-gray-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                GTM Container ID (Optional)
              </label>
              <input
                type="text"
                value={gtmContainerId}
                onChange={(e) => setGtmContainerId(e.target.value)}
                placeholder="GTM-XXXXXXX"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-xs text-gray-900 dark:text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* TikTok Pixel */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                TikTok Pixel
              </h3>
              <p className="text-[11px] text-gray-500">Browser ttq.track e-commerce events</p>
            </div>
            <input
              type="checkbox"
              checked={tiktokEnabled}
              onChange={(e) => setTiktokEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                TikTok Pixel ID
              </label>
              <input
                type="text"
                value={tiktokPixelId}
                onChange={(e) => setTiktokPixelId(e.target.value)}
                placeholder="CXXXXXXXXXXXXXXXXX"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-xs text-gray-900 dark:text-white font-mono"
              />
            </div>
            <p className="text-[11px] text-gray-400">
              Automatically mirrors ViewContent, AddToCart, InitiateCheckout, and CompletePayment.
            </p>
          </div>
        </div>

        {/* Cookie Consent Gate */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Privacy & Cookie Consent Banner
              </h3>
              <p className="text-[11px] text-gray-500">Gate browser pixels until accepted</p>
            </div>
            <input
              type="checkbox"
              checked={requireCookieConsent}
              onChange={(e) => setRequireCookieConsent(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Consent Banner Message
            </label>
            <textarea
              rows={3}
              value={consentBannerText}
              onChange={(e) => setConsentBannerText(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* ── Standard E-Commerce Event Triggers ──────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-5">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Standard E-Commerce Funnel Events
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Toggle which funnel events are dispatched by the storefront and server Conversions API.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EVENT_METADATA.map((ev) => {
            const isChecked = events[ev.key] ?? true;
            return (
              <label
                key={ev.key}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 cursor-pointer transition-colors ${
                  isChecked
                    ? "border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30"
                    : "border-gray-200/50 dark:border-gray-800/40 opacity-60"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                      {ev.title}
                    </span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setEvents((prev) => ({ ...prev, [ev.key]: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    {ev.description}
                  </p>
                </div>
                <span className="inline-block self-start text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400">
                  {ev.badge}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── Server CAPI Event Delivery & Deduplication Logs ─────────────── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Conversions API (CAPI) Event Logs
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Audit trail of server-side events, deduplication{" "}
              <code className="font-mono">event_id</code>s, and Meta Graph API responses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={logEvent}
              onChange={(e) => {
                setLogEvent(e.target.value);
                setLogPage(1);
              }}
              className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200"
            >
              <option value="">All Events</option>
              <option value="Purchase">Purchase</option>
              <option value="InitiateCheckout">InitiateCheckout</option>
              <option value="AddToCart">AddToCart</option>
              <option value="ViewContent">ViewContent</option>
              <option value="PageView">PageView</option>
            </select>

            <select
              value={logStatus}
              onChange={(e) => {
                setLogStatus(e.target.value);
                setLogPage(1);
              }}
              className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent (200)</option>
              <option value="dry_run">Dry-Run</option>
              <option value="failed">Failed</option>
            </select>

            <button
              type="button"
              onClick={() => refetchLogs()}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>

        {loadingLogs ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading CAPI logs...</div>
        ) : !logsResult?.data?.length ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No tracking events logged yet. Click &ldquo;Send Test Purchase Event&rdquo; above or browse the storefront.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Event</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3">Event ID (Deduplication)</th>
                  <th className="py-3 px-3">Value / Items</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Graph API Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                {logsResult.data.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                    <td className="py-3 px-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono font-semibold text-gray-900 dark:text-white">
                      {log.eventName}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                        {log.source}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-gray-500 max-w-[180px] truncate" title={log.eventId}>
                      {log.eventId}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {log.value !== undefined ? `${log.currency || "BDT"} ${log.value}` : "-"}
                      {log.orderNumber ? ` (#${log.orderNumber})` : ""}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {log.status === "sent" && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Sent
                        </span>
                      )}
                      {log.status === "dry_run" && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          Dry-Run
                        </span>
                      )}
                      {log.status === "failed" && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-500 dark:text-gray-400 max-w-xs truncate" title={log.responseMessage}>
                      {log.responseMessage || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {logsResult && logsResult.meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
            <span>
              Page {logsResult.meta.page} of {logsResult.meta.totalPages} ({logsResult.meta.total} total logs)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={logPage <= 1}
                onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={logPage >= logsResult.meta.totalPages}
                onClick={() => setLogPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { SiteSettings } from "@/types";

// Helper to normalize WhatsApp URL for testing
function formatWhatsAppUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  // Strip non-digits
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  // If Bangladesh local 01..., prepend 88
  if (digits.length === 11 && digits.startsWith("01")) {
    return `https://wa.me/88${digits}`;
  }
  return `https://wa.me/${digits}`;
}

// Helper to normalize Messenger URL for testing
function formatMessengerUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const clean = trimmed.replace(/^[@/]+/, "").replace(/^m\.me\//i, "");
  return `https://m.me/${clean}`;
}

export default function CustomerSupportSettingsPage() {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["support-settings"],
    queryFn: async () => {
      const res = await api.get("/settings/seo");
      return res.data.data;
    },
    staleTime: 60_000,
  });

  const [whatsappSupport, setWhatsappSupport] = useState("");
  const [messengerSupport, setMessengerSupport] = useState("");
  const [showFloatingSupport, setShowFloatingSupport] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setWhatsappSupport(
        settings.whatsappSupport ||
          settings.socialLinks?.whatsapp ||
          "+880 1700-000000"
      );
      setMessengerSupport(
        settings.messengerSupport ||
          settings.socialLinks?.messenger ||
          "https://m.me/deshio"
      );
      setShowFloatingSupport(
        settings.showFloatingSupport !== undefined
          ? settings.showFloatingSupport
          : true
      );
    }
  }, [settings]);

  const testWhatsAppUrl = useMemo(
    () => formatWhatsAppUrl(whatsappSupport),
    [whatsappSupport]
  );
  const testMessengerUrl = useMemo(
    () => formatMessengerUrl(messengerSupport),
    [messengerSupport]
  );

  const { mutate: saveSettings, isPending: saving } = useMutation({
    mutationFn: async () => {
      const payload = {
        whatsappSupport: whatsappSupport.trim(),
        messengerSupport: messengerSupport.trim(),
        showFloatingSupport,
        socialLinks: {
          ...(settings?.socialLinks || {}),
          whatsapp: whatsappSupport.trim(),
          messenger: messengerSupport.trim(),
        },
      };
      const res = await api.patch("/settings/seo", payload);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Customer support direct links saved successfully!");
      qc.invalidateQueries({ queryKey: ["support-settings"] });
      qc.invalidateQueries({ queryKey: ["seo-settings"] });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update support settings"
      );
    },
  });

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
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                />
              </svg>
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Customer Support & Direct Social Links
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure direct WhatsApp & Facebook Messenger links for the bottom-right floating support widget on your storefront.
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
          <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Form (7 cols) ──────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Visibility Toggle */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Floating Customer Support Widget
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Display the interactive floating button in the bottom-right corner of the storefront.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showFloatingSupport}
                onChange={(e) => setShowFloatingSupport(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500" />
            </label>
          </div>

          {/* WhatsApp Direct Link Input */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-xs">
                  {/* WhatsApp SVG */}
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    WhatsApp Support Direct Link
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Phone number or custom WhatsApp link
                  </p>
                </div>
              </div>

              {testWhatsAppUrl && (
                <a
                  href={testWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100 transition-colors"
                >
                  <span>Test Link</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                WhatsApp Number or Link
              </label>
              <input
                type="text"
                value={whatsappSupport}
                onChange={(e) => setWhatsappSupport(e.target.value)}
                placeholder="+8801700000000 or https://wa.me/8801700000000"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                You can enter your phone number (e.g. <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[11px]">+8801700000000</code> or <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[11px]">01700000000</code>) or a direct <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[11px]">https://wa.me/...</code> link.
              </p>
            </div>

            {testWhatsAppUrl && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 text-xs">
                <span className="text-gray-400">Target URL: </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 break-all">
                  {testWhatsAppUrl}
                </span>
              </div>
            )}
          </div>

          {/* Messenger Direct Link Input */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0084FF] to-[#00B2FF] flex items-center justify-center text-white shadow-xs">
                  {/* Messenger SVG */}
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.093.304 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.963 3.13 3.259 5.889-3.259-6.56 6.963z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Facebook Messenger Direct Link
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Page username or custom Messenger link
                  </p>
                </div>
              </div>

              {testMessengerUrl && (
                <a
                  href={testMessengerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  <span>Test Link</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                Facebook Page Username or Messenger Link
              </label>
              <input
                type="text"
                value={messengerSupport}
                onChange={(e) => setMessengerSupport(e.target.value)}
                placeholder="e.g. deshio or https://m.me/deshio"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-brand-500"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                You can enter your Facebook Page username (e.g. <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[11px]">deshio</code>) or full URL (<code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[11px]">https://m.me/deshio</code>).
              </p>
            </div>

            {testMessengerUrl && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 text-xs">
                <span className="text-gray-400">Target URL: </span>
                <span className="font-mono text-blue-600 dark:text-blue-400 break-all">
                  {testMessengerUrl}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Interactive Preview (5 cols) ──────────────── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Storefront Live Simulation
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                Interactive Preview
              </span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Hover or click the floating support button below to see how customer direct chat options expand on the storefront.
            </p>

            {/* Visual simulation box */}
            <div className="relative h-80 rounded-xl bg-stone-100 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 overflow-hidden flex flex-col justify-between p-4">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Deshio Storefront Browser Mockup</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="space-y-2 opacity-40">
                <div className="h-4 bg-gray-300 dark:bg-gray-800 rounded-md w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-md w-1/2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-md w-2/3" />
              </div>

              {/* Floating Widget Simulation */}
              {showFloatingSupport ? (
                <div
                  className="absolute bottom-4 right-4 flex flex-col items-end gap-3"
                  onMouseEnter={() => setPreviewOpen(true)}
                  onMouseLeave={() => setPreviewOpen(false)}
                >
                  {/* Expanded Items */}
                  {previewOpen && (
                    <div className="flex flex-col items-end gap-2.5 animate-fadeIn">
                      {/* WhatsApp option */}
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 shadow-md text-[11px] font-semibold text-gray-800 dark:text-white border border-gray-100 dark:border-gray-700">
                          Chat on WhatsApp
                        </span>
                        <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                          </svg>
                        </div>
                      </div>

                      {/* Messenger option */}
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 shadow-md text-[11px] font-semibold text-gray-800 dark:text-white border border-gray-100 dark:border-gray-700">
                          Chat on Messenger
                        </span>
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#0084FF] to-[#00B2FF] text-white flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                            <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.093.304 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.963 3.13 3.259 5.889-3.259-6.56 6.963z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Main Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(!previewOpen)}
                    className="flex items-center gap-2 px-4 py-3 rounded-full bg-stone-900 text-white shadow-xl hover:bg-stone-800 transition-all cursor-pointer"
                  >
                    {previewOpen ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <>
                        <div className="relative">
                          <svg className="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                        <span className="text-xs font-semibold tracking-wide">
                          Support
                        </span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-gray-400">
                  Support widget is currently disabled
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong>Admin Tip:</strong> When customers click on WhatsApp or Messenger icons, their native app or chat window will open automatically with your official support channel.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

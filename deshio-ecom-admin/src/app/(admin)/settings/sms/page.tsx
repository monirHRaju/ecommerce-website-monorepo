"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";

type SmsEventKey =
  | "account_created"
  | "order_placed"
  | "order_processing"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled";

interface SmsEventConfig {
  enabled: boolean;
  template: string;
}

interface SmsSettingsData {
  enabled: boolean;
  apiKey: string;
  senderId: string;
  adminAlertPhone?: string;
  hasApiKey?: boolean;
  events: Record<SmsEventKey, SmsEventConfig>;
  defaultTemplates: Record<SmsEventKey, string>;
}

interface SmsLogItem {
  _id: string;
  to: string;
  message: string;
  event: string;
  status: "sent" | "failed" | "dry_run";
  providerCode?: number;
  providerMessage?: string;
  createdAt: string;
}

interface SmsLogsResponse {
  data: SmsLogItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const EVENT_METADATA: {
  key: SmsEventKey;
  title: string;
  description: string;
  placeholders: string[];
}[] = [
  {
    key: "account_created",
    title: "Auto-Account Created (Guest Checkout)",
    description:
      "Sent when a new customer places an order without logging in and an account is automatically created.",
    placeholders: ["{siteName}", "{name}", "{phone}", "{password}", "{loginUrl}"],
  },
  {
    key: "order_placed",
    title: "Order Confirmed / Placed",
    description: "Sent immediately when a customer places a new order.",
    placeholders: ["{siteName}", "{name}", "{orderNumber}", "{total}", "{trackUrl}"],
  },
  {
    key: "order_processing",
    title: "Order Processing",
    description: "Sent when an admin updates an order status to Processing.",
    placeholders: ["{siteName}", "{name}", "{orderNumber}", "{total}", "{status}"],
  },
  {
    key: "order_shipped",
    title: "Order Shipped",
    description: "Sent when an admin updates an order status to Shipped.",
    placeholders: ["{siteName}", "{name}", "{orderNumber}", "{total}", "{status}"],
  },
  {
    key: "order_delivered",
    title: "Order Delivered",
    description: "Sent when an admin marks an order as Delivered.",
    placeholders: ["{siteName}", "{name}", "{orderNumber}", "{total}", "{status}"],
  },
  {
    key: "order_cancelled",
    title: "Order Cancelled",
    description: "Sent when an order is cancelled by the customer or admin.",
    placeholders: ["{siteName}", "{name}", "{orderNumber}", "{total}", "{status}"],
  },
];

const FALLBACK_TEMPLATES: Record<SmsEventKey, string> = {
  account_created:
    "Welcome to {siteName}! Your Login ID: {phone}, Password: {password}. Sign in at {loginUrl}",
  order_placed:
    "{siteName}: Hi {name}, your order #{orderNumber} (Tk {total}) is confirmed! Track at {trackUrl}",
  order_processing:
    "{siteName}: Your order #{orderNumber} is now being processed and prepared for dispatch.",
  order_shipped:
    "{siteName}: Great news! Your order #{orderNumber} has been shipped and is on its way.",
  order_delivered:
    "{siteName}: Your order #{orderNumber} has been delivered. Thank you for shopping with us!",
  order_cancelled: "{siteName}: Your order #{orderNumber} has been cancelled.",
};

export default function SmsGatewaySettingsPage() {
  const qc = useQueryClient();

  // ── Settings state ────────────────────────────────────────────────────────
  const [enabled, setEnabled] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [senderId, setSenderId] = useState("");
  const [adminAlertPhone, setAdminAlertPhone] = useState("");
  const [events, setEvents] = useState<Record<SmsEventKey, SmsEventConfig>>({
    account_created: { enabled: true, template: FALLBACK_TEMPLATES.account_created },
    order_placed: { enabled: true, template: FALLBACK_TEMPLATES.order_placed },
    order_processing: { enabled: true, template: FALLBACK_TEMPLATES.order_processing },
    order_shipped: { enabled: true, template: FALLBACK_TEMPLATES.order_shipped },
    order_delivered: { enabled: true, template: FALLBACK_TEMPLATES.order_delivered },
    order_cancelled: { enabled: true, template: FALLBACK_TEMPLATES.order_cancelled },
  });

  // ── Test SMS state ────────────────────────────────────────────────────────
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(
    "Deshio Test SMS: Your BulkSMSBD gateway integration is working!"
  );

  // ── Logs filter & pagination ──────────────────────────────────────────────
  const [logPage, setLogPage] = useState(1);
  const [logStatus, setLogStatus] = useState<string>("");

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: smsSettings, isLoading } = useQuery<SmsSettingsData>({
    queryKey: ["sms-settings"],
    queryFn: async () => {
      const res = await api.get("/settings/sms");
      return res.data.data;
    },
  });

  const {
    data: balanceData,
    isFetching: checkingBalance,
    refetch: refetchBalance,
  } = useQuery<{ success: boolean; balance?: string | number; message?: string }>({
    queryKey: ["sms-balance"],
    queryFn: async () => {
      const res = await api.get("/settings/sms/balance");
      return res.data.data;
    },
    enabled: false,
  });

  const {
    data: logsResult,
    isLoading: loadingLogs,
    refetch: refetchLogs,
  } = useQuery<SmsLogsResponse>({
    queryKey: ["sms-logs", logPage, logStatus],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(logPage),
        limit: "15",
      });
      if (logStatus) params.set("status", logStatus);
      const res = await api.get(`/settings/sms/logs?${params.toString()}`);
      return {
        data: res.data.data || [],
        meta: res.data.meta || { page: 1, limit: 15, total: 0, totalPages: 1 },
      };
    },
  });

  useEffect(() => {
    if (smsSettings) {
      setEnabled(smsSettings.enabled ?? true);
      setApiKey(smsSettings.apiKey || "");
      setSenderId(smsSettings.senderId || "");
      setAdminAlertPhone(smsSettings.adminAlertPhone || "");
      if (smsSettings.events) {
        setEvents({
          account_created: {
            enabled: smsSettings.events.account_created?.enabled ?? true,
            template:
              smsSettings.events.account_created?.template ||
              FALLBACK_TEMPLATES.account_created,
          },
          order_placed: {
            enabled: smsSettings.events.order_placed?.enabled ?? true,
            template:
              smsSettings.events.order_placed?.template ||
              FALLBACK_TEMPLATES.order_placed,
          },
          order_processing: {
            enabled: smsSettings.events.order_processing?.enabled ?? true,
            template:
              smsSettings.events.order_processing?.template ||
              FALLBACK_TEMPLATES.order_processing,
          },
          order_shipped: {
            enabled: smsSettings.events.order_shipped?.enabled ?? true,
            template:
              smsSettings.events.order_shipped?.template ||
              FALLBACK_TEMPLATES.order_shipped,
          },
          order_delivered: {
            enabled: smsSettings.events.order_delivered?.enabled ?? true,
            template:
              smsSettings.events.order_delivered?.template ||
              FALLBACK_TEMPLATES.order_delivered,
          },
          order_cancelled: {
            enabled: smsSettings.events.order_cancelled?.enabled ?? true,
            template:
              smsSettings.events.order_cancelled?.template ||
              FALLBACK_TEMPLATES.order_cancelled,
          },
        });
      }
    }
  }, [smsSettings]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutate: saveSettings, isPending: saving } = useMutation({
    mutationFn: async () => {
      const res = await api.patch("/settings/sms", {
        enabled,
        apiKey: apiKey.trim(),
        senderId: senderId.trim(),
        adminAlertPhone: adminAlertPhone.trim(),
        events,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("SMS Gateway settings saved!");
      qc.invalidateQueries({ queryKey: ["sms-settings"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to save SMS settings");
    },
  });

  const { mutate: triggerTestSms, isPending: sendingTest } = useMutation({
    mutationFn: async () => {
      const res = await api.post("/settings/sms/test", {
        to: testPhone.trim(),
        message: testMessage.trim(),
      });
      return res.data;
    },
    onSuccess: (res) => {
      const status = res?.data?.status;
      if (status === "sent") {
        toast.success(res.message || "Test SMS sent via BulkSMSBD!");
      } else if (status === "dry_run") {
        toast(res.message || "Dry-Run logged (credentials not configured yet)", {
          icon: "ℹ️",
        });
      } else {
        toast.error(res.message || "SMS failed to send");
      }
      qc.invalidateQueries({ queryKey: ["sms-logs"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to send test SMS");
    },
  });

  const handleCheckBalance = async () => {
    const res = await refetchBalance();
    if (res.data?.success) {
      toast.success(`BulkSMSBD Balance: ${res.data.balance}`);
    } else {
      toast.error(res.data?.message || "Could not check balance. Save your API Key first.");
    }
  };

  const handleEventToggle = (key: SmsEventKey, val: boolean) => {
    setEvents((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: val },
    }));
  };

  const handleEventTemplateChange = (key: SmsEventKey, val: string) => {
    setEvents((prev) => ({
      ...prev,
      [key]: { ...prev[key], template: val },
    }));
  };

  const handleResetTemplate = (key: SmsEventKey) => {
    const defaultTpl =
      smsSettings?.defaultTemplates?.[key] || FALLBACK_TEMPLATES[key];
    handleEventTemplateChange(key, defaultTpl);
    toast.success("Template reset to default (click Save Changes to persist)");
  };

  const isDryRunMode = !enabled || !apiKey.trim() || !senderId.trim();

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
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              BulkSMSBD Gateway & Automated SMS
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure your{" "}
            <a
              href="https://bulksmsbd.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 underline hover:text-brand-600"
            >
              bulksmsbd.net
            </a>{" "}
            API credentials, customize automated SMS templates, and inspect delivery logs.
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

      {/* ── Dry-Run / Live Status Banner ────────────────────────────────── */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDryRunMode
            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200"
            : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200"
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <span
            className={`w-2.5 h-2.5 rounded-full mt-1.5 sm:mt-0 shrink-0 ${
              isDryRunMode ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
            }`}
          />
          <div className="text-xs sm:text-sm">
            {isDryRunMode ? (
              <>
                <span className="font-semibold">Dry-Run Mode Active:</span>{" "}
                {!enabled
                  ? "SMS Gateway is currently disabled."
                  : "Enter your BulkSMSBD API Key and Sender ID below and click Save Changes to go live. Until then, all SMS events are safely recorded in the logs below as Dry-Run."}
              </>
            ) : (
              <>
                <span className="font-semibold">Live Gateway Active:</span> SMS notifications will be dispatched automatically via{" "}
                <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50">
                  https://bulksmsbd.net/api/smsapi
                </code>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Top Grid: Gateway Credentials (7 cols) + Test SMS (5 cols) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Gateway Configuration */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                BulkSMSBD Credentials
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Endpoint:{" "}
                <code className="text-[11px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                  https://bulksmsbd.net/api/smsapi
                </code>
              </p>
            </div>

            <label className="relative inline-flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {enabled ? "Enabled" : "Disabled"}
              </span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[22px] peer-checked:after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500" />
            </label>
          </div>

          <div className="space-y-4">
            {/* API Key */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  BulkSMSBD API Key (`api_key`)
                </label>
                <button
                  type="button"
                  onClick={handleCheckBalance}
                  disabled={checkingBalance}
                  className="text-xs font-semibold text-brand-500 hover:text-brand-600 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {checkingBalance ? "Checking..." : "Check Account Balance"}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your BulkSMSBD API Key..."
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-4 pr-20 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700"
                >
                  {showApiKey ? "Hide" : "Show"}
                </button>
              </div>
              {balanceData && (
                <p
                  className={`text-xs mt-1.5 font-medium ${
                    balanceData.success ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                  }`}
                >
                  {balanceData.success
                    ? `Available Balance: ${balanceData.balance}`
                    : balanceData.message}
                </p>
              )}
            </div>

            {/* Sender ID + Admin Alert Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Approved Sender ID (`senderid`)
                </label>
                <input
                  type="text"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  placeholder="e.g. 8809617611000 or DESHIO"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-brand-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Non-masking (e.g. 88096...) or Masking ID approved in your BulkSMSBD portal.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                  Admin Order Alert Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={adminAlertPhone}
                  onChange={(e) => setAdminAlertPhone(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white font-mono focus:outline-brand-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  If set, receives an instant SMS alert whenever a new order is placed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Send Test SMS */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Send Test SMS
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Verify your gateway configuration or test Dry-Run logging.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                Recipient Phone Number
              </label>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white font-mono focus:outline-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                Message
              </label>
              <textarea
                rows={3}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-brand-500"
              />
            </div>

            <button
              type="button"
              onClick={() => triggerTestSms()}
              disabled={sendingTest || !testPhone.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-brand-500 dark:hover:bg-brand-600 text-white text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              {sendingTest ? "Sending Test SMS..." : "Send Test SMS"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Automated Event Triggers & Templates ────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Automated SMS Event Triggers & Templates
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enable or disable individual lifecycle events and customize the message template sent to customers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EVENT_METADATA.map((item) => {
            const cfg = events[item.key];
            return (
              <div
                key={item.key}
                className={`p-5 rounded-xl border transition-colors space-y-3 ${
                  cfg?.enabled
                    ? "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30"
                    : "border-gray-200/60 dark:border-gray-800/40 bg-gray-100/40 dark:bg-gray-900/40 opacity-75"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={cfg?.enabled ?? true}
                    onChange={(e) => handleEventToggle(item.key, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 mt-1 cursor-pointer"
                  />
                </div>

                <div>
                  <textarea
                    rows={3}
                    value={cfg?.template || ""}
                    onChange={(e) => handleEventTemplateChange(item.key, e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-xs text-gray-900 dark:text-white font-mono focus:outline-brand-500"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold mr-1">
                      Variables:
                    </span>
                    {item.placeholders.map((ph) => (
                      <button
                        key={ph}
                        type="button"
                        onClick={() =>
                          handleEventTemplateChange(
                            item.key,
                            `${cfg?.template || ""} ${ph}`.trim()
                          )
                        }
                        title="Click to append variable"
                        className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-gray-200/70 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors cursor-pointer"
                      >
                        {ph}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleResetTemplate(item.key)}
                    className="text-[11px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline cursor-pointer"
                  >
                    Reset Default
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recent SMS Delivery Logs ────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              SMS Delivery & Dry-Run Logs
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Audit trail of all outgoing SMS notifications and BulkSMSBD response codes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={logStatus}
              onChange={(e) => {
                setLogStatus(e.target.value);
                setLogPage(1);
              }}
              className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent (202)</option>
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
          <div className="py-12 text-center text-xs text-gray-400">Loading SMS logs...</div>
        ) : !logsResult?.data?.length ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No SMS logs recorded yet. Send a test SMS or place an order to see logs here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Recipient</th>
                  <th className="py-3 px-3">Event</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Message</th>
                  <th className="py-3 px-3">Gateway Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                {logsResult.data.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                    <td className="py-3 px-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-900 dark:text-white whitespace-nowrap">
                      {log.to}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                        {log.event}
                      </span>
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
                    <td className="py-3 px-3 max-w-md text-gray-700 dark:text-gray-300 break-words">
                      {log.message}
                    </td>
                    <td className="py-3 px-3 text-gray-500 dark:text-gray-400 max-w-xs">
                      {log.providerCode ? `[${log.providerCode}] ` : ""}
                      {log.providerMessage || "-"}
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

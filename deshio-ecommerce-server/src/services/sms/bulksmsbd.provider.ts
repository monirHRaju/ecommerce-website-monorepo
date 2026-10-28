/**
 * BulkSMSBD Gateway Provider (https://bulksmsbd.net/api/smsapi)
 */

export interface BulkSmsSendParams {
  apiKey: string;
  senderId: string;
  number: string; // 8801XXXXXXXXX
  message: string;
}

export interface BulkSmsResult {
  success: boolean;
  code: number;
  message: string;
  raw?: unknown;
}

const BULKSMSBD_CODE_MESSAGES: Record<number, string> = {
  202: 'SMS Submitted Successfully',
  1001: 'Invalid Mobile Number',
  1002: 'Sender ID is not correct or disabled',
  1003: 'Required fields missing (API Key, Sender ID, Number, or Message)',
  1005: 'BulkSMSBD Internal Error',
  1006: 'Balance Validity Not Available',
  1007: 'Insufficient SMS Balance',
  1011: 'User ID not found',
  1012: 'Masking SMS must be sent in Bengali',
  1013: 'Sender ID has not found Gateway by API key',
  1014: 'Sender Type Name not found using this sender by API key',
  1015: 'Sender ID has not found Any Valid Gateway by API key',
  1016: 'Sender Type Name Active Price Info not found by this sender id',
  1017: 'Sender Type Name Price Info not found by this sender id',
  1018: 'The Owner of this Account is disabled',
  1019: 'The Price of this therapy is disabled',
  1020: 'The parent of this account is not found',
  1021: 'The parent active price of this account is not found',
};

export function describeBulkSmsCode(code: number, fallback?: string): string {
  return BULKSMSBD_CODE_MESSAGES[code] || fallback || `Gateway response code ${code}`;
}

async function postOnce(params: BulkSmsSendParams): Promise<BulkSmsResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const body = new URLSearchParams({
      api_key: params.apiKey,
      senderid: params.senderId,
      number: params.number,
      message: params.message,
    });

    const res = await fetch('https://bulksmsbd.net/api/smsapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
      signal: controller.signal,
    });

    const text = await res.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Non-JSON response fallback
    }

    const code = Number(parsed?.response_code ?? (text.includes('202') ? 202 : res.status));
    const success = code === 202;
    const message = describeBulkSmsCode(
      code,
      parsed?.error_message || parsed?.success_message || text.slice(0, 200)
    );

    return {
      success,
      code,
      message,
      raw: parsed ?? text,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Sends an SMS via BulkSMSBD with 1 automatic retry on transient network error.
 */
export async function sendBulkSmsBd(params: BulkSmsSendParams): Promise<BulkSmsResult> {
  try {
    return await postOnce(params);
  } catch (firstErr: any) {
    try {
      return await postOnce(params);
    } catch (secondErr: any) {
      return {
        success: false,
        code: 0,
        message: secondErr?.message || firstErr?.message || 'Network error contacting BulkSMSBD',
      };
    }
  }
}

/**
 * Checks account balance on BulkSMSBD: https://bulksmsbd.net/api/getBalanceApi?api_key=...
 */
export async function getBulkSmsBalance(
  apiKey: string
): Promise<{ success: boolean; balance?: string | number; message?: string }> {
  if (!apiKey) {
    return { success: false, message: 'API key is not configured' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const url = `https://bulksmsbd.net/api/getBalanceApi?api_key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { signal: controller.signal });
    const text = await res.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // plain text balance fallback
    }

    if (parsed && parsed.balance !== undefined) {
      return { success: true, balance: parsed.balance };
    }
    if (parsed && parsed.response_code && parsed.response_code !== 202) {
      return {
        success: false,
        message: describeBulkSmsCode(Number(parsed.response_code), parsed.error_message),
      };
    }
    return { success: true, balance: text.trim() };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to fetch SMS balance' };
  } finally {
    clearTimeout(timeout);
  }
}

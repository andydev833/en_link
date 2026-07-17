// ============================================================
// GAS API クライアント — En Link
// ============================================================
// GASはCORS対応のため text/plain で返す仕様。
// フロントは Content-Type: text/plain で送信し、no-cors を避けて
// GAS側で適切なCORSヘッダーを返してもらう。
// ============================================================

export interface GasResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const GAS_API_URL = import.meta.env.VITE_GAS_API_URL;

/**
 * GAS Web App にリクエストを送る汎用クライアント。
 * action + payload 形式で POST する。
 */
export async function callGas<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<GasResponse<T>> {
  if (!GAS_API_URL) {
    console.warn('[GAS] VITE_GAS_API_URL が未設定です。ダミーデータで動作します。');
    return { success: false, error: 'GAS_URL_NOT_SET' };
  }

  try {
    const body = JSON.stringify({ action, payload });

    const res = await fetch(GAS_API_URL, {
      method: 'POST',
      // GAS CORS対策: text/plain を使う
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const text = await res.text();
    try {
      return JSON.parse(text) as GasResponse<T>;
    } catch {
      // GASが文字列を返した場合
      return { success: true, data: text as unknown as T };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[GAS] action=${action} error:`, message);
    return { success: false, error: message };
  }
}

/**
 * GAS_API_URL が設定されているかチェック
 */
export function isGasConfigured(): boolean {
  return Boolean(GAS_API_URL);
}

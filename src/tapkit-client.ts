/**
 * TapKit API Client
 * Wraps the TapKit REST API for use by the MCP server
 */

const TAPKIT_API_URL = process.env.TAPKIT_API_URL || 'https://api.tapkit.ai/v1';

export interface Phone {
  id: string;
  name: string;
  unique_id: string;
  phone_number: string | null;
  width?: number;
  height?: number;
}

export interface PhoneInfo {
  width: number;
  height: number;
  name: string;
}

export interface TapResult {
  success: boolean;
  job_id?: string;
}

export interface TapKitError {
  error: string;
  message: string;
}

const MAX_LONG_EDGE = 1344;

export interface ScreenScaling {
  nativeWidth: number;
  nativeHeight: number;
  scaledWidth: number;
  scaledHeight: number;
  scaleFactor: number; // scaledWidth / nativeWidth — always <= 1
}

export class TapKitClient {
  private authToken: string;
  private phoneId: string | null = null;
  private scaling: ScreenScaling | null = null;

  constructor(authToken: string) {
    this.authToken = authToken;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${TAPKIT_API_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (fetchError) {
      // Network error or fetch failed
      throw new TapKitAPIError(
        0,
        'NETWORK_ERROR',
        fetchError instanceof Error ? fetchError.message : 'Network request failed'
      );
    }

    if (!response.ok) {
      let errorCode = 'UNKNOWN_ERROR';
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const responseBody = await response.json();
        // Handle jootsing-server's {"detail": {"error": "...", "message": "..."}} format
        const errorData = responseBody.detail || responseBody;
        if (errorData.error) errorCode = errorData.error;
        if (errorData.message) errorMessage = errorData.message;
      } catch {
        // Response wasn't JSON, use defaults
      }

      throw new TapKitAPIError(response.status, errorCode, errorMessage);
    }

    // Handle screenshot endpoint which returns binary
    if (endpoint.includes('/screenshot')) {
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer) as unknown as T;
    }

    return response.json();
  }

  /**
   * Set the phone ID to use for all operations
   */
  setPhoneId(phoneId: string): void {
    this.phoneId = phoneId;
  }

  /**
   * Compute and store screen scaling for a phone's native dimensions.
   * Caps the longest edge at MAX_LONG_EDGE (1344px) so the model
   * reasons in the same coordinate space as the image it sees.
   */
  setScreenDimensions(nativeWidth: number, nativeHeight: number): void {
    const longest = Math.max(nativeWidth, nativeHeight);
    const scaleFactor = Math.min(1.0, MAX_LONG_EDGE / longest);
    this.scaling = {
      nativeWidth,
      nativeHeight,
      scaledWidth: Math.round(nativeWidth * scaleFactor),
      scaledHeight: Math.round(nativeHeight * scaleFactor),
      scaleFactor,
    };
  }

  /**
   * Get the current screen scaling (null if no phone selected yet)
   */
  getScaling(): ScreenScaling | null {
    return this.scaling;
  }

  /**
   * Convert model coordinates (scaled space) to native phone coordinates.
   */
  toNative(x: number, y: number): { x: number; y: number } {
    if (!this.scaling) return { x, y };
    return {
      x: Math.round(x / this.scaling.scaleFactor),
      y: Math.round(y / this.scaling.scaleFactor),
    };
  }

  /**
   * Get the current phone ID (without resolving)
   */
  async getPhoneId(): Promise<string> {
    if (this.phoneId) {
      return this.phoneId;
    }
    throw new TapKitAPIError(
      400,
      'NO_PHONE_SELECTED',
      'No phone selected. Use select_phone or pass phone_id.'
    );
  }

  /**
   * Resolve a phone for use: accepts optional phoneId override,
   * falls back to stored selection, auto-selects if only one phone.
   * Also initializes scaling if not yet set.
   */
  async resolvePhone(phoneId?: string): Promise<string> {
    // Explicit phone_id passed — select it
    if (phoneId) {
      this.phoneId = phoneId;
      if (!this.scaling) {
        try {
          const info = await this.getPhoneInfo(phoneId);
          this.setScreenDimensions(info.width, info.height);
        } catch {
          // Scaling unavailable — continue without it
        }
      }
      return phoneId;
    }

    // Already selected
    if (this.phoneId) {
      return this.phoneId;
    }

    // Auto-select: fetch phones
    const phones = await this.listPhones();
    if (phones.length === 0) {
      throw new TapKitAPIError(
        404,
        'NO_PHONES_CONNECTED',
        'No phones are connected. Please ensure TapKit is running and a phone is connected.'
      );
    }

    if (phones.length === 1) {
      const phone = phones[0];
      this.phoneId = phone.id;
      if (phone.width && phone.height) {
        this.setScreenDimensions(phone.width, phone.height);
      }
      return phone.id;
    }

    // Multiple phones — require explicit selection
    const phoneList = phones.map(p => `${p.name} (ID: ${p.id})`).join(', ');
    throw new TapKitAPIError(
      400,
      'NO_PHONE_SELECTED',
      `Multiple phones connected. Pass phone_id or use select_phone. Available: ${phoneList}`
    );
  }

  /**
   * List all connected phones, enriched with screen dimensions
   */
  async listPhones(): Promise<Phone[]> {
    const phones = await this.request<Phone[]>('GET', '/phones');
    // Fetch dimensions for each phone (same pattern as Python SDK)
    await Promise.all(
      phones.map(async (phone) => {
        try {
          const info = await this.getPhoneInfo(phone.id);
          phone.width = info.width;
          phone.height = info.height;
        } catch {
          // Dimensions unavailable — leave as undefined
        }
      })
    );
    return phones;
  }

  /**
   * Get device info (screen dimensions) for a phone
   */
  async getPhoneInfo(phoneId: string): Promise<PhoneInfo> {
    return this.request<PhoneInfo>('GET', `/phones/${phoneId}/info`);
  }

  /**
   * Get a screenshot from the phone
   * Returns PNG image buffer
   */
  async screenshot(): Promise<Buffer> {
    const phoneId = await this.getPhoneId();
    return this.request<Buffer>('GET', `/phones/${phoneId}/screenshot`);
  }

  /**
   * Tap at specific coordinates
   */
  async tap(x: number, y: number): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    return this.request<TapResult>('POST', `/phones/${phoneId}/tap`, { x, y });
  }

  /**
   * Tap an element by natural language description
   */
  async tapElement(description: string): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    return this.request<TapResult>('POST', `/phones/${phoneId}/tap/select`, {
      description
    });
  }

  /**
   * Double tap at coordinates
   */
  async doubleTap(x: number, y: number): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    return this.request<TapResult>('POST', `/phones/${phoneId}/double-tap`, { x, y });
  }

  /**
   * Long press at coordinates
   */
  async longPress(x: number, y: number, durationMs?: number): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    return this.request<TapResult>('POST', `/phones/${phoneId}/tap-and-hold`, {
      x,
      y,
      duration_ms: durationMs || 1000
    });
  }

  /**
   * Flick gesture at position in a direction
   */
  async flick(x: number, y: number, direction: string): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    return this.request<TapResult>('POST', `/phones/${phoneId}/flick`, {
      x, y, direction
    });
  }

  /**
   * Drag from one point to another
   */
  async drag(fromX: number, fromY: number, toX: number, toY: number): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    return this.request<TapResult>('POST', `/phones/${phoneId}/drag`, {
      from_x: fromX, from_y: fromY, to_x: toX, to_y: toY
    });
  }

  /**
   * Long press then drag to another point
   */
  async holdAndDrag(fromX: number, fromY: number, toX: number, toY: number, holdDurationMs?: number): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    return this.request<TapResult>('POST', `/phones/${phoneId}/hold-and-drag`, {
      from_x: fromX, from_y: fromY, to_x: toX, to_y: toY, hold_duration_ms: holdDurationMs || 500
    });
  }

  /**
   * Type text into active field
   */
  async typeText(text: string): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    return this.request<TapResult>('POST', `/phones/${phoneId}/type`, { text, method: 'shortcut' });
  }

  /**
   * Press home button
   */
  async pressHome(): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    return this.request<TapResult>('POST', `/phones/${phoneId}/home`, {});
  }

  /**
   * Open an app by name or bundle ID
   */
  async openApp(appName: string): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    return this.request<TapResult>('POST', `/phones/${phoneId}/open-app`, {
      app_name: appName
    });
  }

  /**
   * Lock the device
   */
  async lock(): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    return this.request<TapResult>('POST', `/phones/${phoneId}/lock`, {});
  }

  /**
   * Unlock the device
   */
  async unlock(passcode?: string): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    return this.request<TapResult>('POST', `/phones/${phoneId}/unlock`, {
      ...(passcode ? { passcode } : {})
    });
  }

  /**
   * Adjust volume up
   */
  async volumeUp(): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    return this.request<TapResult>('POST', `/phones/${phoneId}/volume-up`, {});
  }

  /**
   * Adjust volume down
   */
  async volumeDown(): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    return this.request<TapResult>('POST', `/phones/${phoneId}/volume-down`, {});
  }

  /**
   * Open Spotlight search
   */
  async spotlight(query?: string): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    const result = await this.request<TapResult>('POST', `/phones/${phoneId}/spotlight`, {});
    if (query) {
      await this.typeText(query);
    }
    return result;
  }

  /**
   * Activate Siri
   */
  async activateSiri(): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    return this.request<TapResult>('POST', `/phones/${phoneId}/siri`, {});
  }

  /**
   * Run an iOS Shortcut by index
   */
  async runShortcut(index: number): Promise<TapResult> {
    const phoneId = await this.getPhoneId();
    return this.request<TapResult>('POST', `/phones/${phoneId}/shortcut`, {
      index
    });
  }
}

export class TapKitAPIError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'TapKitAPIError';
    this.status = status;
    this.code = code;
  }

  toUserMessage(): string {
    switch (this.code) {
      case 'NO_PHONES_CONNECTED':
        return 'No phones connected. Please ensure TapKit is running and a phone is connected.';
      case 'NO_PHONE_SELECTED':
        return this.message;
      case 'PHONE_NOT_FOUND':
        return 'Phone not found. The device may have been disconnected.';
      case 'MAC_APP_NOT_RUNNING':
        return 'TapKit companion app is not running on your Mac.';
      case 'TIMEOUT':
        return 'Operation timed out. The app may be unresponsive.';
      case 'INVALID_API_KEY':
      case 'INVALID_TOKEN':
        return 'Invalid API key or token. Please reconnect to TapKit.';
      case 'AUTH_REQUIRED':
        return 'Authentication required. Please sign in to TapKit.';
      case 'SUBSCRIPTION_REQUIRED':
        return 'An active TapKit subscription is required.';
      case 'NETWORK_ERROR':
        return `Network error: ${this.message}`;
      case 'USER_NOT_FOUND':
        return 'User not found. Please ensure you have a TapKit account and have connected at least once via the app.';
      case 'ORG_NOT_FOUND':
        return 'Organization not found. Please ensure your account is set up correctly.';
      default:
        return `${this.code}: ${this.message}`;
    }
  }
}

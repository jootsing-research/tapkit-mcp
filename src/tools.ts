/**
 * MCP Tool Definitions for TapKit
 */

import sharp from 'sharp';
import { TapKitClient, TapKitAPIError, MAX_LONG_EDGE, type PhoneStatus } from './tapkit-client.js';

// Tool input schemas (JSON Schema format)
export const toolDefinitions = [
  {
    name: 'list_phones',
    description: 'List all connected phones. Use this to see which devices are available.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'select_phone',
    description: 'Select and activate a phone for control. Switches the active phone on the connected Mac. Use list_phones first to see available phones.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'The ID of the phone to select'
        }
      },
      required: ['phone_id']
    }
  },
  {
    name: 'screenshot',
    description: 'Take a screenshot of the iPhone screen. Returns the current screen state as an image. Use this to see what is on screen before and after actions.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        }
      },
      required: []
    }
  },
  {
    name: 'tap',
    description: 'Tap at specific x,y coordinates on the screen. Use screenshot first to identify the location.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        },
        x: {
          type: 'number',
          description: 'X coordinate (pixels from left)'
        },
        y: {
          type: 'number',
          description: 'Y coordinate (pixels from top)'
        }
      },
      required: ['x', 'y']
    }
  },
  // {
  //   name: 'type_text',
  //   description: 'Type text into the currently focused text field. Make sure a text field is active first (tap it if needed).',
  //   inputSchema: {
  //     type: 'object',
  //     properties: {
  //       phone_id: {
  //         type: 'string',
  //         description: 'Phone ID (required when multiple phones are connected)'
  //       },
  //       text: {
  //         type: 'string',
  //         description: 'The text to type'
  //       }
  //     },
  //     required: ['text']
  //   }
  // },
  {
    name: 'press_home',
    description: 'Press the home button to go to the home screen or exit the current app.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        }
      },
      required: []
    }
  },
  {
    name: 'swipe',
    description: 'Perform a fast flick/swipe gesture at a position. Useful for dismissing, switching pages, or quick scrolling.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        },
        x: {
          type: 'number',
          description: 'X coordinate to swipe from'
        },
        y: {
          type: 'number',
          description: 'Y coordinate to swipe from'
        },
        direction: {
          type: 'string',
          enum: ['up', 'down', 'left', 'right'],
          description: 'Direction to swipe'
        }
      },
      required: ['x', 'y', 'direction']
    }
  },
  {
    name: 'drag',
    description: 'Drag from one point to another. Useful for moving sliders, reordering items, or precise scroll gestures.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        },
        from_x: { type: 'number', description: 'Starting X coordinate' },
        from_y: { type: 'number', description: 'Starting Y coordinate' },
        to_x: { type: 'number', description: 'Ending X coordinate' },
        to_y: { type: 'number', description: 'Ending Y coordinate' }
      },
      required: ['from_x', 'from_y', 'to_x', 'to_y']
    }
  },
  {
    name: 'hold_and_drag',
    description: 'Long press then drag to another point. Useful for drag-and-drop, reordering lists, or moving items.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        },
        from_x: { type: 'number', description: 'Starting X coordinate' },
        from_y: { type: 'number', description: 'Starting Y coordinate' },
        to_x: { type: 'number', description: 'Ending X coordinate' },
        to_y: { type: 'number', description: 'Ending Y coordinate' },
        hold_duration_ms: { type: 'number', description: 'How long to hold before dragging in ms (default: 500)' }
      },
      required: ['from_x', 'from_y', 'to_x', 'to_y']
    }
  },
  {
    name: 'double_tap',
    description: 'Double tap at specific coordinates. Useful for zooming or selecting text.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        },
        x: {
          type: 'number',
          description: 'X coordinate'
        },
        y: {
          type: 'number',
          description: 'Y coordinate'
        }
      },
      required: ['x', 'y']
    }
  },
  {
    name: 'long_press',
    description: 'Long press (tap and hold) at specific coordinates. Useful for context menus or drag operations.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        },
        x: {
          type: 'number',
          description: 'X coordinate'
        },
        y: {
          type: 'number',
          description: 'Y coordinate'
        },
        duration: {
          type: 'number',
          description: 'Duration to hold in milliseconds (default: 1000)'
        }
      },
      required: ['x', 'y']
    }
  },
  {
    name: 'lock',
    description: 'Lock the iPhone screen.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        }
      },
      required: []
    }
  },
  {
    name: 'unlock',
    description: 'Unlock the iPhone screen.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        }
      },
      required: []
    }
  },
  {
    name: 'volume_up',
    description: 'Increase the volume.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        }
      },
      required: []
    }
  },
  {
    name: 'volume_down',
    description: 'Decrease the volume.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        }
      },
      required: []
    }
  },
  {
    name: 'spotlight',
    description: 'Open Spotlight search. Optionally provide a query to search for.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        },
        query: {
          type: 'string',
          description: 'Search query (optional)'
        }
      },
      required: []
    }
  },
  {
    name: 'activate_siri',
    description: 'Activate Siri voice assistant.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        }
      },
      required: []
    }
  },
  {
    name: 'run_shortcut',
    description: 'Run an iOS Shortcut by its index number in the shortcuts menu.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        },
        index: {
          type: 'number',
          description: 'Index of the shortcut to run (0-based)'
        }
      },
      required: ['index']
    }
  },
  {
    name: 'escape',
    description: 'Press escape to dismiss keyboards, alerts, popups, or modal screens.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        }
      },
      required: []
    }
  },
  {
    name: 'open_app',
    description: 'Open an app by name or bundle ID. Examples: "Safari", "com.apple.mobilesafari".',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        },
        app_name: {
          type: 'string',
          description: 'The app name (e.g. "Safari", "Settings") or bundle ID (e.g. "com.apple.mobilesafari")'
        }
      },
      required: ['app_name']
    }
  },
  {
    name: 'enable_switch_control',
    description: 'Enable Switch Control on the Mac for a given phone. This must be done before the phone can be controlled via Switch Control.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        }
      },
      required: []
    }
  },
  {
    name: 'copy_text_to_phone',
    description: 'Load text into a phone\'s clipboard. After this completes, the text is on the phone\'s clipboard and can be pasted anywhere.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        },
        text: {
          type: 'string',
          description: 'The text to copy to the clipboard'
        }
      },
      required: ['text']
    }
  },
  {
    name: 'get_phone_status',
    description: 'Get real-time status of a phone including connection state, Switch Control, screen lock, and streaming status.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'The ID of the phone to check status for'
        }
      },
      required: ['phone_id']
    }
  },
  {
    name: 'get_phone_info',
    description: '(Deprecated — use get_phone_status instead) Get screen dimensions and device info for the selected phone.',
    inputSchema: {
      type: 'object',
      properties: {
        phone_id: {
          type: 'string',
          description: 'Phone ID (required when multiple phones are connected)'
        }
      },
      required: []
    }
  },
];

type ToolResult = { content: Array<{ type: string; text?: string; data?: string; mimeType?: string }> };

/**
 * Inner tool execution — dispatches to the correct handler.
 */
async function executeToolInner(
  client: TapKitClient,
  toolName: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  // Auto-resolve phone for all tools that need one (skip list_phones)
  if (toolName !== 'list_phones') {
    await client.resolvePhone(args.phone_id as string | undefined);
  }

  switch (toolName) {
    case 'list_phones': {
      const phones = await client.listPhones();
      if (phones.length === 0) {
        return {
          content: [{ type: 'text', text: 'No phones found. Make sure TapKit is set up and a phone is connected.' }]
        };
      }
      const phoneList = phones.map(p => {
        const name = p.display_name || p.name;
        const status = p.connection_status.toUpperCase();
        let line = `- ${name} [${status}] (ID: ${p.id})`;
        if (p.connected_mac_id) line += ` (Mac: ${p.connected_mac_id})`;
        if (p.width && p.height) line += ` ${p.width}x${p.height}`;
        return line;
      }).join('\n');
      return {
        content: [{ type: 'text', text: `Found ${phones.length} phone(s):\n${phoneList}` }]
      };
    }

    case 'select_phone': {
      const phoneId = args.phone_id as string;
      const phone = await client.selectPhoneOnMac(phoneId);
      client.setPhoneId(phoneId);
      if (phone.width && phone.height) {
        client.setScreenDimensions(phone.width, phone.height);
      }
      const scaling = client.getScaling();
      const dims = scaling ? ` (${scaling.scaledWidth}x${scaling.scaledHeight})` : '';
      return {
        content: [{ type: 'text', text: `Selected and activated phone: ${phone.display_name || phone.name}${dims}` }]
      };
    }

    case 'screenshot': {
      const imageBuffer = await client.screenshot();
      const scaling = client.getScaling();

      let reportW: number;
      let reportH: number;
      let pipeline: sharp.Sharp;

      if (scaling) {
        pipeline = sharp(imageBuffer)
          .resize(scaling.scaledWidth, scaling.scaledHeight, { fit: 'inside' });
        reportW = scaling.scaledWidth;
        reportH = scaling.scaledHeight;
      } else {
        // No scaling info — still resize to cap the long edge
        const meta = await sharp(imageBuffer).metadata();
        const w = meta.width ?? 0;
        const h = meta.height ?? 0;
        const longest = Math.max(w, h);
        if (longest > MAX_LONG_EDGE) {
          const scale = MAX_LONG_EDGE / longest;
          reportW = Math.round(w * scale);
          reportH = Math.round(h * scale);
          pipeline = sharp(imageBuffer).resize(reportW, reportH, { fit: 'inside' });
        } else {
          reportW = w;
          reportH = h;
          pipeline = sharp(imageBuffer);
        }
      }

      const resizedBuffer = await pipeline.jpeg({ quality: 80 }).toBuffer();
      const base64 = resizedBuffer.toString('base64');
      return {
        content: [
          { type: 'text', text: `Screenshot: ${reportW}x${reportH}. Coordinates for tap/swipe map 1:1 with image pixels.` },
          {
            type: 'image',
            data: base64,
            mimeType: 'image/jpeg'
          }
        ]
      };
    }

    case 'tap': {
      const { x, y } = args as { x: number; y: number };
      const native = client.toNative(x, y);
      await client.tap(native.x, native.y);
      return {
        content: [{ type: 'text', text: `Tapped at (${x}, ${y})` }]
      };
    }

    // case 'type_text': {
    //   const { text } = args as { text: string };
    //   await client.typeText(text);
    //   return {
    //     content: [{ type: 'text', text: `Typed: "${text}"` }]
    //   };
    // }

    case 'press_home': {
      await client.pressHome();
      return {
        content: [{ type: 'text', text: 'Pressed home button' }]
      };
    }

    case 'swipe': {
      const { x, y, direction } = args as { x: number; y: number; direction: string };
      const native = client.toNative(x, y);
      await client.flick(native.x, native.y, direction);
      return {
        content: [{ type: 'text', text: `Swiped ${direction} at (${x}, ${y})` }]
      };
    }

    case 'drag': {
      const { from_x, from_y, to_x, to_y } = args as {
        from_x: number; from_y: number; to_x: number; to_y: number;
      };
      const nFrom = client.toNative(from_x, from_y);
      const nTo = client.toNative(to_x, to_y);
      await client.drag(nFrom.x, nFrom.y, nTo.x, nTo.y);
      return {
        content: [{ type: 'text', text: `Dragged from (${from_x}, ${from_y}) to (${to_x}, ${to_y})` }]
      };
    }

    case 'hold_and_drag': {
      const { from_x, from_y, to_x, to_y, hold_duration_ms } = args as {
        from_x: number; from_y: number; to_x: number; to_y: number; hold_duration_ms?: number;
      };
      const nFrom = client.toNative(from_x, from_y);
      const nTo = client.toNative(to_x, to_y);
      await client.holdAndDrag(nFrom.x, nFrom.y, nTo.x, nTo.y, hold_duration_ms);
      return {
        content: [{ type: 'text', text: `Hold and dragged from (${from_x}, ${from_y}) to (${to_x}, ${to_y})` }]
      };
    }

    case 'double_tap': {
      const { x, y } = args as { x: number; y: number };
      const native = client.toNative(x, y);
      await client.doubleTap(native.x, native.y);
      return {
        content: [{ type: 'text', text: `Double tapped at (${x}, ${y})` }]
      };
    }

    case 'long_press': {
      const { x, y, duration } = args as { x: number; y: number; duration?: number };
      const native = client.toNative(x, y);
      await client.longPress(native.x, native.y, duration);
      return {
        content: [{ type: 'text', text: `Long pressed at (${x}, ${y}) for ${duration || 1000}ms` }]
      };
    }

    case 'lock': {
      await client.lock();
      return {
        content: [{ type: 'text', text: 'Locked the device' }]
      };
    }

    case 'unlock': {
      await client.unlock();
      return {
        content: [{ type: 'text', text: 'Unlocked the device' }]
      };
    }

    case 'volume_up': {
      await client.volumeUp();
      return {
        content: [{ type: 'text', text: 'Increased volume' }]
      };
    }

    case 'volume_down': {
      await client.volumeDown();
      return {
        content: [{ type: 'text', text: 'Decreased volume' }]
      };
    }

    case 'spotlight': {
      const { query } = args as { query?: string };
      await client.spotlight(query);
      return {
        content: [{ type: 'text', text: query ? `Opened Spotlight and searched for: ${query}` : 'Opened Spotlight' }]
      };
    }

    case 'activate_siri': {
      await client.activateSiri();
      return {
        content: [{ type: 'text', text: 'Activated Siri' }]
      };
    }

    case 'run_shortcut': {
      const { index } = args as { index: number };
      await client.runShortcut(index);
      return {
        content: [{ type: 'text', text: `Ran shortcut at index: ${index}` }]
      };
    }

    case 'escape': {
      await client.escape();
      return {
        content: [{ type: 'text', text: 'Pressed escape' }]
      };
    }

    case 'enable_switch_control': {
      await client.enableSwitchControl();
      return {
        content: [{ type: 'text', text: 'Enabled Switch Control' }]
      };
    }

    case 'copy_text_to_phone': {
      const { text } = args as { text: string };
      await client.copyText(text);
      return {
        content: [{ type: 'text', text: `Copied text to phone clipboard` }]
      };
    }

    case 'open_app': {
      const { app_name } = args as { app_name: string };
      await client.openApp(app_name);
      return {
        content: [{ type: 'text', text: `Opened app: ${app_name}` }]
      };
    }

    case 'get_phone_status': {
      const phoneId = args.phone_id as string || await client.getPhoneId();
      const status: PhoneStatus = await client.getPhoneStatus(phoneId);
      const lines = [
        `Phone: ${status.phone_name}`,
        `Status: ${status.connection_status}`,
        `Switch Control: ${status.switch_control_enabled ? 'enabled' : 'disabled'}`,
        `Screen: ${status.screen_locked ? 'locked' : 'unlocked'}`,
        `Streaming: ${status.streaming ? 'yes' : 'no'}`,
      ];
      if (status.width && status.height) {
        lines.push(`Dimensions: ${status.width}x${status.height}`);
      }
      return {
        content: [{ type: 'text', text: lines.join('\n') }]
      };
    }

    case 'get_phone_info': {
      // resolvePhone already called above — scaling is initialized
      const scaling = client.getScaling();
      if (scaling) {
        return {
          content: [{ type: 'text', text: `Screen: ${scaling.scaledWidth}x${scaling.scaledHeight}` }]
        };
      }
      const phoneId = await client.getPhoneId();
      const info = await client.getPhoneInfo(phoneId);
      return {
        content: [{ type: 'text', text: `Screen: ${info.width}x${info.height}, Name: ${info.name}` }]
      };
    }

    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${toolName}` }]
      };
  }
}

/**
 * Execute a tool with the given arguments.
 * Automatically handles PHONE_NOT_SELECTED by selecting the phone and retrying once.
 */
export async function executeTool(
  client: TapKitClient,
  toolName: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    return await executeToolInner(client, toolName, args);
  } catch (error) {
    // Auto-select and retry on PHONE_NOT_SELECTED (409)
    if (
      error instanceof TapKitAPIError &&
      error.code === 'PHONE_NOT_SELECTED' &&
      error.status === 409
    ) {
      const phoneId = (error.context?.phone_id as string) || (args.phone_id as string);
      if (phoneId) {
        try {
          const phone = await client.selectPhoneOnMac(phoneId);
          client.setPhoneId(phoneId);
          if (phone.width && phone.height) {
            client.setScreenDimensions(phone.width, phone.height);
          }
          return await executeToolInner(client, toolName, args);
        } catch (retryError) {
          if (retryError instanceof TapKitAPIError) {
            return { content: [{ type: 'text', text: `Error: ${retryError.toUserMessage()}` }] };
          }
          throw retryError;
        }
      }
    }
    if (error instanceof TapKitAPIError) {
      return {
        content: [{ type: 'text', text: `Error: ${error.toUserMessage()}` }]
      };
    }
    // Log and return non-TapKit errors with full details
    console.error('Tool execution error:', error);
    const errorMessage = error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }]
    };
  }
}

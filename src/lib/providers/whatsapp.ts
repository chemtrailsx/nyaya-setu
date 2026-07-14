/**
 * WhatsApp / SMS alert provider.
 *
 * SIMULATED: the WhatsApp Cloud API / Twilio need a verified business number
 * and are outside a hackathon's reach. The interface is real; a live provider
 * is a drop-in swap. Simulated sends are recorded so the UI can show them.
 */
import { config } from "@/lib/config";

export interface MessageProvider {
  readonly simulated: boolean;
  send(input: { to: string; message: string }): Promise<{ channel: "whatsapp"; message: string; at: string }>;
}

export const SimulatedWhatsApp: MessageProvider = {
  simulated: true,
  async send({ message }) {
    return { channel: "whatsapp", message, at: new Date().toISOString() };
  },
};

export function messaging(): MessageProvider {
  // A live provider would go here when WHATSAPP_MODE=live.
  return config.providers.whatsapp === "live" ? SimulatedWhatsApp : SimulatedWhatsApp;
}

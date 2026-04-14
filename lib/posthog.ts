import PostHog from "posthog-react-native";

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || "";
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

let client: PostHog | null = null;

export function getPostHog(): PostHog | null {
  if (!POSTHOG_KEY) return null;

  if (!client) {
    client = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      enableSessionReplay: false,
    });
  }
  return client;
}

export function identifyUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}) {
  const ph = getPostHog();
  if (!ph) return;
  ph.identify(user.id, {
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role,
  });
}

export function resetUser() {
  const ph = getPostHog();
  if (!ph) return;
  ph.reset();
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  const ph = getPostHog();
  if (!ph) return;
  ph.capture(event, properties);
}

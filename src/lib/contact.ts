export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

export type ContactInput = { phone: string; email: string; message: string };
export type ContactCheck =
  | { ok: true; value: ContactInput }
  | { ok: false; errors: Partial<Record<keyof ContactInput, string>> };

/** Keeps a leading "+" and the digits: "+91 (987) 654-3210" -> "+919876543210". */
export const normalizePhone = (raw: string) => {
  const t = raw.trim();
  return (t.startsWith("+") ? "+" : "") + t.replace(/\D/g, "");
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Checks the contact form. Used on the client and again on the server. */
export function checkContact(input: { phone: string; email: string; message: string }): ContactCheck {
  const errors: Partial<Record<keyof ContactInput, string>> = {};

  const phone = normalizePhone(input.phone);
  const digits = phone.replace(/\D/g, "").length;
  if (!input.phone.trim()) errors.phone = "Mobile number is required";
  else if (digits < 7 || digits > 15 || /[^\d\s()+\-.]/.test(input.phone)) errors.phone = "Enter a valid mobile number, e.g. +91 98765 43210";

  const email = input.email.trim();
  if (!email) errors.email = "Email is required";
  else if (email.length > 254 || !EMAIL.test(email)) errors.email = "Enter a valid email address";

  const message = input.message.trim();
  if (!message) errors.message = "Message is required";
  else if (message.length < MESSAGE_MIN) errors.message = `Message must be at least ${MESSAGE_MIN} characters`;
  else if (message.length > MESSAGE_MAX) errors.message = `Message must be under ${MESSAGE_MAX} characters`;

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { phone, email: email.toLowerCase(), message } };
}

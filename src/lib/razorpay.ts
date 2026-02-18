import { supabase } from "@/integrations/supabase/client";

interface RazorpayOptions {
  amount: number; // in INR
  currency?: string;
  name: string;
  description: string;
  receipt?: string;
  notes?: Record<string, string>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onDismiss?: () => void;
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function openRazorpayCheckout(options: RazorpayOptions): Promise<void> {
  // Create server-side order
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const response = await supabase.functions.invoke("create-razorpay-order", {
    body: {
      amount: options.amount,
      currency: options.currency || "INR",
      receipt: options.receipt || `receipt_${Date.now()}`,
      notes: options.notes || {},
    },
  });

  if (response.error) throw new Error(response.error.message || "Failed to create payment order");

  const { order_id, amount, currency, key_id } = response.data;

  return new Promise((resolve, reject) => {
    const rzp = new (window as any).Razorpay({
      key: key_id,
      amount,
      currency,
      order_id,
      name: options.name,
      description: options.description,
      prefill: options.prefill || {},
      theme: { color: "#22C55E" },
      modal: {
        ondismiss: () => {
          options.onDismiss?.();
          reject(new Error("Payment dismissed"));
        },
      },
      handler: (paymentResponse: RazorpaySuccessResponse) => {
        options.onSuccess(paymentResponse);
        resolve();
      },
    });

    rzp.open();
  });
}

export async function verifyPayment(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number; // in paise
  booking_id?: string;
  event_id?: string;
  payment_method?: string;
}) {
  const response = await supabase.functions.invoke("verify-razorpay-payment", {
    body: params,
  });

  if (response.error) throw new Error(response.error.message || "Payment verification failed");
  return response.data;
}

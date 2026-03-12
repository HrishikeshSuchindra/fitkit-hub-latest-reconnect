

## Diagnosis: Razorpay "Authentication failed" Root Cause

### What the logs tell us (facts)

From the edge function logs, every single call shows the same pattern:

```text
Key ID:       "rzp_live_ZBOck5uozUhzKh"  (length 23, starts with rzp_live_)
Secret:       length 24, starts "HqTt", ends "Xxjl"
Razorpay API: { code: "BAD_REQUEST_ERROR", description: "Authentication failed" }
```

The code itself is **correct** -- it uses `btoa(key_id:key_secret)` for Basic Auth, which is the standard Razorpay pattern. The payload is valid (amount in paise, currency INR). CORS is fine. Auth token passes. The 500 comes specifically from Razorpay rejecting the credentials.

### Why it's failing (two possible causes)

**Cause 1 (most likely): The Key Secret value is wrong or truncated.**  
When secrets are pasted into the input field, it's common for characters to be cut off, or for invisible whitespace/newline characters to be included. The current stripping logic handles quotes and newlines, but if the secret itself was truncated during entry, no amount of trimming will fix it. A Razorpay key secret is typically ~20-30 characters, so 24 is plausible but could still be wrong.

**Cause 2: Razorpay Live mode is not activated.**  
You're using `rzp_live_` keys. Razorpay requires full KYC verification and account activation before live API keys will work. If your Razorpay account hasn't completed activation, live keys will fail with "Authentication failed" even if they're correct. You can verify this in your Razorpay Dashboard under Account & Settings.

### Plan to fix

1. **Verify your Razorpay account is activated for Live mode** -- Go to Razorpay Dashboard. If you see a banner saying "Complete KYC" or "Activate Live Mode", that's the problem. Switch to Test keys (`rzp_test_...`) for now.

2. **Re-enter BOTH secrets fresh** -- Go to Razorpay Dashboard > Settings > API Keys. Copy the Key ID and Key Secret carefully (no extra spaces, no partial selection). I'll prompt you to re-enter them.

3. **Add a diagnostic log** that prints the exact Base64 credential string length being sent, so we can confirm it matches what Razorpay expects.

4. **Test with Test mode keys first** -- If Test keys work but Live keys don't, the issue is account activation, not code.

### No code changes needed
The edge function code is correct. This is purely a credentials/account activation issue.


# Razorpay Payment Gateway Integration

## Setup Instructions

### 1. Environment Variables
Add to `.env.local`:

```env
RAZORPAY_KEY_ID=rzp_live_S7LRp8RSjDLoGW
RAZORPAY_KEY_SECRET=AbbJmTVAjislNmPYsaR7cZuk
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_S7LRp8RSjDLoGW
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. File Structure
```
app/api/payment/
├── razorpay/
│   └── route.ts          # Payment creation & verification

components/payment/
└── RazorpayCheckout.tsx  # Checkout button

app/payment/
├── success/
│   └── page.tsx          # Payment success page
└── cancel/
    └── page.tsx          # Payment cancellation page
```

## Usage

### One-Time Payment
```tsx
import RazorpayCheckout from '@/components/payment/RazorpayCheckout';

<RazorpayCheckout
  planId="pro-plan"
  planName="Pro Plan"
  amount={999}  // Amount in paise (₹9.99 = 999 paise)
  description="Upgrade to Pro"
  userEmail="user@example.com"
  userName="User Name"
  onSuccess={(response) => console.log('Payment successful', response)}
  onError={(error) => console.log('Payment failed', error)}
/>
```

## API Endpoints

### POST /api/payment/razorpay
Create a new order
- **Body**: `{ amount, planId, planName, description, userId }`
- **Returns**: `{ orderId, amount, currency, key }`

### PATCH /api/payment/razorpay
Verify payment
- **Body**: `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }`
- **Returns**: `{ success, transactionId, status, amount }`

## Razorpay Dashboard

- **Dashboard**: https://dashboard.razorpay.com
- **API Keys**: Settings → API Keys
- **Payments**: Transactions → Orders
- **Webhooks**: Settings → Webhooks (optional)

## Amount Format

Razorpay uses **paise** (1 Rupee = 100 paise):
- ₹1 = 100 paise
- ₹9.99 = 999 paise
- ₹99.99 = 9999 paise

Always multiply amount by 100 when sending to API.

## Payment Statuses

- `created` - Order created, awaiting payment
- `authorized` - Payment authorized
- `captured` - Payment successful
- `refunded` - Payment refunded
- `failed` - Payment failed

## Webhook Setup (Optional)

1. Go to Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourapp.com/api/webhooks/razorpay`
3. Select events: `payment.authorized`, `payment.failed`, `payment.captured`
4. This allows real-time payment confirmations

## Testing

Use Razorpay test card in sandbox mode (if testing):
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits

(Your account is LIVE, so real payments will be processed)

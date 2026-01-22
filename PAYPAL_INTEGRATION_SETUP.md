# PayPal Payment Gateway Integration

## Setup Instructions

### 1. Create PayPal Developer Account
- Go to https://developer.paypal.com/
- Sign up or log in
- Click on "Apps & Credentials"

### 2. Get API Credentials
- In "Sandbox" tab, you'll see your credentials
- Copy: **Client ID**
- Copy: **Secret**

### 3. Add to Environment Variables
Add to `.env.local`:

```env
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Testing
Use PayPal sandbox account for testing:
- Email: `sb-xxxxx@business.example.com`
- Password: Find in your PayPal Developer Dashboard

### 5. File Structure
```
app/api/payment/
├── paypal/
│   └── route.ts          # One-time payments
└── subscription/
    └── route.ts          # Recurring subscriptions

components/payment/
└── PayPalCheckout.tsx    # Checkout button

app/payment/
├── success/
│   └── page.tsx          # Payment success page
└── cancel/
    └── page.tsx          # Payment cancellation page
```

## Usage

### One-Time Payment
```tsx
import PayPalCheckout from '@/components/payment/PayPalCheckout';

<PayPalCheckout
  planId="pro-plan"
  planName="Pro Plan"
  amount={9.99}
  description="Upgrade to Pro"
  onSuccess={(details) => console.log('Payment successful', details)}
  onError={(error) => console.log('Payment failed', error)}
/>
```

### Subscription
```tsx
const response = await fetch('/api/payment/subscription', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    planId: 'plan-id',
    subscriberEmail: 'user@example.com',
    subscriberName: 'User Name',
  }),
});
```

## API Endpoints

### POST /api/payment/paypal
Create a new order
- **Body**: `{ planId, amount, planName, userId }`
- **Returns**: `{ orderId, approvalUrl }`

### PUT /api/payment/paypal
Capture order payment
- **Body**: `{ orderId }`
- **Returns**: `{ transactionId, status, payer, amount }`

### PATCH /api/payment/paypal
Verify payment status
- **Body**: `{ orderId }`
- **Returns**: `{ status, details }`

### PUT /api/payment/subscription
Create subscription
- **Body**: `{ planId, subscriberEmail, subscriberName }`
- **Returns**: `{ subscriptionId, approvalUrl }`

### PATCH /api/payment/subscription
Get subscription details
- **Body**: `{ subscriptionId }`
- **Returns**: `{ subscription, status }`

## Going Live

1. Switch to "Live" in PayPal Developer Dashboard
2. Get your **Live Client ID** and **Secret**
3. Update `.env.local` with live credentials
4. Change API endpoint from `api.sandbox.paypal.com` to `api.paypal.com` in code
5. Test thoroughly before deploying

## Webhook Setup (Optional)
For async payment confirmations, set up webhooks:
1. Go to PayPal Developer Dashboard
2. Navigate to "Webhooks"
3. Create webhook listener URL on your server
4. Subscribe to events you want to monitor

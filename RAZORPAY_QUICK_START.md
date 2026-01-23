# Razorpay Integration - Quick Reference

## ✅ Setup Complete

Your Razorpay live account is now integrated. Here's what's been set up:

### Credentials
- **Key ID**: `rzp_live_S7LRp8RSjDLoGW`
- **Key Secret**: `AbbJmTVAjislNmPYsaR7cZuk`
- **Status**: LIVE (Real payments will be processed)

### Files Created/Updated

1. **[RAZORPAY_INTEGRATION_SETUP.md](RAZORPAY_INTEGRATION_SETUP.md)** - Complete setup documentation
2. **[app/api/payment/razorpay/route.ts](app/api/payment/razorpay/route.ts)** - API endpoints for payment creation & verification
3. **[components/payment/RazorpayCheckout.tsx](components/payment/RazorpayCheckout.tsx)** - React checkout component
4. **[app/payment/success/page.tsx](app/payment/success/page.tsx)** - Success page (updated from PayPal)
5. **[app/payment/cancel/page.tsx](app/payment/cancel/page.tsx)** - Cancel page (updated from PayPal)
6. **[.env.razorpay](.env.razorpay)** - Environment variables template

## 🚀 How to Use

### Step 1: Add Environment Variables
Add to your `.env.local`:
```env
RAZORPAY_KEY_ID=rzp_live_S7LRp8RSjDLoGW
RAZORPAY_KEY_SECRET=AbbJmTVAjislNmPYsaR7cZuk
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_S7LRp8RSjDLoGW
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Install Razorpay SDK
```bash
npm install razorpay
# or
yarn add razorpay
```

### Step 3: Use in Your Component
```tsx
import RazorpayCheckout from '@/components/payment/RazorpayCheckout';

<RazorpayCheckout
  planId="pro-plan"
  planName="Pro Plan"
  amount={999}  // 999 paise = ₹9.99
  description="Upgrade to Pro"
  userEmail="user@example.com"
  userName="User Name"
  onSuccess={(response) => {
    console.log('Payment successful:', response);
    // Update user subscription in database
  }}
  onError={(error) => {
    console.log('Payment failed:', error);
  }}
/>
```

## 💡 Important Notes

### Amount Format
- Amounts are in **paise** (1 Rupee = 100 paise)
- ₹1 = 100 paise
- ₹9.99 = 999 paise
- **Always multiply by 100 when sending to API**

### Payment Status
- `created` - Order waiting for payment
- `authorized` - Payment verified
- `captured` - Payment successful
- `failed` - Payment failed
- `refunded` - Money refunded

### Live Account Warning ⚠️
Your account is LIVE. Real money will be charged for all transactions. Test thoroughly before deploying to production.

### Transaction Flow
1. User clicks "Pay" button
2. Order created via `POST /api/payment/razorpay`
3. Razorpay modal opens
4. User completes payment
5. Payment verified via `PATCH /api/payment/razorpay`
6. Redirect to success/cancel page
7. Store transaction details in database

## 📊 Monitoring Payments

1. **Razorpay Dashboard**: https://dashboard.razorpay.com
2. **Transactions**: Click "Transactions" → "Orders" or "Payments"
3. **View Details**: Click any transaction to see full details
4. **Download Reports**: Export CSV of all transactions

## 🔧 API Endpoints

### Create Order
```
POST /api/payment/razorpay
Body: { amount, planId, planName, description, userId }
Response: { orderId, amount, currency, key }
```

### Verify Payment
```
PATCH /api/payment/razorpay
Body: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
Response: { success, transactionId, status, amount, notes }
```

## 📚 Resources
- Razorpay Dashboard: https://dashboard.razorpay.com
- API Documentation: https://razorpay.com/docs/
- Integration Guide: https://razorpay.com/docs/payment-gateway/

## ⚡ Next Steps
1. Install razorpay package: `npm install razorpay`
2. Add environment variables to `.env.local`
3. Import RazorpayCheckout component where needed
4. Test payment flow in your app
5. Monitor transactions in Razorpay dashboard

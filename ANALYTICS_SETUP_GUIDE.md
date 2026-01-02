# Website Analytics Implementation - Setup Guide

## 🎯 Overview
Complete website visitor analytics tracking system with real-time visualization dashboard integrated into your admin panel at `/debug/data`.

## 📊 What's Included

### 1. **Analytics Tracking**
- Automatic page view tracking on every route
- Geolocation detection (Country, City)
- Device type detection (Mobile, Tablet, Desktop)
- Browser detection
- Referrer tracking
- Session identification
- User agent logging

### 2. **Analytics Dashboard** (New "Visitors" Tab)
Shows comprehensive metrics including:
- **Total Visits** - Overall page views
- **Unique Visitors** - Unique sessions
- **Countries Reached** - Geographic diversity
- **Average Visit Duration** - Engagement metric

### 3. **Visualizations**
- **Line Chart** - Visits over time (daily breakdown)
- **Pie Chart** - Device type distribution (Mobile/Tablet/Desktop)
- **Bar Chart** - Top 10 countries by visitor count
- **Bar Chart** - Top 10 most visited pages
- **Pie Chart** - Browser distribution
- **Table** - Top 10 cities with visitor counts
- **Table** - Recent 20 visitors with full details

---

## 🚀 Quick Setup

### Step 1: Run the SQL Migration
Copy and run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_path VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  country_code VARCHAR(10),
  city VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  referrer TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(255),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  duration_seconds INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics_events(country);
CREATE INDEX IF NOT EXISTS idx_analytics_page_path ON analytics_events(page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_device_type ON analytics_events(device_type);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert analytics events" ON analytics_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow read analytics for authenticated users" ON analytics_events
  FOR SELECT
  USING (auth.role() = 'authenticated');

GRANT SELECT, INSERT ON analytics_events TO postgres, authenticated, anon;
```

### Step 2: Files Created
All files have been created/modified:

**API Endpoints:**
- `/app/api/analytics/track/route.js` - Tracks page views
- `/app/api/analytics/data/route.js` - Returns analytics data for dashboard

**Components:**
- `/components/AnalyticsTracker.tsx` - Auto-tracking component

**Layout:**
- `/app/layout.js` - Updated to include AnalyticsTracker

**Dashboard:**
- `/app/debug/data/page.tsx` - Updated with "Visitors" tab

**Database:**
- `CREATE_ANALYTICS_TABLE.sql` - Migration file

### Step 3: Start Using It
1. Run your app: `npm run dev`
2. Browse around your site to generate analytics data
3. Navigate to `https://your-domain/debug/data`
4. Click "Visitors" in the sidebar
5. View real-time analytics with charts and graphs

---

## 📈 Key Features

### ✅ Automatic Tracking
- No code needed! Just add the AnalyticsTracker component to your layout
- Automatically tracks every page visit
- Captures device type, browser, location, and more

### ✅ Geolocation
- Uses free IP Geolocation API (ip-api.com)
- Returns country, country code, and city
- Automatically cached for 1 hour

### ✅ Session Management
- Creates unique session IDs per visitor
- Stored in localStorage
- Persists across page visits

### ✅ Real-Time Data
- Analytics endpoint is not cached (force-dynamic)
- Fresh data on each refresh
- 30-day rolling window by default

### ✅ Beautiful Visualizations
- Recharts integration for professional charts
- Responsive design
- Dark mode compatible

---

## 📊 Metrics Explained

| Metric | Description |
|--------|-------------|
| **Total Visits** | Total number of page views tracked |
| **Unique Visitors** | Count of unique sessions |
| **Countries** | Total distinct countries |
| **Avg Duration** | Average time on site in seconds |
| **Visits Timeline** | Daily visit trend over 30 days |
| **Device Breakdown** | Distribution across Mobile/Tablet/Desktop |
| **Top Countries** | Visitors by geographic location |
| **Top Pages** | Most visited pages on your site |
| **Browser Distribution** | What browsers visitors use |
| **Top Cities** | Most visitors by city |
| **Recent Visitors** | Last 20 visitor sessions with details |

---

## 🔧 Configuration

### Change the lookback period:
In `/app/debug/data/page.tsx`, update the analytics data fetch:
```jsx
loadAnalyticsData = async (days = 30) => {
  const response = await fetch(`/api/analytics/data?days=${days}`)
```

### Exclude certain pages from tracking:
In `/components/AnalyticsTracker.tsx`, update the skip logic:
```typescript
if (pathname?.startsWith('/api/') || pathname?.includes('_next') || pathname === '/') {
  return
}
```

### Change geolocation API:
In `/app/api/analytics/track/route.js`, replace the IP API call:
```javascript
// Current: ip-api.com
// Alternatives: ipinfo.io, geoip-db.com, maxmind, etc.
```

---

## 🎨 Data Structure

### Analytics Events Table
```
analytics_events {
  id: UUID (primary key)
  created_at: timestamp with timezone
  page_path: string (URL path visited)
  country: string (visitor's country)
  country_code: string (ISO country code)
  city: string (visitor's city)
  device_type: string (mobile/tablet/desktop)
  browser: string (Chrome/Firefox/Safari/etc)
  referrer: string (HTTP referrer)
  ip_address: string (visitor's IP)
  user_agent: string (full user agent string)
  session_id: string (unique session identifier)
  user_id: UUID (if authenticated user)
  duration_seconds: integer (time spent on page)
}
```

---

## 🔒 Security & Privacy

- **Row Level Security (RLS)** enabled
- Anonymous visitors can only INSERT their own events
- Only authenticated users can SELECT all analytics
- No sensitive data is stored
- IP addresses are stored but not exposed in dashboard
- Consider GDPR/Privacy compliance in your region

---

## 📱 Mobile Responsive
- Dashboard is fully responsive
- Works perfectly on mobile devices
- Charts are touch-friendly
- Optimized for all screen sizes

---

## 🚀 Performance Optimization

### Indexes Created:
- `idx_analytics_created_at` - For timeline queries
- `idx_analytics_country` - For country aggregations
- `idx_analytics_page_path` - For page view tracking
- `idx_analytics_session_id` - For unique visitor counts
- `idx_analytics_device_type` - For device breakdown

### Query Optimization:
- Analytics data is cached with indexes
- Aggregations happen in the API layer
- Dashboard loads only 30 days of data by default
- Old data can be archived separately

---

## 🐛 Troubleshooting

### No data showing?
1. Check if the `analytics_events` table exists in Supabase
2. Verify RLS policies are created
3. Check browser console for errors
4. Try refreshing the page a few times

### Geolocation not working?
1. The ip-api.com API has rate limits (45/minute)
2. Falls back to "Unknown" if API fails
3. Check if your server can make external requests
4. Verify no firewall is blocking ip-api.com

### Charts not rendering?
1. Ensure Recharts is installed: `npm install recharts`
2. Check if data structure matches expected format
3. Verify analytics data API returns valid JSON

---

## 📚 Next Steps

### Recommended Enhancements:
1. **Email Alerts** - Get notified of traffic spikes
2. **Custom Events** - Track user interactions (button clicks, form submissions)
3. **Retention Analysis** - Track user cohorts over time
4. **Conversion Funnels** - Track user journeys
5. **Export Data** - CSV/PDF export functionality
6. **Real-time Dashboard** - WebSocket updates
7. **Custom Date Range** - Let users pick analysis periods
8. **Comparison** - Compare periods (vs last week/month)

### Archive Old Data:
Create a cron job to archive analytics older than 90 days.

---

## 📞 Support
All components are self-contained and easy to modify. The architecture is clean and follows Next.js best practices.

**Enjoy your analytics dashboard! 🎉**

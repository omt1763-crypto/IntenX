# Analytics API Documentation

## Overview
Two endpoints handle all analytics functionality:
1. `/api/analytics/track` - Track page visits (POST)
2. `/api/analytics/data` - Retrieve analytics data (GET)

---

## 1. Analytics Track Endpoint

### Endpoint
```
POST /api/analytics/track
```

### Purpose
Records a page visit with geolocation and device information.

### Request Body
```json
{
  "page_path": "/dashboard",
  "referrer": "https://google.com",
  "session_id": "session_1234567890_abc123",
  "user_id": null
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page_path` | string | Yes | The path of the page visited (e.g., "/dashboard") |
| `referrer` | string | No | HTTP referrer (where visitor came from) |
| `session_id` | string | Yes | Unique session identifier |
| `user_id` | UUID | No | Auth user ID if authenticated |

### Response Success (200)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2024-01-02T10:30:45.123Z",
    "page_path": "/dashboard",
    "country": "United States",
    "country_code": "US",
    "city": "New York",
    "device_type": "desktop",
    "browser": "Chrome",
    "referrer": "https://google.com",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "session_id": "session_1234567890_abc123",
    "user_id": null,
    "duration_seconds": 0
  }
}
```

### Response Error (500)
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Example Usage (JavaScript)
```javascript
const trackPageView = async () => {
  try {
    const sessionId = localStorage.getItem('analytics_session_id') || 
                     `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    localStorage.setItem('analytics_session_id', sessionId);

    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_path: window.location.pathname,
        referrer: document.referrer,
        session_id: sessionId,
        user_id: null // Add user ID if authenticated
      })
    });

    if (!response.ok) {
      console.warn('Analytics tracking failed');
    }
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};
```

### Automatic Geolocation
The endpoint automatically:
- Detects visitor's IP address from request headers
- Calls `http://ip-api.com/json/{ip}` to get geolocation
- Falls back to "Unknown" if geolocation API fails or is unavailable

### Device & Browser Detection
Parsed from User-Agent header:
- **Device Types**: desktop, mobile, tablet
- **Browsers**: Chrome, Firefox, Safari, Edge, Opera, unknown

### Rate Limiting
- ip-api.com: 45 requests/minute (free tier)
- Results cached for 1 hour per IP
- Graceful fallback if rate limit exceeded

---

## 2. Analytics Data Endpoint

### Endpoint
```
GET /api/analytics/data?days=30
```

### Purpose
Retrieves aggregated analytics data for dashboard visualization.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 30 | Number of days to include in analysis |

### Response (200)
```json
{
  "success": true,
  "stats": {
    "totalVisits": 1250,
    "uniqueVisitors": 342,
    "uniqueCountries": 47,
    "avgVisitDuration": 145
  },
  "countryData": [
    { "country": "United States", "visitors": 650 },
    { "country": "United Kingdom", "visitors": 180 },
    { "country": "India", "visitors": 120 },
    ...
  ],
  "deviceData": [
    { "name": "desktop", "value": 580 },
    { "name": "mobile", "value": 450 },
    { "name": "tablet", "value": 220 }
  ],
  "browserData": [
    { "name": "Chrome", "value": 650 },
    { "name": "Safari", "value": 280 },
    { "name": "Firefox", "value": 180 },
    { "name": "Edge", "value": 120 },
    { "name": "Opera", "value": 20 }
  ],
  "topPages": [
    { "page": "/", "views": 450 },
    { "page": "/dashboard", "views": 280 },
    { "page": "/jobs", "views": 220 },
    ...
  ],
  "timelineData": [
    { "date": "Jan 1, 2024", "visits": 42 },
    { "date": "Jan 2, 2024", "visits": 58 },
    { "date": "Jan 3, 2024", "visits": 51 },
    ...
  ],
  "topCities": [
    { "city": "New York, US", "visitors": 180 },
    { "city": "Los Angeles, US", "visitors": 120 },
    { "city": "London, GB", "visitors": 95 },
    ...
  ],
  "recentVisitors": [
    {
      "date": "1/2/2024, 10:30:45 AM",
      "country": "United States",
      "city": "New York",
      "page": "/dashboard",
      "device": "desktop",
      "browser": "Chrome"
    },
    ...
  ]
}
```

### Response Structure Breakdown

#### `stats` Object
```typescript
{
  totalVisits: number;        // Total page views
  uniqueVisitors: number;     // Unique sessions
  uniqueCountries: number;    // Countries represented
  avgVisitDuration: number;   // Average seconds on site
}
```

#### `countryData` Array
```typescript
Array<{
  country: string;    // Country name
  visitors: number;   // Visit count from this country
}>
```

#### `deviceData` Array
```typescript
Array<{
  name: string;      // "desktop" | "mobile" | "tablet"
  value: number;     // Visit count for this device
}>
```

#### `browserData` Array
```typescript
Array<{
  name: string;      // Browser name (Chrome, Safari, etc)
  value: number;     // Visit count for this browser
}>
```

#### `topPages` Array
```typescript
Array<{
  page: string;      // Page path (e.g., "/dashboard")
  views: number;     // View count for this page
}>
```
Sorted by views, top 10 included.

#### `timelineData` Array
```typescript
Array<{
  date: string;      // Formatted date (e.g., "Jan 1, 2024")
  visits: number;    // Visits on this date
}>
```
Daily breakdown for the requested period.

#### `topCities` Array
```typescript
Array<{
  city: string;      // "City Name, Country Code"
  visitors: number;  // Visit count from this city
}>
```
Top 10 cities, sorted by visitors.

#### `recentVisitors` Array
```typescript
Array<{
  date: string;      // ISO formatted timestamp
  country: string;   // Country name
  city: string;      // City name
  page: string;      // Page path visited
  device: string;    // Device type
  browser: string;   // Browser name
}>
```
Last 20 visitors, most recent first.

### Example Usage (JavaScript)
```javascript
const loadAnalytics = async () => {
  try {
    const response = await fetch('/api/analytics/data?days=30');
    const data = await response.json();

    if (data.success) {
      console.log('Total Visits:', data.stats.totalVisits);
      console.log('Unique Visitors:', data.stats.uniqueVisitors);
      console.log('Top 3 Countries:', data.countryData.slice(0, 3));
      console.log('Device Distribution:', data.deviceData);
      console.log('Recent Visitors:', data.recentVisitors);
    }
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
};
```

### Caching Notes
- Endpoint is NOT cached (`export const revalidate = 0`)
- Returns fresh data on every request
- No browser caching (proper headers set)
- Database queries use indexes for performance

### Performance Characteristics

#### Query Times (Estimated)
| Operation | Time | Notes |
|-----------|------|-------|
| Total visits count | < 50ms | Indexed by created_at |
| Unique visitors | < 100ms | Indexed by session_id |
| Country breakdown | < 200ms | Indexed by country |
| Device breakdown | < 150ms | Indexed by device_type |
| Page ranking | < 250ms | Indexed by page_path |
| Timeline (30 days) | < 300ms | Multiple index access |
| City breakdown | < 300ms | Requires group/sort |

Total response time: < 1 second for typical datasets.

---

## 3. Data Storage

### Table: `analytics_events`

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_path VARCHAR(255),
  country VARCHAR(100),
  country_code VARCHAR(10),
  city VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  referrer TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(255),
  user_id UUID (nullable),
  duration_seconds INTEGER
);
```

### Indexes Created
- `idx_analytics_created_at` - For timeline queries
- `idx_analytics_country` - For country aggregations
- `idx_analytics_page_path` - For page rankings
- `idx_analytics_session_id` - For unique visitors
- `idx_analytics_device_type` - For device breakdown

### Row Level Security (RLS)
```sql
-- Insert: Anyone can insert (tracking anonymous visitors)
CREATE POLICY "Allow insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Select: Only authenticated users can read
CREATE POLICY "Allow read analytics for authenticated users" ON analytics_events
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## 4. Error Handling

### Common Errors

#### Geolocation API Failure
```json
{
  "success": true,
  "data": {
    ...
    "country": "Unknown",
    "country_code": "XX",
    "city": "Unknown"
  }
}
```
Falls back gracefully - tracking continues.

#### Rate Limiting (ip-api.com)
- Free tier: 45 requests/minute
- Exceeding limit triggers fallback to "Unknown" location
- Cached for 1 hour to avoid repeated calls

#### Database Insert Failure
```json
{
  "success": false,
  "error": "Failed to insert analytics event"
}
```
Check database connection and RLS policies.

---

## 5. Best Practices

### Client-Side Implementation
```typescript
// 1. Generate/retrieve session ID
let sessionId = localStorage.getItem('analytics_session_id');
if (!sessionId) {
  sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('analytics_session_id', sessionId);
}

// 2. Track on route changes
useEffect(() => {
  trackPageView(pathname, sessionId);
}, [pathname]);

// 3. Handle errors gracefully
const trackPageView = async (path, sessionId) => {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ page_path: path, session_id: sessionId })
    }).catch(err => console.warn('Analytics:', err));
  } catch (error) {
    // Fail silently
  }
};
```

### Server-Side Implementation
- Always use indexed queries for aggregations
- Use WHERE clauses with date filters
- Cache expensive aggregations if needed
- Consider archiving data older than 90 days

---

## 6. Testing

### Test Tracking
```bash
curl -X POST http://localhost:3000/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "page_path": "/test",
    "session_id": "test_session_123",
    "referrer": null,
    "user_id": null
  }'
```

### Test Analytics Data
```bash
curl http://localhost:3000/api/analytics/data?days=30
```

### Verify in Supabase
```sql
SELECT COUNT(*) as total_events FROM analytics_events;
SELECT * FROM analytics_events ORDER BY created_at DESC LIMIT 10;
SELECT country, COUNT(*) as visitors 
FROM analytics_events 
GROUP BY country 
ORDER BY visitors DESC;
```

---

## 7. Migration Path

### From Other Analytics Services
If migrating from Google Analytics, Mixpanel, etc.:

1. Keep old analytics service running
2. Implement custom events endpoint
3. Create import script for historical data
4. Run in parallel for validation
5. Sunset old service after comparison

---

## 8. Future Enhancements

### Suggested Endpoints
```
GET /api/analytics/compare?from=2024-01-01&to=2024-01-31
POST /api/analytics/events (custom events)
GET /api/analytics/cohorts
GET /api/analytics/funnel
POST /api/analytics/export?format=csv
```

### Webhook Support
```
POST /api/analytics/webhooks (receive external events)
GET /api/analytics/webhooks (list configured webhooks)
```

---

**Last Updated**: January 2, 2026
**Version**: 1.0
**Status**: Production Ready

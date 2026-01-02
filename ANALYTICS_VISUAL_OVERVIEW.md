# Analytics System - Visual Overview

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your Website                              │
│                    (All Pages/Routes)                            │
└───────────────────┬──────────────────────────────────────────────┘
                    │
                    │ Page Navigation
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│            AnalyticsTracker Component                            │
│         (Client-side, in layout.js)                             │
│  • Detects route changes                                         │
│  • Generates session ID                                          │
│  • Sends tracking data                                           │
└───────────────────┬──────────────────────────────────────────────┘
                    │
                    │ POST /api/analytics/track
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│        Analytics Tracking API Endpoint                           │
│     (/app/api/analytics/track/route.js)                         │
│                                                                   │
│  • Gets IP address from headers                                  │
│  • Detects device type (desktop/mobile/tablet)                  │
│  • Detects browser (Chrome/Safari/Firefox/Edge)                 │
│  • Calls geolocation API (ip-api.com)                           │
│  • Gets country, country code, city                             │
│  • Prepares data for database                                   │
└───────────────────┬──────────────────────────────────────────────┘
                    │
                    │ INSERT analytics event
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL Database                        │
│            analytics_events Table                                │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ id | created_at | page_path | country | city | device_type │ │
│ │ browser | referrer | ip_address | session_id | user_id      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ Indexes:                                                          │
│ • idx_analytics_created_at (timeline queries)                   │
│ • idx_analytics_country (country aggregations)                  │
│ • idx_analytics_page_path (page rankings)                       │
│ • idx_analytics_session_id (unique visitors)                    │
│ • idx_analytics_device_type (device breakdown)                  │
└───────────────────┬──────────────────────────────────────────────┘
                    │
                    │ GET /api/analytics/data
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│       Analytics Data Aggregation API Endpoint                   │
│     (/app/api/analytics/data/route.js)                          │
│                                                                   │
│  • Queries data for last N days                                 │
│  • Calculates statistics                                        │
│  • Groups by country, device, browser, page, city              │
│  • Generates timeline data (daily)                              │
│  • Returns formatted JSON                                       │
└───────────────────┬──────────────────────────────────────────────┘
                    │
                    │ JSON response with analytics data
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│          Admin Dashboard - Visitors Tab                          │
│      (/app/debug/data/page.tsx)                                 │
│                                                                   │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │ 📊 Total Visits  │ │ 👥 Unique Visitors│ │ 🌍 Countries    │ │
│  │      1,250       │ │       342         │ │       47        │ │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│                                                                   │
│  📈 Line Chart         📱 Pie Chart          🗺️ Bar Chart        │
│  Visits Timeline    Device Breakdown      Top Countries          │
│                                                                   │
│  📊 Bar Chart         🌐 Pie Chart         🏙️ Top Cities        │
│  Top Pages         Browser Distribution                          │
│                                                                   │
│  📋 Table: Recent 20 Visitors                                    │
│  Time | Location | Page | Device | Browser                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Dashboard Visualization

```
┌────────────────────────────────────────────────────────────┐
│ ADMIN DASHBOARD - VISITORS TAB                             │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 KEY METRICS                                            │
│  ┌─────────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐ │
│  │Total Visits │ │Unique    │ │Countries│Avg. Duration │ │
│  │   1,250     │ │Visitors  │ │   47   │    145 sec   │ │
│  │             │ │   342    │ │        │              │ │
│  └─────────────┘ └──────────┘ └────────┘ └──────────────┘ │
│                                                             │
│  📈 CHARTS                                                 │
│  ┌────────────────────────────┐ ┌──────────────────────┐   │
│  │ Visits Over Time (Line)    │ │Device Breakdown(Pie)│   │
│  │       /\                   │ │     ◐ Mobile        │   │
│  │      /  \  /\              │ │     ◐ Tablet        │   │
│  │     /    \/  \   /\        │ │     ◑ Desktop       │   │
│  │ Jan 1 2 3 4 5 6 7          │ │                      │   │
│  └────────────────────────────┘ └──────────────────────┘   │
│                                                             │
│  ┌────────────────────────────┐ ┌──────────────────────┐   │
│  │Top Countries (Bar)         │ │Top Pages (Bar)       │   │
│  │ USA       ███████████ 650  │ │ /          ███ 450  │   │
│  │ UK        ████ 180         │ │ /dashboard ██ 280  │   │
│  │ India     ███ 120          │ │ /jobs      ██ 220  │   │
│  │ Canada    ██ 100           │ │ /blog      █ 100   │   │
│  └────────────────────────────┘ └──────────────────────┘   │
│                                                             │
│  ┌────────────────────────────┐ ┌──────────────────────┐   │
│  │Browser Distribution (Pie)  │ │Top Cities            │   │
│  │     ◐ Chrome               │ │ New York, US    180 │   │
│  │     ◐ Safari               │ │ Los Angeles, US 120 │   │
│  │     ◑ Firefox              │ │ London, UK       95 │   │
│  │     ◐ Edge                 │ │ Toronto, CA       80 │   │
│  └────────────────────────────┘ └──────────────────────┘   │
│                                                             │
│  👥 RECENT VISITORS                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │Time       │Location     │Page  │Device │Browser    │   │
│  │2:30 PM    │New York, US│/jobs │Mobile │Chrome     │   │
│  │2:29 PM    │London, UK  │/     │Desktop│Safari     │   │
│  │2:28 PM    │Toronto, CA │/dash │Tablet │Chrome     │   │
│  │2:27 PM    │Sydney, AU  │/blog │Mobile │Firefox    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Page Visit Tracking Flow
```
1. User visits /dashboard
                ↓
2. AnalyticsTracker detects route change
                ↓
3. Component fetches localStorage for session_id
   If not found, creates new one:
   "session_1704185400000_ab3c2d1e"
                ↓
4. Sends POST to /api/analytics/track with:
   {
     page_path: "/dashboard",
     referrer: "https://google.com",
     session_id: "session_1704185400000_ab3c2d1e"
   }
                ↓
5. API receives request:
   - Gets IP from headers: "203.45.67.89"
   - Parses User-Agent → device: "desktop", browser: "Chrome"
                ↓
6. API calls ip-api.com:
   "http://ip-api.com/json/203.45.67.89"
   Response: { country: "US", countryCode: "US", city: "New York" }
                ↓
7. API inserts into analytics_events:
   {
     page_path: "/dashboard",
     country: "United States",
     country_code: "US",
     city: "New York",
     device_type: "desktop",
     browser: "Chrome",
     referrer: "https://google.com",
     ip_address: "203.45.67.89",
     session_id: "session_1704185400000_ab3c2d1e",
     created_at: "2024-01-02T14:30:45Z"
   }
                ↓
8. Record saved with auto-generated UUID
```

---

## 📊 Data Aggregation Flow

### Analytics Data Retrieval
```
Dashboard calls GET /api/analytics/data?days=30
                ↓
API queries analytics_events:
  WHERE created_at >= (now - 30 days)
                ↓
Aggregations performed:
  • COUNT(*) → totalVisits
  • COUNT(DISTINCT session_id) → uniqueVisitors
  • COUNT(DISTINCT country) → uniqueCountries
  • AVG(duration_seconds) → avgVisitDuration
                ↓
Grouping queries:
  • GROUP BY country → countryData
  • GROUP BY device_type → deviceData
  • GROUP BY browser → browserData
  • GROUP BY page_path → topPages
  • GROUP BY DATE(created_at) → timelineData
  • GROUP BY city → topCities
                ↓
Final JSON response sent to Dashboard
                ↓
Recharts visualizes the data with:
  • LineChart (timeline)
  • BarChart (countries, pages, cities)
  • PieChart (devices, browsers)
  • Tables (recent visitors, top cities)
```

---

## 📈 Metrics Calculation Examples

### Total Visits
```
SELECT COUNT(*) as total_visits 
FROM analytics_events 
WHERE created_at >= now() - INTERVAL '30 days'

Result: 1,250 visits
```

### Unique Visitors
```
SELECT COUNT(DISTINCT session_id) as unique_visitors 
FROM analytics_events 
WHERE created_at >= now() - INTERVAL '30 days'

Result: 342 unique sessions
```

### Visits by Country
```
SELECT country, COUNT(*) as visitors 
FROM analytics_events 
WHERE created_at >= now() - INTERVAL '30 days'
GROUP BY country 
ORDER BY visitors DESC

Results:
- United States: 650
- United Kingdom: 180
- India: 120
- ...
```

### Device Distribution
```
SELECT device_type, COUNT(*) as visitors 
FROM analytics_events 
WHERE created_at >= now() - INTERVAL '30 days'
GROUP BY device_type 
ORDER BY visitors DESC

Results:
- desktop: 580
- mobile: 450
- tablet: 220
```

### Daily Visits (Timeline)
```
SELECT DATE(created_at), COUNT(*) as visits 
FROM analytics_events 
WHERE created_at >= now() - INTERVAL '30 days'
GROUP BY DATE(created_at) 
ORDER BY DATE ASC

Results:
- 2024-01-01: 42 visits
- 2024-01-02: 58 visits
- 2024-01-03: 51 visits
- ...
```

---

## 🎯 Sidebar Integration

```
Admin Dashboard Sidebar:
├── 🏠 Overview
├── 🌍 Visitors        ← NEW!
├── 👥 Users
├── 💼 Jobs
├── 📧 Applications
├── 📹 Interviews
├── 📝 Activity Logs
└── ⚙️  Control
```

---

## 💾 Database Schema

```
Table: analytics_events

┌─────────────────────────────────────────────────────────┐
│ Column           │ Type        │ Index │ Notes           │
├─────────────────────────────────────────────────────────┤
│ id              │ UUID        │ ✓ PK  │ Primary Key     │
│ created_at      │ TIMESTAMP   │ ✓     │ With timezone   │
│ page_path       │ VARCHAR(255)│ ✓     │ URL path        │
│ country         │ VARCHAR(100)│ ✓     │ Country name    │
│ country_code    │ VARCHAR(10) │       │ ISO code        │
│ city            │ VARCHAR(100)│       │ City name       │
│ device_type     │ VARCHAR(50) │ ✓     │ Device type     │
│ browser         │ VARCHAR(100)│       │ Browser name    │
│ referrer        │ TEXT        │       │ HTTP referrer   │
│ ip_address      │ VARCHAR(45) │       │ Visitor IP      │
│ user_agent      │ TEXT        │       │ Full UA string  │
│ session_id      │ VARCHAR(255)│ ✓     │ Session ID      │
│ user_id         │ UUID (FK)   │       │ Auth user (opt) │
│ duration_seconds│ INTEGER     │       │ Time on page    │
└─────────────────────────────────────────────────────────┘

Indexes Created:
✓ idx_analytics_created_at
✓ idx_analytics_country
✓ idx_analytics_page_path
✓ idx_analytics_session_id
✓ idx_analytics_device_type
```

---

## 🔐 Security Model

```
Row Level Security (RLS) Policies:

┌─────────────────────────────────────────┐
│ Action │ Role        │ Allowed │ Reason  │
├─────────────────────────────────────────┤
│ INSERT │ Anonymous   │   ✓     │ Track  │
│        │             │         │ visits │
├─────────────────────────────────────────┤
│ INSERT │ Authenticated│  ✓     │ Allow  │
│        │             │         │ users  │
├─────────────────────────────────────────┤
│ SELECT │ Anonymous   │   ✗     │ Prevent│
│        │             │         │ access │
├─────────────────────────────────────────┤
│ SELECT │ Authenticated│  ✓     │ Admin  │
│        │             │         │ only   │
├─────────────────────────────────────────┤
│ DELETE │ All         │   ✗     │ Immut- │
│        │             │         │ able   │
└─────────────────────────────────────────┘
```

---

## 📱 Responsive Design

```
Desktop (> 1024px):
┌─────────────────────────────────────────────────────────┐
│ Sidebar │ Main Content Area                             │
│         │ ┌─────────────┐ ┌─────────────┐              │
│         │ │ Card 1      │ │ Card 2      │              │
│         │ └─────────────┘ └─────────────┘              │
│         │ ┌─────────────────────────────┐              │
│         │ │ Chart 1 (50%) │ Chart 2 (50%)              │
│         │ └─────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘

Tablet (768px - 1024px):
┌─────────────────────────────────────────┐
│ Menu │ Main Content Area                │
│      │ ┌─────────────────────────────┐ │
│      │ │ Card 1     │ Card 2         │ │
│      │ ├────────────┴────────────────┤ │
│      │ │ Chart 1                    │ │
│      │ ├────────────────────────────┤ │
│      │ │ Chart 2                    │ │
│      │ └────────────────────────────┘ │
└─────────────────────────────────────────┘

Mobile (< 768px):
┌──────────────────────┐
│ ≡ Menu               │
├──────────────────────┤
│ ┌──────────────────┐ │
│ │ Card 1           │ │
│ ├──────────────────┤ │
│ │ Card 2           │ │
│ ├──────────────────┤ │
│ │ Chart 1 (Full W) │ │
│ ├──────────────────┤ │
│ │ Chart 2 (Full W) │ │
│ └──────────────────┘ │
└──────────────────────┘
```

---

## ✨ Key Features Summary

```
✅ Automatic Page Tracking
   └─ No manual code needed in routes

✅ Geolocation Detection
   └─ Country, City, IP lookup

✅ Device & Browser Detection
   └─ Mobile/Tablet/Desktop identification

✅ Session Management
   └─ Unique session IDs per visitor

✅ Beautiful Visualizations
   └─ 7 different chart types

✅ Real-time Dashboard
   └─ Data updates on refresh

✅ Responsive Design
   └─ Works on all devices

✅ Performance Optimized
   └─ Indexed queries, fast response

✅ Privacy-Focused
   └─ No PII stored

✅ Scalable Architecture
   └─ Ready for millions of events
```

---

**This visualization toolkit helps understand how all components work together to deliver powerful analytics insights.**

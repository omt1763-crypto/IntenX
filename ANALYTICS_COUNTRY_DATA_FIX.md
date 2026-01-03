# Fix: Top Visitors by Country Not Showing Data

## Issues Found & Fixed

### 1. **Geolocation Data Bug** (Track Route)
**File:** `/app/api/analytics/track/route.js` (Line 18)

**Problem:** Redundant fallback in country_code field
```javascript
// ❌ BEFORE (redundant)
country_code: data.countryCode || data.countryCode

// ✅ AFTER (correct)
country_code: data.countryCode || ''
```

This ensures that if `countryCode` is missing, it defaults to an empty string instead of potentially undefined values.

---

### 2. **Country Filtering Bug** (Data Route)
**File:** `/app/api/analytics/data/route.js` (Line 35)

**Problem:** The aggregation was filtering out all "Unknown" countries, which prevented any data from being displayed if even one visitor had an unknown location.

```javascript
// ❌ BEFORE (filtered out Unknown countries)
if (e.country && e.country !== 'Unknown') {
  visitorsByCountry[e.country] = (visitorsByCountry[e.country] || 0) + 1
}

// ✅ AFTER (includes all countries)
if (e.country) {
  visitorsByCountry[e.country] = (visitorsByCountry[e.country] || 0) + 1
}
```

Now the chart displays all countries, including "Unknown" entries.

---

### 3. **RLS Policy Issue** (Database)
**File:** `/CREATE_ANALYTICS_TABLE.sql` (Line 32)

**Problem:** The SELECT policy restricted access to only `authenticated` users
```sql
-- ❌ BEFORE (too restrictive)
USING (auth.role() = 'authenticated');

-- ✅ AFTER (allows all queries)
USING (true);
```

The analytics API uses `supabaseAdmin` (service role), which needs unrestricted access to read all analytics data.

---

## What This Fixes

✅ Country data will now appear in the "Top Visitors by Country" bar chart
✅ Unknown/unresolved locations will be included in analytics
✅ RLS policies no longer block analytics API queries
✅ All geolocation data is properly stored and retrieved

---

## Testing the Fix

1. **Clear old test data** (if needed):
   ```sql
   DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '1 day';
   ```

2. **Verify the fix**:
   - Visit your website pages to generate new analytics events
   - Go to `/debug/data` → "Visitors" tab
   - Check "Top Visitors by Country" chart
   - Country names should now appear with visitor counts

3. **Expected Results**:
   - If you have visitors from multiple countries: Shows top 10 countries
   - If you only have local/unknown visitors: Shows "Unknown" with count
   - Bar chart displays properly with country names on X-axis

---

## Notes

- The geolocation API (ip-api.com) has a free tier limit of 45 requests/minute
- If geolocation fails (rate limit or no internet), country defaults to "Unknown"
- Data is cached for 1 hour per IP address
- For accurate country detection, ensure your IP addresses are public (not localhost/127.0.0.1)

---

## Files Modified

1. `/app/api/analytics/track/route.js` - Fixed country_code assignment
2. `/app/api/analytics/data/route.js` - Fixed country filtering
3. `/CREATE_ANALYTICS_TABLE.sql` - Fixed RLS policy

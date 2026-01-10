'use client'

import React, { useMemo, useState } from 'react'
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface CountryData {
  country: string
  visitors: number
  country_code?: string
}

interface WorldVisitorMapProps {
  countryData: CountryData[]
}

const countryFlags: { [key: string]: string } = {
  'Thailand': '🇹🇭',
  'Australia': '🇦🇺',
  'Belgium': '🇧🇪',
  'India': '🇮🇳',
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'Canada': '🇨🇦',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Japan': '🇯🇵',
  'China': '🇨🇳',
  'Brazil': '🇧🇷',
  'Mexico': '🇲🇽',
  'Spain': '🇪🇸',
  'Italy': '🇮🇹',
  'Netherlands': '🇳🇱',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'South Korea': '🇰🇷',
  'Russia': '🇷🇺',
  'Poland': '🇵🇱',
  'Portugal': '🇵🇹',
  'Greece': '🇬🇷',
  'Turkey': '🇹🇷',
  'UAE': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'Singapore': '🇸🇬',
  'Malaysia': '🇲🇾',
  'Indonesia': '🇮🇩',
  'Philippines': '🇵🇭',
  'Vietnam': '🇻🇳',
  'Pakistan': '🇵🇰',
  'Bangladesh': '🇧🇩',
  'Nigeria': '🇳🇬',
  'South Africa': '🇿🇦',
  'Egypt': '🇪🇬',
  'Kenya': '🇰🇪',
  'New Zealand': '🇳🇿',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
  'Peru': '🇵🇪',
}

const WorldVisitorMap: React.FC<WorldVisitorMapProps> = ({ countryData }) => {
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'chart'>('list')
  const [filterCountry, setFilterCountry] = useState('')

  const filteredData = useMemo(() => {
    if (!countryData) return []
    return countryData
      .filter(d => !d.isUnknown)
      .filter(d => d.country.toLowerCase().includes(filterCountry.toLowerCase()))
      .sort((a, b) => b.visitors - a.visitors)
  }, [countryData, filterCountry])

  const totalVisitors = useMemo(() => {
    return filteredData.reduce((sum, d) => sum + d.visitors, 0)
  }, [filteredData])

  const maxVisitors = useMemo(() => {
    return Math.max(...filteredData.map(d => d.visitors), 1)
  }, [filteredData])

  const getIntensity = (visitors: number) => {
    const intensity = (visitors / maxVisitors) * 100
    if (intensity >= 80) return 'bg-blue-900'
    if (intensity >= 60) return 'bg-blue-700'
    if (intensity >= 40) return 'bg-blue-500'
    if (intensity >= 20) return 'bg-blue-300'
    return 'bg-blue-100'
  }

  const getFlag = (country: string) => {
    return countryFlags[country] || '🌍'
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Top Visitors by Country</h2>
          <p className="text-gray-600 text-sm mt-1">Total visitors: <span className="font-bold text-blue-600">{totalVisitors}</span></p>
        </div>
        
        {/* View Mode Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              viewMode === 'map'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🗺️ Map View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📋 List View
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              viewMode === 'chart'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📊 Chart View
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Filter countries..."
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {filterCountry && (
          <button
            onClick={() => setFilterCountry('')}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredData.map((data, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg transition transform hover:scale-105 cursor-pointer ${getIntensity(
                  data.visitors
                )}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{getFlag(data.country)}</span>
                  <span className="text-sm font-bold text-white">
                    {data.country.length > 10 ? data.country.substring(0, 10) + '...' : data.country}
                  </span>
                </div>
                <div className="text-white">
                  <div className="text-2xl font-bold">{data.visitors}</div>
                  <div className="text-xs opacity-90">visitors</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Rank</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Country</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Visitors</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Percentage</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">Visualization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((data, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-900 font-bold">#{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFlag(data.country)}</span>
                        <span className="font-medium text-gray-900">{data.country}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-lg text-blue-600">{data.visitors}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700">
                        {((data.visitors / totalVisitors) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32 h-6 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                          style={{
                            width: `${(data.visitors / maxVisitors) * 100}%`,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={filteredData} margin={{ top: 20, right: 30, left: 200, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="country" type="category" stroke="#6b7280" width={180} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => [
                  <span key="1" className="font-bold text-blue-600">
                    {value} visitors
                  </span>,
                  'Visitors',
                ]}
              />
              <Legend />
              <Bar dataKey="visitors" fill="#3b82f6" radius={[0, 8, 8, 0]} name="Visitors" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-gray-600 text-sm font-medium">Total Visitors</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{totalVisitors}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-gray-600 text-sm font-medium">Countries</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{filteredData.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-gray-600 text-sm font-medium">Top Country</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {filteredData[0]?.country || 'N/A'}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <p className="text-gray-600 text-sm font-medium">Avg per Country</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {filteredData.length > 0 ? (totalVisitors / filteredData.length).toFixed(1) : '0'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default WorldVisitorMap

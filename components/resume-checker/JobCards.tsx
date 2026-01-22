'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, MapPin, Briefcase, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

interface JobMatch {
  id: number;
  job_title: string;
  company_name: string;
  job_description: string;
  job_url: string;
  location: string;
  is_remote: boolean;
  salary_min?: number;
  salary_max?: number;
  required_skills?: string[];
  job_type?: string;
  match_percentage: number;
  apply_readiness_score: number;
  skills_gap?: string[];
  why_match?: string;
  next_steps?: string[];
}

interface JobCardsProps {
  jobs: JobMatch[];
  isLoading?: boolean;
}

export default function JobCards({ jobs, isLoading = false }: JobCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-200 rounded-2xl h-96 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg">No matching jobs found. Try adjusting your preferences.</p>
      </div>
    );
  }

  // Sort by match percentage (highest first)
  const sortedJobs = [...jobs].sort((a, b) => b.match_percentage - a.match_percentage);

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold mb-8 text-gray-900">
        {jobs.length} Job{jobs.length !== 1 ? 's' : ''} Found
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedJobs.map((job, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="h-full"
          >
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col border border-gray-100">
              {/* Header with Match Percentage Circle */}
              <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 p-6 pb-12">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">
                      {job.job_title}
                    </h3>
                    <p className="text-sm text-gray-600 font-medium">{job.company_name}</p>
                  </div>

                  {/* Match Circle */}
                  <div className="relative w-20 h-20 flex-shrink-0 ml-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={
                          job.match_percentage >= 85
                            ? '#10b981'
                            : job.match_percentage >= 70
                              ? '#3b82f6'
                              : job.match_percentage >= 60
                                ? '#f59e0b'
                                : '#ef4444'
                        }
                        strokeWidth="8"
                        strokeDasharray={`${job.match_percentage * 2.83} 283`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">
                        {job.match_percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 px-6 py-4 space-y-3">
                {/* Location & Type */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="flex-1">
                      {job.location} {job.is_remote && '(Remote)'}
                    </span>
                  </div>
                  {job.job_type && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{job.job_type}</span>
                    </div>
                  )}
                  {job.salary_min && job.salary_max && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>
                        ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Required Skills */}
                {job.required_skills && job.required_skills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Required Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {job.required_skills.slice(0, 4).map((skill, i) => (
                        <span
                          key={i}
                          className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.required_skills.length > 4 && (
                        <span className="inline-block px-2 py-1 text-gray-600 text-xs">
                          +{job.required_skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Why Match */}
                {job.why_match && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <p className="text-xs font-semibold text-green-700 mb-1">Why This Match:</p>
                    <p className="text-xs text-green-600 line-clamp-2">{job.why_match}</p>
                  </div>
                )}

                {/* Skills Gap */}
                {job.skills_gap && job.skills_gap.length > 0 && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Skills to Develop:</p>
                    <div className="flex flex-wrap gap-1">
                      {job.skills_gap.slice(0, 3).map((skill, i) => (
                        <span key={i} className="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Readiness Score */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>Apply Readiness</span>
                    <span>{job.apply_readiness_score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        job.apply_readiness_score >= 80
                          ? 'bg-green-500'
                          : job.apply_readiness_score >= 60
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                      }`}
                      style={{ width: `${job.apply_readiness_score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300">
                <a
                  href={job.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center text-white font-semibold text-sm group"
                >
                  View Job Details
                  <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-blue-50 text-gray-700 pt-16 pb-8 border-t border-gray-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Logo & Description */}
          <div className="flex flex-col">
            <div className="mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                IntenX
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                AI-powered adaptive interviewing platform transforming talent acquisition
              </p>
            </div>
            {/* Social Links */}
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-6">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">
                  Case Studies
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-6">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">
                  Partners
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">
                  Newsroom
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-6">Get In Touch</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail size={20} className="text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a href="mailto:support@intenx.com" className="text-gray-700 hover:text-purple-600 transition-colors">
                    support@intenx.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={20} className="text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <a href="tel:+14155552671" className="text-gray-700 hover:text-purple-600 transition-colors">
                    +1 (415) 555-2671
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-gray-700 hover:text-purple-600 transition-colors">
                    San Francisco, CA<br />
                    United States
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Links */}
            <div className="flex flex-wrap gap-6 text-sm">
              <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">
                Cookies
              </a>
            </div>

            {/* Copyright */}
            <div className="text-center text-sm text-gray-600">
              <p>&copy; {currentYear} IntenX. All rights reserved.</p>
            </div>

            {/* Version/Status */}
            <div className="flex justify-end">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-lg text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

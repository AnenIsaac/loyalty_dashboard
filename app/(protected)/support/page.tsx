"use client"

import { Mail, Phone, MessageCircle } from "lucide-react"

export default function SupportPage() {
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support</h1>
          <p className="text-gray-600">Get in touch with our team for assistance</p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Mail className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Email Support</h3>
                <a 
                  href="mailto:zawadii.tz@gmail.com" 
                  className="text-blue-600 hover:text-blue-800 hover:underline text-lg"
                >
                  zawadii.tz@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Phone Support</h3>
                <a 
                  href="tel:+255763860354" 
                  className="text-blue-600 hover:text-blue-800 hover:underline text-lg"
                >
                  +255 763 860 354
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">WhatsApp Support</h3>
                <a 
                  href="https://wa.me/255763860354" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline text-lg"
                >
                  +255 763 860 354
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            We typically respond within 24 hours via email and within 2-4 hours via WhatsApp.
          </p>
        </div>
      </div>
    </div>
  )
} 
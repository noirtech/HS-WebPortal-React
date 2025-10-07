'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Info, Settings } from 'lucide-react'

interface PageInfoBoxProps {
  pageTitle: string
  pageDescription: string
  systemArchitecture: string
  keyFeatures?: string[]
  technicalDetails?: string[]
}

export function PageInfoBox({ 
  pageTitle, 
  pageDescription, 
  systemArchitecture, 
  keyFeatures = [],
  technicalDetails = []
}: PageInfoBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mb-6">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="outline"
        className="w-full justify-between items-center p-4 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span className="font-medium">Click to learn about this page</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {isExpanded && (
        <div className="space-y-4 mt-2 animate-in slide-in-from-top-2 duration-200">
          {/* Page Overview Box */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">?</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-800 mb-1">Page Overview - {pageTitle}</h3>
                  <p className="text-sm text-blue-700">
                    <strong>Purpose:</strong> {pageDescription}
                  </p>
                  {keyFeatures.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-blue-700 font-medium">Key Features:</p>
                      <ul className="text-sm text-blue-700 mt-1 space-y-1">
                        {keyFeatures.map((feature, index) => (
                          <li key={index} className="ml-4 list-disc">{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Infrastructure Information Box */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Settings className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-800 mb-1">System Architecture & Database</h3>
                  <div className="text-sm text-green-700 space-y-2">
                    <p>{systemArchitecture}</p>
                    {technicalDetails.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Technical Details:</p>
                        <ul className="mt-1 space-y-1">
                          {technicalDetails.map((detail, index) => (
                            <li key={index} className="ml-4 list-disc">{detail}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

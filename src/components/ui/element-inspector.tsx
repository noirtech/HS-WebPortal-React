'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from './button'
import { logger } from '@/lib/logger'

interface ElementInspectorProps {
  className?: string
}

export function ElementInspector({ className }: ElementInspectorProps) {
  const pathname = usePathname()
  const [isEnabled, setIsEnabled] = useState(false)
  const [currentLabel, setCurrentLabel] = useState<{
    text: string
    x: number
    y: number
  } | null>(null)
  const [outlinedElement, setOutlinedElement] = useState<HTMLElement | null>(null)
  const [isClient, setIsClient] = useState(false)
  


  useEffect(() => {
    // Set client flag to prevent hydration issues
    setIsClient(true)
    
    logger.debug('Element Inspector useEffect - isEnabled', { isEnabled })
    
    // If inspector is disabled, clear all outlines and labels
    if (!isEnabled) {
      // Remove outline from any currently outlined element
      if (outlinedElement) {
        outlinedElement.style.outline = ''
        outlinedElement.style.outlineOffset = ''
        setOutlinedElement(null)
      }
      setCurrentLabel(null)
      return
    }

    // Function to add click events to all elements with data-element-name
    const addClickEventsToElements = () => {
      const elements = document.querySelectorAll('[data-element-name]')
      logger.debug('Adding click events to elements', { count: elements.length })
      
      elements.forEach(el => {
        const elementName = el.getAttribute('data-element-name')
        if (elementName) {
          // Remove existing listeners to avoid duplicates
          el.removeEventListener('click', handleElementClick)
          
          // Add new listener
          el.addEventListener('click', handleElementClick)
          
          logger.debug('Added click event to element', { elementName })
        }
      })
    }

    const handleElementClick = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      
      const target = e.target as HTMLElement
      const elementName = target.getAttribute('data-element-name')
      
      logger.debug('Element clicked', { elementName, targetTag: target.tagName, targetClasses: target.className })
      
      if (elementName) {
        // Remove previous outline
        if (outlinedElement) {
          outlinedElement.style.outline = ''
          outlinedElement.style.outlineOffset = ''
        }
        
        // Add outline to current element
        target.style.outline = '3px solid #ff0000'
        target.style.outlineOffset = '2px'
        setOutlinedElement(target)
        
        // Set label
        const rect = target.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top - 10
        
        logger.debug('Setting label at position', { x, y })
        
        setCurrentLabel({
          text: elementName,
          x: x,
          y: y
        })
        
        // Keep label and outline visible until next element is clicked
      }
    }

    // Add click events to existing elements with a small delay to ensure DOM is ready
    setTimeout(() => {
      addClickEventsToElements()
    }, 100)

    // Set up mutation observer to handle dynamically added elements
    const observer = new MutationObserver(() => {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        addClickEventsToElements()
      }, 50)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      // Clean up mutation observer
      observer.disconnect()
      
      // Remove all element event listeners
      const elements = document.querySelectorAll('[data-element-name]')
      elements.forEach(el => {
        el.removeEventListener('click', handleElementClick)
      })
      
      // Remove outline from any outlined element
      if (outlinedElement) {
        outlinedElement.style.outline = ''
        outlinedElement.style.outlineOffset = ''
      }
    }
  }, [isEnabled, outlinedElement])

  // Separate effect to handle inspector disable - ensures all outlines are removed
  useEffect(() => {
    if (!isEnabled && outlinedElement) {
      logger.debug('Inspector disabled - removing outline from element', { outlinedElement })
      outlinedElement.style.outline = ''
      outlinedElement.style.outlineOffset = ''
      setOutlinedElement(null)
    }
  }, [isEnabled, outlinedElement])

  const toggleInspector = () => {
    setIsEnabled(!isEnabled)
  }

  // Don't render until client-side to prevent hydration issues
  if (!isClient) {
    return null
  }

  // Hide inspector on mobile-dockwalk-2-old page
  if (pathname?.includes('/mobile-dockwalk-2-old')) {
    return null
  }

  return (
    <>
      {/* Toggle Button - Clear State Indication */}
      <Button
        onClick={toggleInspector}
        variant={isEnabled ? "default" : "outline"}
        size="sm"
        className={`fixed top-6 left-[100px] z-[9999] transition-all duration-200 ${
          isEnabled 
            ? 'bg-green-600/40 hover:bg-green-700/60 text-white shadow-lg backdrop-blur-sm' 
            : 'bg-red-600/40 hover:bg-red-700/60 text-white shadow-lg backdrop-blur-sm'
        }`}
        title={isEnabled ? 'Element Inspector: ACTIVE (Click to disable)' : 'Element Inspector: DISABLED (Click to enable)'}
      >
        {isEnabled ? (
          <>
            <Eye className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Inspector ON</span>
            <span className="sm:hidden">ON</span>
          </>
        ) : (
          <>
            <EyeOff className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Inspector OFF</span>
            <span className="sm:hidden">OFF</span>
          </>
        )}
      </Button>

      {/* Floating Label */}
      {isEnabled && currentLabel && (
        <div
          className="fixed z-[9998] px-4 py-3 text-sm text-white bg-gradient-to-r from-red-600 to-pink-600 rounded-xl shadow-2xl pointer-events-none border-2 border-white"
          style={{
            left: currentLabel.x + 15,
            top: currentLabel.y - 10,
            maxWidth: '300px',
            wordBreak: 'break-word'
          }}
        >
          <div className="font-mono font-medium text-white text-base">
            🔍 {currentLabel.text}
          </div>
                     <div className="text-xs text-white mt-2 opacity-90">
             🔍 Click another element to change selection
           </div>
        </div>
      )}

      {/* Global Status Indicator */}
      {isEnabled && (
        <div className="fixed bottom-4 right-4 z-[9997] bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
          🔍 Element Inspector: ACTIVE
          <br />
                     <span className="text-xs opacity-90">
             🔍 Click elements to select & highlight
           </span>
        </div>
      )}
      
      {!isEnabled && (
        <div className="fixed bottom-4 right-4 z-[9997] bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
          🔍 Element Inspector: DISABLED - Click button to enable
        </div>
      )}
    </>
  )
}

import React, { useState, useRef, useEffect } from 'react'

const Select = ({ options, value, onChange, placeholder = 'Select...', className = '' }) => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (optionValue) => {
        onChange(optionValue)
        setIsOpen(false)
    }

    const selectedOption = options.find((opt) => opt.value === value)

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-md px-3 py-1.5 flex items-center justify-between gap-2 transition-colors min-w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full min-w-[140px] max-h-64 overflow-y-auto bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 py-1">
                    {options.length === 0 ? (
                        <div className="px-4 py-2 text-zinc-500 text-sm">No options</div>
                    ) : (
                        options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 transition-colors flex items-center justify-between ${value === option.value ? 'text-indigo-400 bg-zinc-700/50 font-medium' : 'text-zinc-300'
                                    }`}
                            >
                                <span className="truncate">{option.label}</span>
                                {value === option.value && (
                                    <svg className="w-4 h-4 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export default Select

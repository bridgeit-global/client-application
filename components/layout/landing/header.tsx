'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Logo from '@/components/logo';
export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (
        <header className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-sm border-b border-white/10">
            <div className="container">
                <div className="flex h-16 items-center justify-between md:px-0">
                    <div className="flex items-center space-x-4">
                        

                        <Link href="/" className="flex items-center space-x-2">
                            <Logo />
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                        <Link href="/signup" className="hover:text-yellow-500">
                            <Button variant="outline" size="sm" className="text-sm text-white bg-white/5 border-white/30 hover:bg-white/10">Contact Us</Button>
                        </Link>
                        <Link href="/login" className="text-yellow-50">
                            <Button variant="default" size="sm" className="text-sm bg-primary text-primary-foreground hover:bg-primary/90">Login</Button>
                        </Link>
                    </div>

                    {/* Mobile navigation menu */}
                    <div className={`md:hidden fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className={`bg-gray-900 text-white h-full w-64 p-4 transform transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                            <div className="flex justify-between items-center mb-8">
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg"
                                    aria-label="Close menu"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex flex-col space-y-4">
                                <Link href="/signup" className="hover:text-yellow-500" onClick={() => setIsMenuOpen(false)}>
                                    <Button variant="outline" className="w-full text-white bg-white/5 border-white/30 hover:bg-white/10">Contact Us</Button>
                                </Link>
                                <Link href="/login" className="hover:text-yellow-500" onClick={() => setIsMenuOpen(false)}>
                                    <Button variant="default" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Login</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

import React from 'react'
import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="relative">
            {/* Mesh overlay */}
            <div className="absolute inset-0 bg-theme-mesh pointer-events-none" />
            
            <div className="relative bg-white/5 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                        <div className="col-span-2">
                            <h3 className="mb-4 text-lg font-semibold text-white">What We Do</h3>
                            <p className="text-white/80 text-sm leading-relaxed">
                                We specialize in transforming how businesses handle their
                                energy data. Our platform automates bill processing, provides
                                deep analytical insights, and helps organizations make
                                data-driven decisions about their energy consumption. From
                                automated bill discovery to comprehensive energy analytics,
                                we&apos;re your partner in energy management excellence.
                            </p>
                        </div>
                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-white/80">
                                Resources
                            </h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link
                                        href="#"
                                        className="text-white/60 hover:text-primary transition-colors"
                                    >
                                        Blog
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="text-white/60 hover:text-primary transition-colors"
                                    >
                                        Documentation
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="text-white/60 hover:text-primary transition-colors"
                                    >
                                        FAQ
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-white/80">Legal</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link
                                        href="/privacy-policy"
                                        className="text-white/60 hover:text-primary transition-colors"
                                    >
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/term-of-service"
                                        className="text-white/60 hover:text-primary transition-colors"
                                    >
                                        Terms of Service
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/cookie-policy"
                                        className="text-white/60 hover:text-primary transition-colors"
                                    >
                                        Cookie Policy
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 border-t border-white/10 pt-8">
                        <p className="text-white/60">
                            &copy; {new Date().getFullYear()} BridgeIT. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

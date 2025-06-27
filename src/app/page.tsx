'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="relative px-4 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src={'./doubtItSmallLogo.png'}/>
          </div>
          <span className="text-2xl font-bold text-gray-900">DoubtIt</span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8">
          <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
          <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">How It Works</a>
          <a href="#vision" className="text-gray-600 hover:text-blue-600 transition-colors">Vision</a>
          <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Admin Login
          </Link>
        </div>

        {/* Mobile menu button */}
        <button 
          className="lg:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-b shadow-sm">
          <div className="px-4 py-2 space-y-2">
            <a href="#features" className="block py-2 text-gray-600 hover:text-blue-600">Features</a>
            <a href="#how-it-works" className="block py-2 text-gray-600 hover:text-blue-600">How It Works</a>
            <a href="#vision" className="block py-2 text-gray-600 hover:text-blue-600">Vision</a>
            <Link href="/login" className="block w-full text-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mt-2">
              Admin Login
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="px-4 py-20 text-center">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Where AI and Human
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {" "}Expertise Converge
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            DoubtIt is an intelligent developer support platform that seamlessly bridges AI assistance with human expertise. 
            Get instant answers from our AI, with the option to connect with human experts when needed.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <a 
              href="https://t.me/Doubt_It_Bot" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              🤖 Try Our Bot on Telegram
            </a>
            <Link 
              href="/login"
              className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-600 hover:text-white transition-all"
            >
              Admin Dashboard
            </Link>
          </div>

          {/* Hero Image Placeholder */}
          <div className="relative mx-auto max-w-4xl">
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl shadow-2xl p-8 h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">DoubtIt Platform</h3>
                <p className="text-gray-600">AI + Human Support Platform</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16">
            Powerful Features for Modern Support
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* For Developers */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-lg">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">👨‍💻</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Developers</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> AI-First Assistance with Gemini</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Telegram Integration</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Expert Takeover on Demand</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Continuous Learning System</li>
              </ul>
            </div>

            {/* For Support Teams */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl shadow-lg">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Support Teams</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Comprehensive Dashboard</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Full Conversation Context</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> AI Handles Routine Questions</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Real-time Analytics</li>
              </ul>
            </div>

            {/* Tech Stack */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl shadow-lg md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Modern Tech Stack</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Next.js 15 & React 19</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Supabase Database</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Google Gemini AI</li>
                <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Deployed on Vercel</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-4 py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16">
            How DoubtIt Works
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-white font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Ask Your Question</h3>
              <p className="text-gray-600">Send your technical question to our Telegram bot - it's that simple!</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-white font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI Analyzes & Responds</h3>
              <p className="text-gray-600">Our Gemini AI processes your query against Aptos documentation and provides accurate answers.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-white font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Need More Help?</h3>
              <p className="text-gray-600">Simply type "agent" to connect with a human expert who can see your full conversation.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-white font-bold">4</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Expert Takeover</h3>
              <p className="text-gray-600">Human experts provide specialized assistance and close the conversation when resolved.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="px-4 py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            Our Vision
          </h2>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            We envision a developer support ecosystem where knowledge flows freely between AI systems and human experts, 
            response times decrease while solution quality increases, and support teams scale effectively by focusing on complex problems.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">🚀 Starting Point</h3>
              <p className="text-gray-600">
                Beginning with the Aptos blockchain ecosystem, we're proving that AI and human expertise can work together seamlessly.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">🌟 Future Impact</h3>
              <p className="text-gray-600">
                Our approach can be applied to any technical domain where rapid, accurate support is critical for developer success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Ready to Experience Better Support?
          </h2>
          <p className="text-xl mb-12 opacity-90">
            Join developers who are already getting faster, more accurate support with DoubtIt.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a 
              href="https://t.me/Doubt_It_Bot" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              🚀 Start Chatting Now
            </a>
            <Link 
              href="/login"
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all"
            >
              Access Admin Panel
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 bg-gray-900 text-gray-300">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img src={'./doubtItSmallLogo.png'}/>
              </div>
              <span className="text-xl font-bold text-white">DoubtIt</span>
            </div>
            
            <div className="text-center md:text-right">
              <p className="mb-2">© 2024 DoubtIt. All rights reserved.</p>
              <p className="text-sm opacity-75">Licensed under Mozilla Public License v2.0</p>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-700 text-center">
            <p className="italic opacity-75">
              "Where AI and human expertise converge to power developer success."
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
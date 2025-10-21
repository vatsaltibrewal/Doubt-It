'use client';

import { Suspense } from 'react';
import AuthToast from '@/components/AuthToast';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#101218] text-white">

      <Suspense fallback={null}>
        <AuthToast />
      </Suspense>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="flex lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 border-2 border-black bg-[#0F1116] p-6 md:p-10 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            <h1 className="text-4xl md:text-6xl font-black leading-tight text-center">
              Where <span className="bg-[#FDE047] text-black px-2">AI</span> & Human <span className="bg-[#22D3EE] text-black px-2">Expertise</span> Converge
            </h1>
            <p className="mt-4 text-gray-300 text-lg md:text-xl text-center">
              DoubtIt is a developer support platform that blends fast AI responses
              with seamless expert takeover — all inside Telegram and your web workspace.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row justify-center">
              <a
                href="https://t.me/Doubt_It_Bot"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#FDE047] text-black font-extrabold border-2 border-black px-6 py-3 shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                🤖 Try the Telegram Bot
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight">Powerful Features for Modern Support</h2>
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon="👨‍💻"
            title="For Developers"
            items={[
              'AI-first assistance (Gemini)',
              'Telegram integration',
              'Expert takeover on demand',
              'Continuous learning',
            ]}
            accent="bg-[#22D3EE]"
          />
          <FeatureCard
            icon="🎯"
            title="For Support Teams"
            items={[
              'Human Agent Console',
              'Full conversation context',
              'AI handles routine queries',
              'Real-time analytics',
            ]}
            accent="bg-[#8B5CF6]"
          />
          <FeatureCard
            icon="⚡"
            title="Modern Tech Stack"
            items={[
              'Next.js + Express.js',
              'Cognito + Lambda auth',
              'DynamoDB + API Gateway WebSocket',
              'Gemini AI agent + Telegram Bot',
            ]}
            accent="bg-[#FDE047]"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight">How DoubtIt Works</h2>

        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { n: 1, c: '#22D3EE', t: 'Ask Your Question', d: 'Send a technical question to our Telegram bot.' },
            { n: 2, c: '#34D399', t: 'AI Analyzes & Responds', d: 'Gemini reviews docs/context and replies instantly.' },
            { n: 3, c: '#8B5CF6', t: 'Need More Help?', d: 'Type “agent” to loop in a human expert.' },
            { n: 4, c: '#FDE047', t: 'Expert Takeover', d: 'Humans handle edge-cases and close the chat.' },
          ].map((step) => (
            <div
              key={step.n}
              className="text-center border-2 border-black bg-[#0F1116] p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
            >
              <div
                className="w-14 h-14 rounded-full mx-auto flex items-center justify-center border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                style={{ backgroundColor: step.c }}
              >
                <span className="text-black font-black">{step.n}</span>
              </div>
              <h3 className="mt-4 font-black">{step.t}</h3>
              <p className="text-gray-300 text-sm mt-1">{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vision */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border-2 border-black bg-[#0F1116] p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black">🚀 Starting Point</h3>
            <p className="text-gray-300 mt-2">
              We’re proving that AI + humans can co-pilot developer support seamlessly — beginning with
              ecosystems that demand fast, accurate answers.
            </p>
          </div>
          <div className="border-2 border-black bg-[#0F1116] p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black">🌟 Future Impact</h3>
            <p className="text-gray-300 mt-2">
              The approach generalizes to any domain where clarity and speed matter — with a UI that stays bold and legible.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-y-2 border-black bg-[#161A22]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-3xl md:text-4xl font-black">Ready to Experience Better Support?</h2>
          <p className="mt-2 text-gray-300">
            Join developers already getting fast, accurate help with DoubtIt.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://t.me/Doubt_It_Bot"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#FDE047] text-black font-extrabold border-2 border-black px-6 py-3 shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              🚀 Start Chatting Now
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F1116] border-t-2 border-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 border-2 border-black flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <img src="/doubtItSmallLogo.png" alt="D" />
              </div>
              <span className="text-lg font-black">DoubtIt</span>
            </div>

            <div className="text-center md:text-right text-sm text-gray-400">
              <p>© {new Date().getFullYear()} DoubtIt. All rights reserved.</p>
              <p className="opacity-75">Mozilla Public License v2.0</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t-2 border-black text-center text-gray-400 italic">
            “Where AI and human expertise converge to power developer success.”
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  items,
  accent,
}: {
  icon: string;
  title: string;
  items: string[];
  accent: string;
}) {
  return (
    <div className="border-2 border-black bg-[#0F1116] p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 border-2 border-black ${accent} flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]`}>
          <span className="text-black text-xl">{icon}</span>
        </div>
        <h3 className="font-black text-xl">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-gray-300">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-[2px] text-black bg-[#34D399] border-2 border-black px-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">✓</span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

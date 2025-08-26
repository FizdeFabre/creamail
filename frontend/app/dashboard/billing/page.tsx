"use client";

import Link from "next/link";
import { useCallback } from "react";
import SubscribeButton from "@/app/components/SubscribeButton";
import SubscribeButtonUltimate from "@/app/components/SubscribeButtonUltimate";
const plans = [
    {
        title: "Standard",
        price: "Free",
        features: ["Up to 2 sequences", "10 emails / month"],
        cta: "Start for Free",
        color: "border-blue-300 text-blue-700",
        isPremium: false,
        isUltimate: false,
    },
    {
        title: "Pro",
        price: "€20",
        features: ["5000 emails / month", "60 sequences "],
        cta: "Subscribe (Stripe)",
        color: "border-indigo-600 text-indigo-600",
        isPremium: true,
        isUltimate: false,
    },
    {
        title: "Ultimate",
        price: "€50",
        features: [
            "Unlimited sequences",
            "Unlimited emails",
            "Advanced data center access",
            "Priority support",
        ],
        cta: "Subscribe (Stripe)",
        color: "border-yellow-40 text-yellow-400",
        isPremium: false, // Future plan
        isUltimate: true,
    },
];


export default function BailingPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 px-6 py-20 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
                <h2 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
                    Pricing
                </h2>
                <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
                    Choose your path, young wizard
                </p>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                    Each upgrade gives you more power. Pick what suits your quest.
                </p>
            </div>

            <div className="mt-20 grid grid-cols-1 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-0 max-w-6xl mx-auto">
                {plans.map((plan) => (
                    <div
                        key={plan.title}
                        className={`flex flex-col justify-between rounded-2xl border p-6 shadow-sm ${plan.color} dark:border-gray-700 dark:bg-gray-800`}
                    >
                        <div>
                            <h3 className="text-lg font-semibold">{plan.title}</h3>
                            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                {plan.price}
                                <span className="text-base font-medium text-gray-500 dark:text-gray-400"> / month</span>
                            </p>
                            <ul className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start">
                                        <span className="mr-2 text-green-600 dark:text-green-400">✓</span> {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-8 align-content: center">
                            {plan.isPremium ? (
                                <SubscribeButton />
                            ) : plan.isUltimate ? (
                                <SubscribeButtonUltimate />
                            ) : (
                                <Link
                                    href="#"
                                    className="inline-block rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors 
align-content: center"
                                >
                                    {plan.cta}
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
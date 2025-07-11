'use client';

import { useUI } from '@react-zero-ui/core';

const variants = [
	// Basic theme variants - background colors
	'theme-light:bg-gray-100',
	'theme-light:bg-gray-200',
	'theme-light:bg-gray-300',
	'theme-light:bg-gray-400',
	'theme-light:bg-gray-500',
	'theme-light:bg-gray-600',
	'theme-light:bg-gray-700',
	'theme-light:bg-gray-800',
	'theme-light:bg-gray-900',
	'theme-dark:bg-gray-100',
	'theme-dark:bg-gray-200',
	'theme-dark:bg-gray-300',
	'theme-dark:bg-gray-400',
	'theme-dark:bg-gray-500',
	'theme-dark:bg-gray-600',
	'theme-dark:bg-gray-700',
	'theme-dark:bg-gray-800',
	'theme-dark:bg-gray-900',

	// More background colors
	'theme-light:bg-red-100',
	'theme-light:bg-red-200',
	'theme-light:bg-red-300',
	'theme-light:bg-red-400',
	'theme-light:bg-red-500',
	'theme-light:bg-red-600',
	'theme-light:bg-red-700',
	'theme-light:bg-red-800',
	'theme-light:bg-red-900',
	'theme-light:bg-blue-100',
	'theme-light:bg-blue-200',
	'theme-light:bg-blue-300',
	'theme-light:bg-blue-400',
	'theme-light:bg-blue-500',
	'theme-light:bg-blue-600',
	'theme-light:bg-blue-700',
	'theme-light:bg-blue-800',
	'theme-light:bg-blue-900',
	'theme-light:bg-green-100',
	'theme-light:bg-green-200',
	'theme-light:bg-green-300',
	'theme-light:bg-green-400',
	'theme-light:bg-green-500',
	'theme-light:bg-green-600',
	'theme-light:bg-green-700',
	'theme-light:bg-green-800',
	'theme-light:bg-green-900',
	'theme-light:bg-yellow-100',
	'theme-light:bg-yellow-200',
	'theme-light:bg-yellow-300',
	'theme-light:bg-yellow-400',
	'theme-light:bg-yellow-500',
	'theme-light:bg-yellow-600',
	'theme-light:bg-yellow-700',
	'theme-light:bg-yellow-800',
	'theme-light:bg-yellow-900',
	'theme-light:bg-purple-100',
	'theme-light:bg-purple-200',
	'theme-light:bg-purple-300',
	'theme-light:bg-purple-400',
	'theme-light:bg-purple-500',
	'theme-light:bg-purple-600',
	'theme-light:bg-purple-700',
	'theme-light:bg-purple-800',
	'theme-light:bg-purple-900',
	'theme-light:bg-pink-100',
	'theme-light:bg-pink-200',
	'theme-light:bg-pink-300',
	'theme-light:bg-pink-400',
	'theme-light:bg-pink-500',
	'theme-light:bg-pink-600',
	'theme-light:bg-pink-700',
	'theme-light:bg-pink-800',
	'theme-light:bg-pink-900',
	'theme-light:bg-indigo-100',
	'theme-light:bg-indigo-200',
	'theme-light:bg-indigo-300',
	'theme-light:bg-indigo-400',
	'theme-light:bg-indigo-500',
	'theme-light:bg-indigo-600',
	'theme-light:bg-indigo-700',
	'theme-light:bg-indigo-800',
	'theme-light:bg-indigo-900',

	// Dark theme background colors
	'theme-dark:bg-red-100',
	'theme-dark:bg-red-200',
	'theme-dark:bg-red-300',
	'theme-dark:bg-red-400',
	'theme-dark:bg-red-500',
	'theme-dark:bg-red-600',
	'theme-dark:bg-red-700',
	'theme-dark:bg-red-800',
	'theme-dark:bg-red-900',
	'theme-dark:bg-blue-100',
	'theme-dark:bg-blue-200',
	'theme-dark:bg-blue-300',
	'theme-dark:bg-blue-400',
	'theme-dark:bg-blue-500',
	'theme-dark:bg-blue-600',
	'theme-dark:bg-blue-700',
	'theme-dark:bg-blue-800',
	'theme-dark:bg-blue-900',
	'theme-dark:bg-green-100',
	'theme-dark:bg-green-200',
	'theme-dark:bg-green-300',
	'theme-dark:bg-green-400',
	'theme-dark:bg-green-500',
	'theme-dark:bg-green-600',
	'theme-dark:bg-green-700',
	'theme-dark:bg-green-800',
	'theme-dark:bg-green-900',

	// Text colors
	'theme-light:text-gray-100',
	'theme-light:text-gray-200',
	'theme-light:text-gray-300',
	'theme-light:text-gray-400',
	'theme-light:text-gray-500',
	'theme-light:text-gray-600',
	'theme-light:text-gray-700',
	'theme-light:text-gray-800',
	'theme-light:text-gray-900',
	'theme-light:text-red-100',
	'theme-light:text-red-200',
	'theme-light:text-red-300',
	'theme-light:text-red-400',
	'theme-light:text-red-500',
	'theme-light:text-red-600',
	'theme-light:text-red-700',
	'theme-light:text-red-800',
	'theme-light:text-red-900',
	'theme-light:text-blue-100',
	'theme-light:text-blue-200',
	'theme-light:text-blue-300',
	'theme-light:text-blue-400',
	'theme-light:text-blue-500',
	'theme-light:text-blue-600',
	'theme-light:text-blue-700',
	'theme-light:text-blue-800',
	'theme-light:text-blue-900',
	'theme-dark:text-gray-100',
	'theme-dark:text-gray-200',
	'theme-dark:text-gray-300',
	'theme-dark:text-gray-400',
	'theme-dark:text-gray-500',
	'theme-dark:text-red-100',
	'theme-dark:text-red-200',
	'theme-dark:text-red-300',
	'theme-dark:text-red-400',
	'theme-dark:text-red-500',
	'theme-dark:text-blue-100',
	'theme-dark:text-blue-200',
	'theme-dark:text-blue-300',
	'theme-dark:text-blue-400',
	'theme-dark:text-blue-500',

	// Border colors
	'theme-light:border-gray-100',
	'theme-light:border-gray-200',
	'theme-light:border-gray-300',
	'theme-light:border-gray-400',
	'theme-light:border-gray-500',
	'theme-light:border-red-100',
	'theme-light:border-red-200',
	'theme-light:border-red-300',
	'theme-light:border-red-400',
	'theme-light:border-red-500',
	'theme-light:border-blue-100',
	'theme-light:border-blue-200',
	'theme-light:border-blue-300',
	'theme-light:border-blue-400',
	'theme-light:border-blue-500',
	'theme-dark:border-gray-100',
	'theme-dark:border-gray-200',
	'theme-dark:border-gray-300',
	'theme-dark:border-gray-400',
	'theme-dark:border-gray-500',
	'theme-dark:border-red-100',
	'theme-dark:border-red-200',
	'theme-dark:border-red-300',
	'theme-dark:border-red-400',
	'theme-dark:border-red-500',

	// Responsive variants with theme
	'sm:theme-light:bg-gray-100',
	'sm:theme-light:bg-gray-200',
	'sm:theme-light:bg-gray-300',
	'sm:theme-light:bg-gray-400',
	'sm:theme-light:bg-gray-500',
	'sm:theme-light:bg-red-100',
	'sm:theme-light:bg-red-200',
	'sm:theme-light:bg-red-300',
	'sm:theme-light:bg-blue-100',
	'sm:theme-light:bg-blue-200',
	'sm:theme-light:bg-blue-300',
	'sm:theme-dark:bg-gray-100',
	'sm:theme-dark:bg-gray-200',
	'sm:theme-dark:bg-gray-300',
	'sm:theme-dark:bg-red-100',
	'sm:theme-dark:bg-red-200',
	'sm:theme-dark:bg-blue-100',
	'sm:theme-dark:bg-blue-200',

	'md:theme-light:bg-gray-100',
	'md:theme-light:bg-gray-200',
	'md:theme-light:bg-gray-300',
	'md:theme-light:bg-gray-400',
	'md:theme-light:bg-gray-500',
	'md:theme-light:bg-red-100',
	'md:theme-light:bg-red-200',
	'md:theme-light:bg-red-300',
	'md:theme-light:bg-blue-100',
	'md:theme-light:bg-blue-200',
	'md:theme-light:bg-blue-300',
	'md:theme-dark:bg-gray-100',
	'md:theme-dark:bg-gray-200',
	'md:theme-dark:bg-gray-300',
	'md:theme-dark:bg-red-100',
	'md:theme-dark:bg-red-200',
	'md:theme-dark:bg-blue-100',

	'lg:theme-light:bg-gray-100',
	'lg:theme-light:bg-gray-200',
	'lg:theme-light:bg-gray-300',
	'lg:theme-light:bg-gray-400',
	'lg:theme-light:bg-gray-500',
	'lg:theme-light:bg-red-100',
	'lg:theme-light:bg-red-200',
	'lg:theme-light:bg-red-300',
	'lg:theme-light:bg-blue-100',
	'lg:theme-light:bg-blue-200',
	'lg:theme-dark:bg-gray-100',
	'lg:theme-dark:bg-gray-200',
	'lg:theme-dark:bg-gray-300',
	'lg:theme-dark:bg-red-100',
	'lg:theme-dark:bg-red-200',

	'xl:theme-light:bg-gray-100',
	'xl:theme-light:bg-gray-200',
	'xl:theme-light:bg-gray-300',
	'xl:theme-light:bg-gray-400',
	'xl:theme-light:bg-gray-500',
	'xl:theme-light:bg-red-100',
	'xl:theme-light:bg-red-200',
	'xl:theme-light:bg-blue-100',
	'xl:theme-light:bg-blue-200',
	'xl:theme-dark:bg-gray-100',
	'xl:theme-dark:bg-gray-200',
	'xl:theme-dark:bg-red-100',
	'xl:theme-dark:bg-red-200',

	'2xl:theme-light:bg-gray-100',
	'2xl:theme-light:bg-gray-200',
	'2xl:theme-light:bg-gray-300',
	'2xl:theme-light:bg-gray-400',
	'2xl:theme-light:bg-gray-500',
	'2xl:theme-light:bg-red-100',
	'2xl:theme-light:bg-red-200',
	'2xl:theme-dark:bg-gray-100',
	'2xl:theme-dark:bg-gray-200',

	// Accent color variants
	'accent-violet:bg-violet-100',
	'accent-violet:bg-violet-200',
	'accent-violet:bg-violet-300',
	'accent-violet:bg-violet-400',
	'accent-violet:bg-violet-500',
	'accent-violet:bg-violet-600',
	'accent-violet:bg-violet-700',
	'accent-violet:bg-violet-800',
	'accent-violet:bg-violet-900',
	'accent-violet:text-violet-100',
	'accent-violet:text-violet-200',
	'accent-violet:text-violet-300',
	'accent-violet:text-violet-400',
	'accent-violet:text-violet-500',
	'accent-violet:text-violet-600',
	'accent-violet:text-violet-700',
	'accent-violet:text-violet-800',
	'accent-violet:text-violet-900',
	'accent-violet:border-violet-100',
	'accent-violet:border-violet-200',
	'accent-violet:border-violet-300',
	'accent-violet:border-violet-400',
	'accent-violet:border-violet-500',
	'accent-violet:border-violet-600',
	'accent-violet:border-violet-700',
	'accent-violet:border-violet-800',
	'accent-violet:border-violet-900',

	'accent-emerald:bg-emerald-100',
	'accent-emerald:bg-emerald-200',
	'accent-emerald:bg-emerald-300',
	'accent-emerald:bg-emerald-400',
	'accent-emerald:bg-emerald-500',
	'accent-emerald:bg-emerald-600',
	'accent-emerald:bg-emerald-700',
	'accent-emerald:bg-emerald-800',
	'accent-emerald:bg-emerald-900',
	'accent-emerald:text-emerald-100',
	'accent-emerald:text-emerald-200',
	'accent-emerald:text-emerald-300',
	'accent-emerald:text-emerald-400',
	'accent-emerald:text-emerald-500',
	'accent-emerald:text-emerald-600',
	'accent-emerald:text-emerald-700',
	'accent-emerald:text-emerald-800',
	'accent-emerald:text-emerald-900',
	'accent-emerald:border-emerald-100',
	'accent-emerald:border-emerald-200',
	'accent-emerald:border-emerald-300',
	'accent-emerald:border-emerald-400',
	'accent-emerald:border-emerald-500',
	'accent-emerald:border-emerald-600',
	'accent-emerald:border-emerald-700',
	'accent-emerald:border-emerald-800',
	'accent-emerald:border-emerald-900',

	'accent-amber:bg-amber-100',
	'accent-amber:bg-amber-200',
	'accent-amber:bg-amber-300',
	'accent-amber:bg-amber-400',
	'accent-amber:bg-amber-500',
	'accent-amber:bg-amber-600',
	'accent-amber:bg-amber-700',
	'accent-amber:bg-amber-800',
	'accent-amber:bg-amber-900',
	'accent-amber:text-amber-100',
	'accent-amber:text-amber-200',
	'accent-amber:text-amber-300',
	'accent-amber:text-amber-400',
	'accent-amber:text-amber-500',
	'accent-amber:text-amber-600',
	'accent-amber:text-amber-700',
	'accent-amber:text-amber-800',
	'accent-amber:text-amber-900',
	'accent-amber:border-amber-100',
	'accent-amber:border-amber-200',
	'accent-amber:border-amber-300',
	'accent-amber:border-amber-400',
	'accent-amber:border-amber-500',
	'accent-amber:border-amber-600',
	'accent-amber:border-amber-700',
	'accent-amber:border-amber-800',
	'accent-amber:border-amber-900',

	// Combined theme and accent variants
	'theme-light:accent-violet:bg-gray-100',
	'theme-light:accent-violet:bg-gray-200',
	'theme-light:accent-violet:bg-gray-300',
	'theme-light:accent-violet:bg-violet-100',
	'theme-light:accent-violet:bg-violet-200',
	'theme-light:accent-violet:bg-violet-300',
	'theme-light:accent-violet:text-gray-100',
	'theme-light:accent-violet:text-gray-200',
	'theme-light:accent-violet:text-violet-100',
	'theme-light:accent-violet:text-violet-200',
	'theme-light:accent-violet:border-gray-100',
	'theme-light:accent-violet:border-violet-100',
	'theme-light:accent-emerald:bg-gray-100',
	'theme-light:accent-emerald:bg-gray-200',
	'theme-light:accent-emerald:bg-emerald-100',
	'theme-light:accent-emerald:bg-emerald-200',
	'theme-light:accent-emerald:text-gray-100',
	'theme-light:accent-emerald:text-emerald-100',
	'theme-light:accent-emerald:border-gray-100',
	'theme-light:accent-emerald:border-emerald-100',
	'theme-light:accent-amber:bg-gray-100',
	'theme-light:accent-amber:bg-gray-200',
	'theme-light:accent-amber:bg-amber-100',
	'theme-light:accent-amber:bg-amber-200',
	'theme-light:accent-amber:text-gray-100',
	'theme-light:accent-amber:text-amber-100',
	'theme-light:accent-amber:border-gray-100',
	'theme-light:accent-amber:border-amber-100',

	'theme-dark:accent-violet:bg-gray-100',
	'theme-dark:accent-violet:bg-gray-200',
	'theme-dark:accent-violet:bg-violet-100',
	'theme-dark:accent-violet:bg-violet-200',
	'theme-dark:accent-violet:text-gray-100',
	'theme-dark:accent-violet:text-violet-100',
	'theme-dark:accent-violet:border-gray-100',
	'theme-dark:accent-violet:border-violet-100',
	'theme-dark:accent-emerald:bg-gray-100',
	'theme-dark:accent-emerald:bg-emerald-100',
	'theme-dark:accent-emerald:text-gray-100',
	'theme-dark:accent-emerald:text-emerald-100',
	'theme-dark:accent-emerald:border-gray-100',
	'theme-dark:accent-emerald:border-emerald-100',
	'theme-dark:accent-amber:bg-gray-100',
	'theme-dark:accent-amber:bg-amber-100',
	'theme-dark:accent-amber:text-gray-100',
	'theme-dark:accent-amber:text-amber-100',
	'theme-dark:accent-amber:border-gray-100',
	'theme-dark:accent-amber:border-amber-100',

	// Responsive + theme + accent combinations
	'sm:theme-light:accent-violet:bg-gray-100',
	'sm:theme-light:accent-violet:bg-violet-100',
	'sm:theme-light:accent-violet:text-gray-100',
	'sm:theme-light:accent-violet:text-violet-100',
	'sm:theme-light:accent-violet:border-gray-100',
	'sm:theme-light:accent-violet:border-violet-100',
	'sm:theme-light:accent-emerald:bg-gray-100',
	'sm:theme-light:accent-emerald:bg-emerald-100',
	'sm:theme-light:accent-emerald:text-gray-100',
	'sm:theme-light:accent-emerald:text-emerald-100',
	'sm:theme-light:accent-emerald:border-gray-100',
	'sm:theme-light:accent-emerald:border-emerald-100',
	'sm:theme-light:accent-amber:bg-gray-100',
	'sm:theme-light:accent-amber:bg-amber-100',
	'sm:theme-light:accent-amber:text-gray-100',
	'sm:theme-light:accent-amber:text-amber-100',
	'sm:theme-light:accent-amber:border-gray-100',
	'sm:theme-light:accent-amber:border-amber-100',
	'sm:theme-dark:accent-violet:bg-gray-100',
	'sm:theme-dark:accent-violet:bg-violet-100',
	'sm:theme-dark:accent-emerald:bg-gray-100',
	'sm:theme-dark:accent-emerald:bg-emerald-100',
	'sm:theme-dark:accent-amber:bg-gray-100',
	'sm:theme-dark:accent-amber:bg-amber-100',

	'md:theme-light:accent-violet:bg-gray-100',
	'md:theme-light:accent-violet:bg-violet-100',
	'md:theme-light:accent-emerald:bg-gray-100',
	'md:theme-light:accent-emerald:bg-emerald-100',
	'md:theme-light:accent-amber:bg-gray-100',
	'md:theme-light:accent-amber:bg-amber-100',
	'md:theme-dark:accent-violet:bg-gray-100',
	'md:theme-dark:accent-violet:bg-violet-100',
	'md:theme-dark:accent-emerald:bg-gray-100',
	'md:theme-dark:accent-emerald:bg-emerald-100',
	'md:theme-dark:accent-amber:bg-gray-100',
	'md:theme-dark:accent-amber:bg-amber-100',

	'lg:theme-light:accent-violet:bg-gray-100',
	'lg:theme-light:accent-violet:bg-violet-100',
	'lg:theme-light:accent-emerald:bg-gray-100',
	'lg:theme-light:accent-emerald:bg-emerald-100',
	'lg:theme-light:accent-amber:bg-gray-100',
	'lg:theme-light:accent-amber:bg-amber-100',
	'lg:theme-dark:accent-violet:bg-gray-100',
	'lg:theme-dark:accent-violet:bg-violet-100',
	'lg:theme-dark:accent-emerald:bg-gray-100',
	'lg:theme-dark:accent-emerald:bg-emerald-100',
	'lg:theme-dark:accent-amber:bg-gray-100',
	'lg:theme-dark:accent-amber:bg-amber-100',

	'xl:theme-light:accent-violet:bg-gray-100',
	'xl:theme-light:accent-violet:bg-violet-100',
	'xl:theme-light:accent-emerald:bg-gray-100',
	'xl:theme-light:accent-emerald:bg-emerald-100',
	'xl:theme-light:accent-amber:bg-gray-100',
	'xl:theme-light:accent-amber:bg-amber-100',
	'xl:theme-dark:accent-violet:bg-gray-100',
	'xl:theme-dark:accent-violet:bg-violet-100',
	'xl:theme-dark:accent-emerald:bg-gray-100',
	'xl:theme-dark:accent-emerald:bg-emerald-100',
	'xl:theme-dark:accent-amber:bg-gray-100',
	'xl:theme-dark:accent-amber:bg-amber-100',

	'2xl:theme-light:accent-violet:bg-gray-100',
	'2xl:theme-light:accent-violet:bg-violet-100',
	'2xl:theme-light:accent-emerald:bg-gray-100',
	'2xl:theme-light:accent-emerald:bg-emerald-100',
	'2xl:theme-light:accent-amber:bg-gray-100',
	'2xl:theme-light:accent-amber:bg-amber-100',
	'2xl:theme-dark:accent-violet:bg-gray-100',
	'2xl:theme-dark:accent-violet:bg-violet-100',
	'2xl:theme-dark:accent-emerald:bg-gray-100',
	'2xl:theme-dark:accent-emerald:bg-emerald-100',
	'2xl:theme-dark:accent-amber:bg-gray-100',
	'2xl:theme-dark:accent-amber:bg-amber-100',

	// State variants with hover, focus, active
	'hover:theme-light:bg-gray-100',
	'hover:theme-light:bg-gray-200',
	'hover:theme-light:bg-gray-300',
	'hover:theme-light:bg-red-100',
	'hover:theme-light:bg-red-200',
	'hover:theme-light:bg-blue-100',
	'hover:theme-light:bg-blue-200',
	'hover:theme-dark:bg-gray-100',
	'hover:theme-dark:bg-gray-200',
	'hover:theme-dark:bg-red-100',
	'hover:theme-dark:bg-blue-100',
	'focus:theme-light:bg-gray-100',
	'focus:theme-light:bg-gray-200',
	'focus:theme-light:bg-red-100',
	'focus:theme-light:bg-blue-100',
	'focus:theme-dark:bg-gray-100',
	'focus:theme-dark:bg-red-100',
	'active:theme-light:bg-gray-100',
	'active:theme-light:bg-gray-200',
	'active:theme-light:bg-red-100',
	'active:theme-dark:bg-gray-100',

	// Responsive + hover combinations
	'sm:hover:theme-light:bg-gray-100',
	'sm:hover:theme-light:bg-gray-200',
	'sm:hover:theme-light:bg-red-100',
	'sm:hover:theme-dark:bg-gray-100',
	'md:hover:theme-light:bg-gray-100',
	'md:hover:theme-light:bg-red-100',
	'lg:hover:theme-light:bg-gray-100',
	'xl:hover:theme-light:bg-gray-100',

	// Spacing variants
	'theme-light:p-1',
	'theme-light:p-2',
	'theme-light:p-3',
	'theme-light:p-4',
	'theme-light:p-5',
	'theme-light:p-6',
	'theme-light:p-8',
	'theme-light:p-10',
	'theme-light:p-12',
	'theme-light:p-16',
	'theme-light:p-20',
	'theme-light:p-24',
	'theme-dark:p-1',
	'theme-dark:p-2',
	'theme-dark:p-3',
	'theme-dark:p-4',
	'theme-dark:p-5',
	'theme-dark:p-6',
	'theme-dark:p-8',
	'theme-dark:p-10',
	'theme-dark:p-12',
	'theme-dark:p-16',
	'theme-dark:p-20',
	'theme-dark:p-24',

	'theme-light:m-1',
	'theme-light:m-2',
	'theme-light:m-3',
	'theme-light:m-4',
	'theme-light:m-5',
	'theme-light:m-6',
	'theme-light:m-8',
	'theme-light:m-10',
	'theme-light:m-12',
	'theme-light:m-16',
	'theme-light:m-20',
	'theme-light:m-24',
	'theme-dark:m-1',
	'theme-dark:m-2',
	'theme-dark:m-3',
	'theme-dark:m-4',
	'theme-dark:m-5',
	'theme-dark:m-6',
	'theme-dark:m-8',
	'theme-dark:m-10',
	'theme-dark:m-12',
	'theme-dark:m-16',
	'theme-dark:m-20',
	'theme-dark:m-24',

	// Width and height variants
	'theme-light:w-1',
	'theme-light:w-2',
	'theme-light:w-3',
	'theme-light:w-4',
	'theme-light:w-5',
	'theme-light:w-6',
	'theme-light:w-8',
	'theme-light:w-10',
	'theme-light:w-12',
	'theme-light:w-16',
	'theme-light:w-20',
	'theme-light:w-24',
	'theme-light:w-32',
	'theme-light:w-40',
	'theme-light:w-48',
	'theme-light:w-56',
	'theme-light:w-64',
	'theme-light:w-72',
	'theme-light:w-80',
	'theme-light:w-96',
	'theme-light:w-auto',
	'theme-light:w-full',
	'theme-light:w-screen',
	'theme-dark:w-1',
	'theme-dark:w-2',
	'theme-dark:w-3',
	'theme-dark:w-4',
	'theme-dark:w-5',
	'theme-dark:w-6',
	'theme-dark:w-8',
	'theme-dark:w-10',
	'theme-dark:w-12',
	'theme-dark:w-16',
	'theme-dark:w-20',
	'theme-dark:w-24',
	'theme-dark:w-32',
	'theme-dark:w-40',
	'theme-dark:w-48',
	'theme-dark:w-56',
	'theme-dark:w-64',
	'theme-dark:w-72',
	'theme-dark:w-80',
	'theme-dark:w-96',

	'theme-light:h-1',
	'theme-light:h-2',
	'theme-light:h-3',
	'theme-light:h-4',
	'theme-light:h-5',
	'theme-light:h-6',
	'theme-light:h-8',
	'theme-light:h-10',
	'theme-light:h-12',
	'theme-light:h-16',
	'theme-light:h-20',
	'theme-light:h-24',
	'theme-light:h-32',
	'theme-light:h-40',
	'theme-light:h-48',
	'theme-light:h-56',
	'theme-light:h-64',
	'theme-light:h-72',
	'theme-light:h-80',
	'theme-light:h-96',
	'theme-light:h-auto',
	'theme-light:h-full',
	'theme-light:h-screen',
	'theme-dark:h-1',
	'theme-dark:h-2',
	'theme-dark:h-3',
	'theme-dark:h-4',
	'theme-dark:h-5',
	'theme-dark:h-6',
	'theme-dark:h-8',
	'theme-dark:h-10',
	'theme-dark:h-12',
	'theme-dark:h-16',
	'theme-dark:h-20',
	'theme-dark:h-24',
	'theme-dark:h-32',
	'theme-dark:h-40',
	'theme-dark:h-48',
	'theme-dark:h-56',
	'theme-dark:h-64',
	'theme-dark:h-72',
	'theme-dark:h-80',
	'theme-dark:h-96',

	// Typography variants
	'theme-light:text-xs',
	'theme-light:text-sm',
	'theme-light:text-base',
	'theme-light:text-lg',
	'theme-light:text-xl',
	'theme-light:text-2xl',
	'theme-light:text-3xl',
	'theme-light:text-4xl',
	'theme-light:text-5xl',
	'theme-light:text-6xl',
	'theme-light:text-7xl',
	'theme-light:text-8xl',
	'theme-light:text-9xl',
	'theme-dark:text-xs',
	'theme-dark:text-sm',
	'theme-dark:text-base',
	'theme-dark:text-lg',
	'theme-dark:text-xl',
	'theme-dark:text-2xl',
	'theme-dark:text-3xl',
	'theme-dark:text-4xl',
	'theme-dark:text-5xl',
	'theme-dark:text-6xl',

	'theme-light:font-thin',
	'theme-light:font-extralight',
	'theme-light:font-light',
	'theme-light:font-normal',
	'theme-light:font-medium',
	'theme-light:font-semibold',
	'theme-light:font-bold',
	'theme-light:font-extrabold',
	'theme-light:font-black',
	'theme-dark:font-thin',
	'theme-dark:font-extralight',
	'theme-dark:font-light',
	'theme-dark:font-normal',
	'theme-dark:font-medium',
	'theme-dark:font-semibold',
	'theme-dark:font-bold',
	'theme-dark:font-extrabold',
	'theme-dark:font-black',

	// Border variants
	'theme-light:border-0',
	'theme-light:border',
	'theme-light:border-2',
	'theme-light:border-4',
	'theme-light:border-8',
	'theme-light:border-t',
	'theme-light:border-r',
	'theme-light:border-b',
	'theme-light:border-l',
	'theme-light:border-t-0',
	'theme-light:border-r-0',
	'theme-light:border-b-0',
	'theme-light:border-l-0',
	'theme-dark:border-0',
	'theme-dark:border',
	'theme-dark:border-2',
	'theme-dark:border-4',
	'theme-dark:border-8',
	'theme-dark:border-t',
	'theme-dark:border-r',
	'theme-dark:border-b',
	'theme-dark:border-l',

	// Rounded variants
	'theme-light:rounded-none',
	'theme-light:rounded-sm',
	'theme-light:rounded',
	'theme-light:rounded-md',
	'theme-light:rounded-lg',
	'theme-light:rounded-xl',
	'theme-light:rounded-2xl',
	'theme-light:rounded-3xl',
	'theme-light:rounded-full',
	'theme-dark:rounded-none',
	'theme-dark:rounded-sm',
	'theme-dark:rounded',
	'theme-dark:rounded-md',
	'theme-dark:rounded-lg',
	'theme-dark:rounded-xl',
	'theme-dark:rounded-2xl',
	'theme-dark:rounded-3xl',
	'theme-dark:rounded-full',

	// Shadow variants
	'theme-light:shadow-sm',
	'theme-light:shadow',
	'theme-light:shadow-md',
	'theme-light:shadow-lg',
	'theme-light:shadow-xl',
	'theme-light:shadow-2xl',
	'theme-light:shadow-inner',
	'theme-light:shadow-none',
	'theme-dark:shadow-sm',
	'theme-dark:shadow',
	'theme-dark:shadow-md',
	'theme-dark:shadow-lg',
	'theme-dark:shadow-xl',
	'theme-dark:shadow-2xl',
	'theme-dark:shadow-inner',
	'theme-dark:shadow-none',

	// Complex combinations for maximum CSS generation
	'sm:hover:focus:theme-light:accent-violet:bg-red-500',
	'md:hover:focus:theme-light:accent-emerald:bg-blue-500',
	'lg:hover:focus:theme-dark:accent-amber:bg-green-500',
	'xl:hover:active:theme-light:accent-violet:text-purple-500',
	'2xl:focus:active:theme-dark:accent-emerald:border-yellow-500',
	'sm:md:theme-light:accent-violet:bg-gradient-to-r',
	'lg:xl:theme-dark:accent-amber:from-red-500',
	'hover:focus:active:theme-light:accent-emerald:to-blue-500',

	// Absolutely insane complex combinations
	'sm:md:lg:hover:focus:active:theme-light:theme-dark:accent-violet:accent-emerald:bg-red-500',
	'md:lg:xl:hover:active:focus:theme-dark:theme-light:accent-amber:accent-violet:text-blue-900',
	'lg:xl:2xl:focus:hover:active:theme-light:theme-dark:accent-emerald:accent-amber:border-purple-700',
	'sm:lg:2xl:active:hover:focus:theme-dark:theme-light:accent-violet:accent-emerald:bg-gradient-to-br',
	'md:xl:hover:focus:active:disabled:theme-light:theme-dark:accent-amber:accent-violet:from-red-500',
	'lg:2xl:focus:active:hover:checked:theme-dark:theme-light:accent-emerald:accent-amber:to-blue-800',
	'sm:md:xl:hover:active:focus:visited:theme-light:theme-dark:accent-violet:accent-emerald:via-green-600',
	'md:lg:2xl:active:focus:hover:invalid:theme-dark:theme-light:accent-amber:accent-violet:shadow-2xl',
	'sm:xl:2xl:hover:focus:active:required:theme-light:theme-dark:accent-emerald:accent-amber:rounded-full',
	'lg:xl:focus:hover:active:optional:theme-dark:theme-light:accent-violet:accent-emerald:border-dashed',

	// Multiple breakpoint chaos
	'sm:md:lg:xl:2xl:theme-light:accent-violet:bg-red-100',
	'md:lg:xl:2xl:theme-dark:accent-emerald:bg-blue-200',
	'sm:lg:xl:2xl:theme-light:accent-amber:bg-green-300',
	'sm:md:xl:2xl:theme-dark:accent-violet:bg-yellow-400',
	'sm:md:lg:2xl:theme-light:accent-emerald:bg-purple-500',
	'sm:md:lg:xl:theme-dark:accent-amber:bg-pink-600',

	// State combination madness
	'hover:focus:active:disabled:checked:theme-light:accent-violet:bg-red-500',
	'focus:active:hover:invalid:required:theme-dark:accent-emerald:text-blue-600',
	'active:hover:focus:visited:optional:theme-light:accent-amber:border-green-700',
	'hover:active:focus:checked:disabled:theme-dark:accent-violet:shadow-lg',
	'focus:hover:active:required:invalid:theme-light:accent-emerald:rounded-xl',
	'active:focus:hover:optional:visited:theme-dark:accent-amber:p-8',

	// Impossible but fun combinations
	'sm:md:lg:xl:2xl:hover:focus:active:disabled:checked:invalid:required:optional:visited:theme-light:theme-dark:accent-violet:accent-emerald:accent-amber:bg-red-500',
	'md:lg:xl:2xl:focus:active:hover:checked:disabled:required:invalid:visited:optional:theme-dark:theme-light:accent-emerald:accent-amber:accent-violet:text-blue-600',
	'lg:xl:2xl:active:hover:focus:invalid:required:checked:disabled:visited:optional:theme-light:theme-dark:accent-amber:accent-violet:accent-emerald:border-green-700',

	// Theme conflicts (testing edge cases)
	'theme-light:theme-dark:bg-red-500',
	'theme-dark:theme-light:text-blue-600',
	'theme-light:theme-dark:theme-light:border-green-700',
	'theme-dark:theme-light:theme-dark:shadow-xl',

	// Accent conflicts (testing edge cases)
	'accent-violet:accent-emerald:bg-red-500',
	'accent-emerald:accent-amber:text-blue-600',
	'accent-amber:accent-violet:border-green-700',
	'accent-violet:accent-emerald:accent-amber:shadow-lg',

	// Responsive with conflicting themes and accents
	'sm:theme-light:md:theme-dark:lg:theme-light:accent-violet:bg-red-500',
	'md:theme-dark:lg:theme-light:xl:theme-dark:accent-emerald:text-blue-600',
	'lg:theme-light:xl:theme-dark:2xl:theme-light:accent-amber:border-green-700',
	'sm:accent-violet:md:accent-emerald:lg:accent-amber:xl:accent-violet:bg-purple-500',

	// Ultra-nested responsive and state combinations
	'sm:hover:md:focus:lg:active:xl:disabled:2xl:checked:theme-light:accent-violet:bg-red-500',
	'md:focus:lg:hover:xl:active:2xl:invalid:sm:required:theme-dark:accent-emerald:text-blue-600',
	'lg:active:xl:hover:2xl:focus:sm:visited:md:optional:theme-light:accent-amber:border-green-700',

	// Gradient combinations with multiple breakpoints and states
	'sm:hover:md:focus:lg:active:theme-light:accent-violet:bg-gradient-to-r',
	'md:focus:lg:hover:xl:active:theme-dark:accent-emerald:from-red-500',
	'lg:active:xl:hover:2xl:focus:theme-light:accent-amber:via-blue-600',
	'xl:hover:2xl:focus:sm:active:theme-dark:accent-violet:to-green-700',
	'2xl:focus:sm:hover:md:active:theme-light:accent-emerald:bg-gradient-to-br',
	'sm:active:md:hover:lg:focus:theme-dark:accent-amber:from-purple-500',
	'md:hover:lg:active:xl:focus:theme-light:accent-violet:via-pink-600',
	'lg:focus:xl:active:2xl:hover:theme-dark:accent-emerald:to-yellow-700',

	// Animation and transform combinations
	'sm:hover:focus:theme-light:accent-violet:transform:scale-105',
	'md:active:hover:theme-dark:accent-emerald:transition-all:duration-300',
	'lg:focus:active:theme-light:accent-amber:rotate-45:translate-x-4',
	'xl:hover:focus:theme-dark:accent-violet:animate-pulse:delay-150',
	'2xl:active:hover:theme-light:accent-emerald:animate-bounce:duration-500',

	// Typography with complex combinations
	'sm:hover:md:focus:lg:active:theme-light:accent-violet:text-6xl:font-black:italic',
	'md:focus:lg:hover:xl:active:theme-dark:accent-emerald:text-xs:font-thin:underline',
	'lg:active:xl:hover:2xl:focus:theme-light:accent-amber:text-2xl:font-bold:line-through',

	// Spacing with complex combinations
	'sm:hover:md:focus:lg:active:theme-light:accent-violet:p-20:m-16:space-x-8',
	'md:focus:lg:hover:xl:active:theme-dark:accent-emerald:px-12:py-8:mx-6:my-4',
	'lg:active:xl:hover:2xl:focus:theme-light:accent-amber:pt-10:pb-6:pl-8:pr-4',

	// Flexbox and Grid combinations
	'sm:hover:md:focus:theme-light:accent-violet:flex:items-center:justify-between',
	'md:focus:lg:hover:theme-dark:accent-emerald:grid:grid-cols-12:gap-6',
	'lg:active:xl:hover:theme-light:accent-amber:flex:flex-col:items-stretch',

	// Positioning with complex combinations
	'sm:hover:md:focus:theme-light:accent-violet:absolute:top-4:right-6:z-50',
	'md:focus:lg:hover:theme-dark:accent-emerald:relative:inset-x-4:bottom-8',
	'lg:active:xl:hover:theme-light:accent-amber:fixed:left-0:top-0:w-full',

	// Overflow and display combinations
	'sm:hover:md:focus:theme-light:accent-violet:overflow-hidden:whitespace-nowrap',
	'md:focus:lg:hover:theme-dark:accent-emerald:overflow-scroll:block',
	'lg:active:xl:hover:theme-light:accent-amber:overflow-auto:inline-block',
];

export default function HeavyVariantsTest() {
	const [_, setAccent] = useUI<'violet' | 'emerald' | 'amber'>('accent', 'violet');
	const [__, setTheme] = useUI<'light' | 'dark'>('theme', 'light');

	return (
		<div className={variants.join(' ')}>
			<h1 className="text-2xl font-bold mb-4">Heavy Variants Test</h1>
			<p className="mb-4">Total variants: {variants.length}</p>
			<div className="space-x-4">
				<button
					onClick={() => setTheme(__ === 'light' ? 'dark' : 'light')}
					className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
					Toggle Theme (Current: {__})
				</button>
				<button
					onClick={() => {
						const accents = ['violet', 'emerald', 'amber'] as const;
						const currentIndex = accents.indexOf(_);
						const nextAccent = accents[(currentIndex + 1) % accents.length];
						setAccent(nextAccent);
					}}
					className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
					Toggle Accent (Current: {_})
				</button>
			</div>
			<div className="mt-4 p-4 border rounded">
				<p>This component should generate a massive amount of CSS to test your useUI hook's performance.</p>
				<p>Check the generated CSS output to see how many rules are created!</p>
			</div>
		</div>
	);
}

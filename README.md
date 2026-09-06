# Dayforge

Build a Premium Mobile Attendance App

App Name

DayForge

No Login / No Signup

The app should open directly to the dashboard without any authentication. It is a personal offline-first attendance application.

Project Vision

Build a premium, production-ready, mobile-first attendance application with a polished enterprise-grade UI, buttery smooth animations, fast performance, offline support, intelligent reports, and modern UX.

The app is designed for tracking daily work attendance based on completed work, not only working hours.

Example:

Work completed until 7:00 PM → 1.5 Days

Work completed until 10:00 PM → 2 Days

Support any custom attendance value.

The application should automatically calculate totals, statistics, reports, and insights.

First Launch Experience

Splash Screen

Show a premium animated splash screen.

Display

DayForge

with an elegant logo animation.

Duration

2–3 seconds

Then transition smoothly into the welcome screen.

Welcome Animation

After the splash screen, display an elegant welcome animation.

Large animated text

Hello, Ayan 👋

Use smooth fade, slide, and scale animations.

Background should have soft floating gradients.

The animation should feel premium like Apple or Google apps.

Automatically transition to Dashboard after 2 seconds.

Authentication

Remove completely

No Login

No Signup

No Authentication

No User Accounts

The app opens directly every time.

Dashboard

Modern premium dashboard including

Live Date

Live Clock

Greeting

Today's Attendance

Weekly Total

Monthly Total

Monthly Earnings

Attendance Progress Ring

Quick Add Attendance Button

Recent Activities

Productivity Card

Attendance Summary

Beautiful Charts

Floating Action Button

Smooth Card Animations

Smart Attendance

Fields

Date

Start Time

End Time

Working Hours

Attendance Value

Notes

Project Name

Site Name

Category

Attendance Values

0.25

0.5

0.75

1

1.25

1.5

1.75

2

Custom Value

Automatically calculate

Total Days

Total Hours

Monthly Attendance

Weekly Attendance

Calendar

Interactive monthly calendar.

Color Codes

🟢 Full Day

🔵 1.5 Day

🟣 2 Day

🟡 Half Day

🔴 No Attendance

Tap any date

Open attendance details

Allow

Edit

Delete

Duplicate

Add Notes

Search attendance directly from calendar.

Reports

Generate

Daily Report

Weekly Report

Monthly Report

Yearly Report

Include

Bar Chart

Pie Chart

Line Chart

Heatmap Calendar

Attendance Trend

Monthly Comparison

Export

PDF

Excel

CSV

Print

Statistics

Automatically calculate

Total Days Worked

Attendance Units

Working Hours

Average Hours

Average Attendance

Current Streak

Longest Streak

Most Productive Month

Highest Productivity Day

Lowest Productivity Day

Custom AI Insights

Search & Filters

Filter by

Date

Month

Attendance Value

Project

Category

Site

Keyword

Instant search.

Notes

Attach notes for every attendance.

Examples

Overtime

Holiday Work

Payment Received

Extra Shift

Material Delivered

Site Visit

Notifications

Daily Reminder

Morning Reminder

Evening Reminder

Weekly Summary

Monthly Summary

Backup Reminder

Custom Reminder Time

Backup & Sync

Use Supabase as the primary database.

Requirements

Offline First

When offline

Save locally.

When internet returns

Automatically sync with Supabase.

Never lose data.

Support

Auto Sync

Manual Sync

Conflict Resolution

Backup History

Data Storage

Do NOT use localStorage as the primary database.

Primary Storage

Supabase PostgreSQL

Offline Cache

IndexedDB

Automatic Sync

Bidirectional synchronization

Security

PIN Lock

Fingerprint

Face Unlock

Encrypted Local Database

Encrypted Cloud Sync

Profile

Profile page should include

App Name

User Name (editable)

App Version

Backup Status

Storage Usage

Theme Selection

Export Data

Reset Data

Settings

Include

Theme Switcher

Language

Notification Settings

Backup

Export

Date Format

Time Format

Currency

Attendance Unit

App Name Editor

App Name Change Option

Allow changing the app name from Settings.

Example

DayForge

↓

Ayan Attendance

↓

Work Tracker

↓

My Attendance

The updated app name should automatically appear throughout the application.

Themes

Default Theme

Coffee & White Theme (Default)

Warm Coffee Brown

Cream White

Soft Beige

Elegant Cards

Minimal UI

Premium Typography

Luxury Appearance

This should be the default theme.

Additional Themes

Hacker

Black

Neon Green

Terminal Style

Matrix Animation

Monospace Font

Midnight Blue

Dark Navy

Electric Blue

Glassmorphism

Emerald Pro

White

Emerald Green

Corporate UI

Royal Purple

Luxury Purple

Gradient Cards

Premium Look

Sunset Orange

Orange

Red Gradient

Creative Style

Arctic White

Apple-inspired

Ultra Minimal

Pure White

Elegant Shadows

UI Style

Material Design 3

Glassmorphism

Rounded Cards

Soft Shadows

Micro Interactions

Lottie Animations

Framer Motion

Smooth Navigation

Professional Icons

Lucide React

Responsive Layout

Mobile First

Tablet Ready

Desktop Responsive

Google Play Ready

60 FPS Animations

Navigation

Bottom Navigation

Dashboard

Calendar

Attendance

Reports

Statistics

Settings

Future Ready Features

AI Attendance Insights

Voice Input

Photo Attachment

GPS

QR Code

Salary Calculator

Project Management

Multiple Sites

Widgets

PWA

Dark Mode Automation

Cloud Restore

Tech Stack

Frontend

React

TypeScript

Next.js

Backend

Supabase

Database

PostgreSQL (Supabase)

Offline Storage

IndexedDB

State

Zustand

Styling

Tailwind CSS

Charts

Recharts

Calendar

FullCalendar

Animations

Framer Motion

Lottie

Icons

Lucide React

Validation

Zod

Forms

React Hook Form

PWA

next-pwa

Performance Requirements

60 FPS animations

Lazy loading

Code splitting

Optimized bundle size

Instant page transitions

Offline support

Background sync

Fast startup (<2 seconds)

Responsive on all mobile devices

Google Lighthouse score above 95

Final Goal

Build DayForge as a premium, production-ready attendance application with an enterprise-level user experience. The app must feel like a polished commercial product ready for Google Play Store publication. It should use Supabase PostgreSQL as the primary database, IndexedDB for offline storage, and automatically synchronize data when the device comes back online. The app must not include login or signup, should open directly to the dashboard, display a smooth "Hello, Ayan 👋" welcome animation after the splash screen, use the Coffee & White theme as the default, while also providing all other selectable themes and allowing the app name to be changed from the Settings page.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dayforge2006.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8ab6ffe4-252b-4695-bb05-437ab66376c9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

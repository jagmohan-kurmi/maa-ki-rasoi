# PROJECT AUDIT: Maa Ki Rasoi - Food & Tiffin Service Portal

**Date:** 2026-11-16  
**Auditor:** Senior Open-Source Maintainer & DevSecOps Engineer  
**Project Path:** `C:\Users\75098\.gemini\antigravity\scratch\maa-ki-rasoi`  
**Target Repository:** `jagmohan-kurmi/maa-ki-rasoi`  
**Open-Source Program:** OpenAI Codex for Open Source  

---

## 1. Executive Summary

Maa Ki Rasoi is an on-demand student mess, cloud kitchen, and daily tiffin delivery management web application. Engineered for college towns and student accommodations (Gopalganj, Sagar MP), it manages meal plan subscriptions, daily lunch/dinner delivery routing, dietary choices (veg/non-veg), pause/resume meal calendar logic, and WhatsApp customer ordering.

---

## 2. Architecture & Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend UI** | React 18+ (Vite SPA) | Responsive mobile-first interface for students & hostelers |
| **Styling & Theme** | Tailwind CSS | Appetizing food portal theme with custom badges & meal plans |
| **SEO & Schema** | Schema.org JSON-LD | `Restaurant`, `LocalBusiness`, `FAQPage`, and `BreadcrumbList` |
| **Delivery Logic** | Dynamic Meal Calendars | Vacation meal pause/resume and tiffin box tracking |
| **Hosting Model** | Hostinger Static / LAMP | High-performance static web delivery with browser caching |

---

## 3. Core Modules

1. **Monthly Mess Subscription Plans:** Unlimited student thali, executive meal boxes, and customized 3-meals daily plans.
2. **Weekly Rotating Menu:** Daily breakfast, lunch, and dinner specials with veg and non-veg schedules.
3. **Daily Tiffin Service Dispatch:** Doorstep hostel/room delivery booking and route scheduling.
4. **Subscription Pause & Rollover:** Pause meal counter during holidays/exams with automatic validity extension.

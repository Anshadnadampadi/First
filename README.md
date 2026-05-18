# 📱 STARZO Mobiles - Full-Stack Mobile E-Commerce Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.0-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.0-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Alpine.js](https://img.shields.io/badge/Alpine.js-Reactive-8BC0D0?style=for-the-badge&logo=alpinedotjs&logoColor=white)](https://alpinejs.dev/)

An immersive, production-grade, full-stack e-commerce application tailored specifically for mobile retail. Built on a premium, modern dark-themed architecture, **STARZO Mobiles** features robust item tracking, dynamic business intelligence, AI support assistants, and a highly responsive design system.

---

## ✨ Features Highlight

### 🎨 Premium UI & Interactive UX
- **Stunning Dark Aesthetic:** Modern dark-themed layout built with harmonious tailwind palettes, custom gradients, and glowing brand accents.
- **Handcrafted Sidebar Navigation:** Fully custom-built admin and user sidebars utilizing lightweight, interactive SVGs with smooth color transition states (orange accents for active, red highlights for danger/logout).
- **Smooth Kinetic Scrolling:** Powered by **Lenis Smooth Scroll** for high-performance navigation and scrolling kinetics.
- **Glassmorphic Components:** Elegant, semi-transparent overlays, reactive modals, and fluid Alpine.js interactive components.

### 🛒 Comprehensive E-Commerce Architecture
- **Self-Healing Shopping Cart:** Dynamic cart updates with built-in Mongoose hooks to auto-heal legacy carts (falling back missing fields like `originalPrice` to product `price`).
- **Flexible Promotion Engines:**
  - **Coupons:** Flat or percentage-based discount codes, strict expiration controls, and single-use limits.
  - **Product & Category Offers:** Real-time dynamic discount calculations taking the best active promotional rate automatically.
- **Smart Wallet & Refunds:** Full customer wallet ledger with real-time top-ups, instant order cancellation refunds, and visual checkout integration.
- **Wishlist & Saved Items:** Seamless saved products layout with real-time toggle icons.

### 🛡️ Enterprise Security & Isolation
- **Session Splitting Dispatcher:** Double Express Sessions dispatcher utilizing completely separate session stores (`userSessions` and `adminSessions`) in MongoDB to guarantee absolute session privacy and security.
- **Social SSO:** Clean integration with **Passport.js Google OAuth 2.0** for seamless social sign-ins.
- **Robust Shielding:** Hardened HTTP headers through custom **Helmet** security directives (supporting custom CSP rules for Razorpay, Google fonts, Socket.io, and Cloudinary).
- **Admin Nocache Guards:** Strict nocache policies on administrative dashboards to prevent back-button visual session replays.

### 🤝 Real-Time Support & AI Chat
- **Gemini AI Support Assistant:** Dedicated conversational chat powered by the **Google Gemini API (`@google/generative-ai`)**, trained on Starzo catalog schemas to assist users instantly.
- **Socket.io Customer Chat:** Direct, real-time text channel linking customers directly to the active support desk inside the Admin Control Center.

### 📊 Admin Control Center & Reporting
- **Fine-Grained Order Tracking:** Individual item-level order state transitions (Ordered, Shipped, Delivered, Cancelled) that auto-recalculate parent global states.
- **Business Reports:**
  - **Spreadsheets (ExcelJS):** Full sales sheets including complete order details, total calculations, discounts, and custom timestamp meta-data.
  - **Invoices & Receipts (PDFKit):** Dynamically generated download invoices for placed orders.
- **Dynamic Stocks Engine:** Clean variant management (color, storage, RAM specs) alongside background stock release routines that automatically reclaim inventory from abandoned checkouts every 10 minutes.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Runtime & Frame** | Node.js (ES6 Modules) + Express.js | Core server and MVC architecture |
| **Database** | MongoDB + Mongoose | High-performance document storage & modeling |
| **Session Store** | Connect-Mongo + Express-Session | Secure server-side multi-session persistence |
| **Real-time Engine**| Socket.io | Bidirectional admin support messaging and system logs |
| **AI Integration** | Google Generative AI (`@google/generative-ai`) | Conversational mobile shopping assistant |
| **Payments** | Razorpay SDK | Robust checkout payment gateways |
| **Storage & Upload** | Multer + Cloudinary | Elastic media and image storage |
| **Views & Template** | EJS + Express EJS Layouts | Modular server-side HTML layout rendering |
| **Reactivity** | Alpine.js | Modern, lightweight, declarative UI states |
| **Animations** | Lenis Scroll | High-fidelity scroll performance |

---

## 📂 Project Architecture

```
STARZOMOBILES
├── 📁 config/            # System & Socket setups, Database connection, OAuth configuration
├── 📁 controllers/       # Controller logic (Admin side vs. User-facing routes)
│   ├── 📁 admin/         # Admin order, sales, coupon, support, product systems
│   └── 📁 user/          # User cart, wishlist, checkout, wallet controllers
├── 📁 middlewares/       # Security headers, auth guards, locals bindings, blocked check
├── 📁 models/            # Mongoose Schemas (User, Admin, Product, Cart, Order, Coupon, Offer)
├── 📁 public/            # Static assets (Compiled CSS, custom JS, logos, media)
├── 📁 routes/            # Defined routing endpoints mapped to controllers
├── 📁 services/          # Decoupled business logic (sales reports, checkout flows, admin logic)
├── 📁 utils/             # Helper utilities (PDF layout generators, custom Excel builders)
├── 📁 views/             # Server-rendered templates (EJS Layouts, Modals, Partials)
│   ├── 📁 admin/         # Admin Dashboard, Category grids, product variant fields
│   ├── 📁 partials/      # Navigation headers, breadcrumbs, unified toast templates
│   └── 📁 user/          # Customer store front, profile details, AI assistant chat
├── 📄 server.js          # App entrypoint (initializes sessions, HTTP server, and Socket.io)
└── 📄 package.json       # App manifests and third-party dependencies
```

---

## 🚀 Setup & Installation

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MongoDB** (Local instance or Atlas cloud URI)
- Cloudinary, Razorpay, Google OAuth, and Google Gemini API developer credentials.

### 2. Clone the Repository
```bash
git clone https://github.com/Anshadnadampadi/StarzoMobiles.git
cd StarzoMobiles
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory and supply your credentials:
```env
# Server Configuration
PORT=7000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/starzomobiles

# Session Secrets
SESSION_SECRET=your_super_secure_session_secret

# Cloudinary Credentials (Media storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay Credentials (Checkout payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Google OAuth Credentials (SSO)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:7000/auth/google/callback

# Gemini AI Credentials
GEMINI_API_KEY=your_gemini_api_key

# Nodemailer Configuration (Email notifications)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 5. Running the Application
**Development Mode:**
Starts the server with nodemon for automatic file reloads.
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```
Open your browser and navigate to `http://localhost:7000`.

---

## 🤝 Contributing & Git Workflow

1. **Branch Naming Conventions:**
   - Feature additions: `feature/feature-name`
   - Bug resolutions: `fix/bug-name`
   - UI Improvements: `ui/improvement-name`
2. **Commit Standard:**
   - Use descriptive commit messages detailing exactly what component changed (e.g., `feat: integrate Gemini AI support desk to user layout`, `fix: add dynamic originalPrice default to cart schema`).

---

## 📄 License
This project is licensed under the ISC License. Feel free to use and distribute.

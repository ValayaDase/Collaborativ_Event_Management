# 📘 Collaborativ Event Management

## 📖 Project Description

Collaborativ Event Management is a JavaScript-based web platform that facilitates the creation, management, and coordination of collaborative events. Users can create events, invite participants, manage RSVPs, and receive notifications, making event planning seamless and interactive.

---

## ✨ Features

- User authentication & authorization
- Event creation, editing, and removal
- RSVP management
- Real-time notifications
- Event calendar/dashboard
- Role-based access (Organizer, Attendee)
- Collaboration tools (comments, task assignments)
- Email invitations
- Reminders

---

## 🛠️ Tech Stack

### Frontend
- React js
- HTML5, CSS3

### Backend
- Node.js (Express.js)
- (If backend separate; adjust as needed)

### Database
- MongoDB / Firebase / JSON (adjust to your stack)

### Tools & Libraries
- Axios / Fetch (API calls)
- dotenv (environment variables)
- nodemailer (email notifications)
- Socket.io (real-time updates)
- toaster

---

## ⚙️ Installation Guide

1. **Clone the repository**
   ```bash
   git clone https://github.com/ValayaDase/Collaborativ_Event_Management.git
   cd Collaborativ_Event_Management
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment variables**  
   (see `.env` section)
4. **Run the application**
   - **Development:**  
     ```bash
     npm start
     ```
   - **Production build:**  
     ```bash
     npm run build
     npm run serve
     ```

---

## 🔑 Environment Variables (.env)

Create a `.env` file in the root:

```env
# Sample .env file
PORT=3000
MONGO_URI=mongodb://localhost:27017/eventdb
JWT_SECRET=your_secret_key
MAIL_SERVICE=gmail
MAIL_USER=example@gmail.com
MAIL_PASS=your_email_password
FRONTEND_URL=http://localhost:3000
```

---

## 📂 Folder Structure (detailed)

```
Collaborativ_Event_Management/
│
├── public/                       # Static assets (index.html, favicon, etc.)
│
├── src/
│   ├── api/                      # API service calls
│   ├── assets/                   # Images, SVGs, media
│   ├── components/               # Reusable UI components
│   ├── constants/                # Static constants (roles, routes, etc.)
│   ├── context/                  # Context providers (Auth, Event)
│   ├── hooks/                    # Custom React hooks
│   ├── pages/                    # Main pages (Dashboard, EventDetail, etc.)
│   ├── routes/                   # Route configuration
│   ├── store/                    # Redux or state management logic
│   ├── styles/                   # Global & component-specific style files
│   ├── utils/                    # Utility functions (date, validation, etc.)
│   ├── App.js                    # Root React component
│   └── index.js                  # Entry point
│
├── backend/ (if exists)
│   ├── controllers/              # Request handlers
│   ├── middlewares/              # Auth, error handling
│   ├── models/                   # Database schemas/models
│   ├── routes/                   # Express routers
│   ├── utils/                    # Helper functions
│   └── server.js                 # App entry
│
├── .env                          # Environment configuration
├── .gitignore
├── package.json
├── README.md
└── ...
```

---

## 📡 API Endpoints

> Update endpoints based on your actual backend implementation

```
POST    /api/auth/register         # Register user
POST    /api/auth/login           # Login user
GET     /api/events/              # List events
POST    /api/events/              # Create event
GET     /api/events/:id           # Get event details
PUT     /api/events/:id           # Edit event
DELETE  /api/events/:id           # Delete event
POST    /api/events/:id/rsvp      # RSVP to event
POST    /api/events/:id/comment   # Comment on event
```

---

## 🧪 Testing Instructions

1. **Run all tests**
   ```bash
   npm test
   ```
2. **Test individual components**
   - Use your testing suite (e.g., Jest, Mocha) to run tests within `src/__tests__/`.

3. **Backend route testing**
   - Use Postman/Insomnia or automated tests to test API endpoints.

---

## 🚀 Deployment Guide

1. **Build the frontend**
   ```bash
   npm run build
   ```
2. **Deploy files to your host** (Vercel, Netlify, Heroku, etc.)
3. **Set up environment variables on the remote server**
4. **(Optional) Deploy backend server** and ensure API routes are accessible.

---

## 📱 Responsive Design Support

- Uses mobile-first design with media queries
- Responsive layouts for all pages
- Tested on Chrome, Firefox, Safari, and Edge
- Touch and gesture support

---

## ⚡ Performance Optimizations

- Code splitting and lazy loading
- Image optimization (WebP, SVG)
- Bundle analyzer to reduce size
- Debounced API calls
- Memoization for expensive UI components

---

## 🧠 Challenges Faced

- Managing real-time synchronization between multiple users
- Handling calendar conflicts and time zones
- Dealing with guest email deliverability (spam prevention)
- UI responsiveness for large events

---

## 📈 Future Improvements

- Add video conferencing (Zoom/MS Teams) links
- Mobile app (React Native)
- Role-based analytics dashboards

---

## 👨‍💻 Author Information

- **GitHub:** [ValayaDase](https://github.com/ValayaDase)
- **Email:** _valayadase2005@gmail.com

---


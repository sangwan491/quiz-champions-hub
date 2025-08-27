# Quiz Champions Hub

A full-stack quiz application with real-time session management, user registration, and admin controls.

## Features

### For Users
- **User Registration**: Name and LinkedIn profile registration
- **Real-time Quiz Sessions**: Join active quiz sessions started by admins
- **Dynamic Timer**: Configurable time per question set by admin
- **Live Leaderboard**: Real-time score tracking with global rankings
- **Responsive Design**: Works on desktop and mobile devices

### For Admins
- **Multiple Quiz Management**: Create and manage multiple quizzes
- **Question Bank**: Add/edit/delete questions with categories and difficulty levels
- **Session Control**: Start and stop quiz sessions in real-time
- **Timer Configuration**: Set custom time per question for each quiz
- **Leaderboard Management**: Reset leaderboard when needed
- **Admin Panel**: Accessible via `/admin` route (hidden from main navigation)

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI Components**: Tailwind CSS + shadcn/ui
- **Backend**: Express.js + Node.js
- **Database**: JSON-based file storage
- **State Management**: React hooks + localStorage
- **Real-time Updates**: RESTful API

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd quiz-champions-hub
```

2. Install dependencies
```bash
npm install
```

### Running the Application

#### Option 1: Run Both Frontend and Backend Together
```bash
npm run dev:full
```
This starts both the backend server (port 3001) and frontend dev server (port 8080).

#### Option 2: Run Separately

**Terminal 1 - Backend Server:**
```bash
npm run server
```
Server runs on http://localhost:3001

**Terminal 2 - Frontend Development:**
```bash
npm run dev
```
Frontend runs on http://localhost:8080

### Access Points

- **Main Application**: http://localhost:8080
- **Admin Panel**: http://localhost:8080/admin
- **API Endpoints**: http://localhost:3001/api

## Usage Guide

### For Users

1. **Registration**: First-time users will see a registration form asking for name and LinkedIn profile
2. **Join Quiz**: If there's an active quiz session, users can join immediately
3. **Take Quiz**: Answer questions within the time limit set by admin
4. **View Results**: See your score and check the leaderboard

### For Admins

1. **Access Admin Panel**: Navigate to `/admin` route
2. **Create Quiz**: Add new quizzes with custom titles, descriptions, and timer settings
3. **Manage Questions**: Add/edit/delete questions with categories, difficulty, and points
4. **Control Sessions**: Start/stop quiz sessions from the Session Control tab
5. **Monitor Results**: View and reset leaderboard from the Leaderboard tab

## Database Structure

The application uses JSON files for data storage:

- `server/db/quizzes.json`: Quiz data and questions
- `server/db/users.json`: Registered users
- `server/db/sessions.json`: Current session state
- `server/db/results.json`: Quiz results and leaderboard

## API Endpoints

### Quiz Management
- `GET /api/quizzes` - Get all quizzes
- `POST /api/quizzes` - Create new quiz
- `PUT /api/quizzes/:id` - Update quiz
- `DELETE /api/quizzes/:id` - Delete quiz

### Question Management
- `POST /api/quizzes/:quizId/questions` - Add question
- `PUT /api/quizzes/:quizId/questions/:questionId` - Update question
- `DELETE /api/quizzes/:quizId/questions/:questionId` - Delete question

### Session Management
- `GET /api/session` - Get current session
- `POST /api/session/start` - Start quiz session
- `POST /api/session/stop` - Stop quiz session
- `GET /api/quiz/active` - Get active quiz for players

### User & Results
- `POST /api/users/register` - Register user
- `GET /api/results` - Get leaderboard
- `POST /api/results` - Submit quiz result
- `DELETE /api/results` - Reset leaderboard

## Development

### Project Structure
```
quiz-champions-hub/
├── src/                    # Frontend React app
│   ├── components/         # UI components
│   ├── pages/             # Page components
│   ├── data/              # Data types and API functions
│   └── hooks/             # Custom React hooks
├── server/                # Backend Express server
│   ├── index.js          # Main server file
│   └── db/               # JSON database files
└── public/               # Static assets
```

### Adding Features

1. **New Quiz Features**: Update the Quiz interface in `src/data/questions.ts`
2. **New API Endpoints**: Add routes in `server/index.js`
3. **UI Components**: Add to `src/components/` using shadcn/ui patterns
4. **New Pages**: Add to `src/pages/` and update routing in `src/App.tsx`

## Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## License

This project is open source and available under the [MIT License](LICENSE).

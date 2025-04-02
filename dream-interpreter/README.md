# Dream Interpreter

A web application that uses AI to interpret your dreams. Built with React, FastAPI, and TinyLlama.

## Features

- User-friendly interface for entering dream descriptions
- AI-powered dream interpretation using TinyLlama
- Example dreams to help users get started
- Modern, responsive design
- Error handling and loading states

## Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the backend server:
```bash
python main.py
```

The backend will be available at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:5173

## Usage

1. Open your browser and navigate to http://localhost:5173
2. Enter your dream in the text area or select an example dream
3. Click "Interpret My Dream"
4. View your personalized dream interpretation

## Technologies Used

- Frontend:
  - React with TypeScript
  - Vite
  - Chakra UI
  - Axios

- Backend:
  - FastAPI
  - TinyLlama
  - Python

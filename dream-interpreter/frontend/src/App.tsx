import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  MenuItem,
  Paper,
} from '@mui/material'
import axios, { AxiosError } from 'axios'
import DreamSense from './DreamSense'

const exampleDreams = [
  "I was flying above a beautiful city at night",
  "I was late for an important exam and couldn't find the classroom",
  "I was swimming in a crystal clear ocean with dolphins",
  "I was in my childhood home but everything was different",
]

function App() {
  const [dreamText, setDreamText] = useState('')
  const [interpretation, setInterpretation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'error' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'error'
  })

  const handleExampleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDreamText(e.target.value)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const interpretDream = async () => {
    if (!dreamText.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter your dream',
        severity: 'warning'
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.post('http://localhost:8000/interpret', {
        dream_text: dreamText,
      })
      setInterpretation(response.data.interpretation)
    } catch (error) {
      const message = error instanceof AxiosError 
        ? error.response?.data?.detail || 'Network error'
        : 'Unable to interpret your dream'
      
      setSnackbar({
        open: true,
        message,
        severity: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#f5f5f5', 
      py: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            align="center"
            sx={{
              background: 'linear-gradient(45deg, #9c27b0 30%, #f50057 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            Dream Interpreter
          </Typography>
          
          <Typography variant="subtitle1" align="center" color="text.secondary">
            Share your dream and receive an AI-powered interpretation that helps you understand its meaning.
          </Typography>

          <TextField
            select
            value={dreamText}
            onChange={handleExampleSelect}
            variant="outlined"
            fullWidth
            label="Choose an example dream or type your own below"
          >
            <MenuItem value="">
              <em>Choose an example dream...</em>
            </MenuItem>
            {exampleDreams.map((dream, index) => (
              <MenuItem key={index} value={dream}>
                {dream}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            value={dreamText}
            onChange={(e) => setDreamText(e.target.value)}
            placeholder="Describe your dream here..."
            multiline
            rows={6}
            fullWidth
            variant="outlined"
          />

          <Button
            variant="contained"
            color="primary"
            onClick={interpretDream}
            disabled={isLoading}
            size="large"
            fullWidth
          >
            {isLoading ? 'Interpreting...' : 'Interpret My Dream'}
          </Button>

          {interpretation && (
            <Paper 
              elevation={1}
              sx={{ 
                p: 3, 
                bgcolor: '#f3e5f5',
                borderRadius: 2
              }}
            >
              <Typography color="primary">
                {interpretation}
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>

      <Container>
        <DreamSense />
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default App

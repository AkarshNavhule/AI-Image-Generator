'use client';

// Disable SSR for this page to avoid hydration mismatches
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

// Material UI imports
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ClearIcon from '@mui/icons-material/Clear';

export default function HomePage() {
  const { data: session, status } = useSession();
  const theme = useTheme();
  // `sm` breakpoint ~ 600px by default; adjust if needed
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for user input and generated image
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  // State for status message (success/error)
  const [statusMessage, setStatusMessage] = useState(null);

  // State for storing history of { prompt, imageUrl, timestamp }
  const [history, setHistory] = useState([]);

  // 1) Load history from localStorage on first render
  useEffect(() => {
    const savedHistory = localStorage.getItem('imageHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 2) Whenever history changes, save it to localStorage
  useEffect(() => {
    localStorage.setItem('imageHistory', JSON.stringify(history));
  }, [history]);

  // 3) Auto-clear the status message after 3 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // 4) Helper function to generate the image
  async function generateImage() {
    if (!prompt) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      if (response.ok) {
        setGeneratedImage(data.imageUrl);
        setStatusMessage('AI image is generated!');

        // Add new item to history (front of the array)
        const newItem = {
          prompt,
          imageUrl: data.imageUrl,
          timestamp: Date.now()
        };
        setHistory((prev) => [newItem, ...prev]);
      } else {
        console.error('Error generating image:', data.error);
        setStatusMessage('Failed to generate image.');
      }
    } catch (error) {
      console.error('Request error:', error);
      setStatusMessage('Failed to generate image.');
    }
    setLoading(false);
  }

  // 5) Desktop form submission
  function handleGenerateDesktop(e) {
    e.preventDefault();
    generateImage();
  }

  // 6) Mobile generate button click
  function handleGenerateMobile() {
    generateImage();
  }

  // 7) Clear history in localStorage (not in DB)
  function handleClearHistory() {
    setHistory([]);
    localStorage.removeItem('imageHistory');
  }

  // 8) Download the generated image locally
  function handleDownloadImage() {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'generated-image.png'; // Default filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 9) Wait for session to load to avoid SSR mismatch
  if (status === 'loading') {
    return (
      <Container sx={{ textAlign: 'center', mt: 5 }}>
        <Typography variant="h5" gutterBottom>
          Loading...
        </Typography>
      </Container>
    );
  }

  // If user is not signed in, show the sign-in button
  if (!session) {
    return (
      <Container sx={{ textAlign: 'center', mt: 5 }}>
        <Typography variant="h5" gutterBottom>
          Nestle Fans AI ImageGenerator
        </Typography>
        <Button variant="contained" onClick={() => signIn('google')}>
          Sign in with Google
        </Button>
      </Container>
    );
  }

  // MAIN UI (when user is signed in)
  return (
    <Container sx={{ my: 4, pb: isMobile ? 8 : 0 }}>
      {/* Only show top bar on desktop/tablet */}
      {!isMobile && (
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="body1">
            Hi, {session.user?.name}
          </Typography>
          <Button variant="outlined" onClick={() => signOut()}>
            Sign out
          </Button>
        </Box>
      )}

      {/* Prompt input and Generate button (desktop only) */}
      {!isMobile && (
        <Box
          component="form"
          onSubmit={handleGenerateDesktop}
          display="flex"
          gap={2}
          mb={2}
          flexWrap="wrap"
        >
          <TextField
            label="Enter your prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            fullWidth
            sx={{ flex: '1 1 auto', minWidth: '250px' }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {loading ? 'Generating...' : 'Generate Image'}
          </Button>
        </Box>
      )}

      {/* Status message (auto-clears after 3s) */}
      {statusMessage && (
        <Typography
          variant="subtitle1"
          color="primary"
          sx={{ mb: 2, fontWeight: 600 }}
        >
          {statusMessage}
        </Typography>
      )}

      {/* Main layout: left for current image, right for history */}
      <Grid container spacing={2}>
        {/* Left column: latest generated image + Download button */}
        <Grid item xs={12} md={8}>
          {generatedImage && (
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Generated Image:
              </Typography>
              <Card>
                <CardMedia
                  component="img"
                  image={generatedImage}
                  alt="Generated Image"
                />
                <CardActions>
                  <Button variant="contained" onClick={handleDownloadImage}>
                    Download Image
                  </Button>
                </CardActions>
              </Card>
            </Paper>
          )}
        </Grid>

        {/* Right column: history */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{ p: 2, maxHeight: '70vh', overflowY: 'auto' }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">History</Typography>
              <IconButton
                color="error"
                onClick={handleClearHistory}
                title="Clear History"
              >
                <ClearIcon />
              </IconButton>
            </Box>
            {history.length === 0 && (
              <Typography>No previous images.</Typography>
            )}

            {history.map((item, index) => (
              <Box key={index} mb={2}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 'bold', mb: 1 }}
                    >
                      Prompt:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {item.prompt}
                    </Typography>
                    <CardMedia
                      component="img"
                      image={item.imageUrl}
                      alt="History Image"
                      sx={{ width: 100, height: 100, border: '1px solid #ccc' }}
                    />
                  </CardContent>
                </Card>
                {index < history.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* MOBILE BOTTOM BAR (prompt + generate + sign out) */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            p: 1,
            bgcolor: 'background.paper',
            borderTop: '1px solid #ccc',
            display: 'flex',
            gap: 1
          }}
        >
          <TextField
            label="Enter prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            disabled={loading}
            onClick={handleGenerateMobile}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {loading ? '...' : 'Generate'}
          </Button>
          <Button variant="outlined" color="error" onClick={() => signOut()}>
            Sign out
          </Button>
        </Box>
      )}
    </Container>
  );
}

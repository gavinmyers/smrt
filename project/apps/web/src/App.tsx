import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { fetchHealth, fetchSession } from './api';

interface SessionData {
  hasSession: boolean;
  sessionId: string;
  visits: number;
}

interface HealthData {
  status: string;
  timestamp: string;
}

function App() {
  const [count, setCount] = useState(0);
  const [session, setSession] = useState<SessionData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [sessionData, healthData] = await Promise.all([
          fetchSession(),
          fetchHealth(),
        ]);
        setSession(sessionData);
        setHealth(healthData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
    loadData();
  }, []);

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Vite + React + MUI + Fastify
        </Typography>

        <Stack spacing={2}>
          <Paper sx={{ p: 2 }}>
            <Stack spacing={2} direction="row" alignItems="center">
              <Button
                variant="contained"
                onClick={() => setCount((count) => count + 1)}
              >
                Count is {count}
              </Button>
              <Typography variant="body1">Local State Test</Typography>
            </Stack>
          </Paper>

          {error && <Alert severity="error">API Error: {error}</Alert>}

          {health && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">API Health</Typography>
              <pre>{JSON.stringify(health, null, 2)}</pre>
            </Paper>
          )}

          {session && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Session (Cookie)</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                ID: {session.sessionId}
              </Typography>
              <Typography variant="body2">Visits: {session.visits}</Typography>
            </Paper>
          )}
        </Stack>
      </Box>
    </Container>
  );
}

export default App;

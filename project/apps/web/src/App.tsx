import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import {
  createProject,
  deleteProject,
  fetchHealth,
  fetchProjects,
  fetchSession,
} from './api';

interface SessionData {
  hasSession: boolean;
  sessionId: string;
  visits: number;
}

interface HealthData {
  status: string;
  timestamp: string;
}

interface Project {
  id: string;
  name: string;
  createdAt: string;
}

function App() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [sessionData, healthData, projectsData] = await Promise.all([
          fetchSession(),
          fetchHealth(),
          fetchProjects(),
        ]);
        setSession(sessionData);
        setHealth(healthData);
        setProjects(projectsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
    loadData();
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const project = await createProject(newProjectName);
      setProjects([project, ...projects]);
      setNewProjectName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          SMRT Projects
        </Typography>

        <Stack spacing={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Create New Project
            </Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                label="Project Name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
              />
              <Button variant="contained" onClick={handleCreateProject}>
                Add
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Projects List
            </Typography>
            <List>
              {projects.map((project) => (
                <ListItem
                  key={project.id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={project.name}
                    secondary={new Date(project.createdAt).toLocaleString()}
                  />
                </ListItem>
              ))}
              {projects.length === 0 && (
                <Typography variant="body2" color="textSecondary">
                  No projects yet.
                </Typography>
              )}
            </List>
          </Paper>

          {error && <Alert severity="error">Error: {error}</Alert>}

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

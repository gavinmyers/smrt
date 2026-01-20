import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Route,
  Link as RouterLink,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import * as api from './api';

const DRAWER_WIDTH = 240;

import { createContext, useContext, useCallback } from 'react';

const BreadcrumbContext = createContext<{
  names: Record<string, string>;
  setBreadcrumbName: (id: string, name: string) => void;
}>({
  names: {},
  setBreadcrumbName: () => {},
});

function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [names, setNames] = useState<Record<string, string>>({});
  const setBreadcrumbName = useCallback((id: string, name: string) => {
    setNames((prev) => (prev[id] === name ? prev : { ...prev, [id]: name }));
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ names, setBreadcrumbName }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

const useBreadcrumbs = () => useContext(BreadcrumbContext);

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface Item {
  id: string;
  name: string;
  status?: string;
  createdAt: string;
}

/**
 * Reusable inline-edit list component for Projects, Conditions, and Features
 */
function InlineEditList({
  title,
  items,
  onAdd,
  onSave,
  onEdit,
  onDelete,
  editingId,
  editName,
  setEditName,
  editStatus,
  setEditStatus,
  onItemClick,
}: {
  title: string;
  items: Item[];
  onAdd: () => void;
  onSave: (id: string) => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  editName: string;
  setEditName: (name: string) => void;
  editStatus?: string;
  setEditStatus?: (status: string) => void;
  onItemClick?: (id: string) => void;
}) {
  console.log(
    `[InlineEditList] Rendering "${title}" with ${items.length} items`,
  );
  return (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 2,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 600 }}
          data-testid="list-title"
        >
          {title}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            console.log(`[InlineEditList] "${title}" Add button clicked`);
            onAdd();
          }}
          disabled={editingId !== null}
          size="small"
          data-testid="add-button"
        >
          Add
        </Button>
      </Box>

      <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
        {items.map((item) => (
          <ListItem
            key={item.id}
            divider
            secondaryAction={
              <Stack direction="row" spacing={0.5}>
                {editingId === item.id ? (
                  <IconButton
                    edge="end"
                    color="primary"
                    aria-label="save"
                    onClick={() => onSave(item.id)}
                  >
                    <CheckIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(item);
                    }}
                    disabled={editingId !== null}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
                <IconButton
                  edge="end"
                  color="error"
                  aria-label="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            }
            onClick={
              onItemClick && editingId !== item.id
                ? () => onItemClick(item.id)
                : undefined
            }
            sx={{
              py: 1,
              ...(onItemClick && editingId !== item.id
                ? { cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }
                : {}),
            }}
          >
            {editingId === item.id ? (
              <Stack direction="row" spacing={1} sx={{ width: '100%', mr: 10 }}>
                <TextField
                  fullWidth
                  size="small"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && onSave(item.id)}
                  placeholder="Enter name..."
                />
                {setEditStatus && (
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as string)}
                    >
                      <MenuItem value="OPEN">OPEN</MenuItem>
                      <MenuItem value="LOCKED">LOCKED</MenuItem>
                      <MenuItem value="CLOSED">CLOSED</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Stack>
            ) : (
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {item.name}
                    </Typography>
                    {item.status && (
                      <Chip
                        label={item.status}
                        size="small"
                        color={
                          item.status === 'CLOSED'
                            ? 'success'
                            : item.status === 'LOCKED'
                              ? 'warning'
                              : 'primary'
                        }
                        variant="outlined"
                      />
                    )}
                  </Stack>
                }
                secondary={`Created: ${new Date(item.createdAt).toLocaleString()}`}
              />
            )}
          </ListItem>
        ))}
        {items.length === 0 && (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No items found. Click "Add" to begin.
            </Typography>
          </Box>
        )}
      </List>
    </Paper>
  );
}

function ProjectsView() {
  const navigate = useNavigate();
  const { setBreadcrumbName } = useBreadcrumbs();
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbName('projects', 'Projects');
    api
      .fetchProjects()
      .then(setProjects)
      .catch((e) => setError(e.message));
  }, [setBreadcrumbName]);

  const handleAdd = () => {
    const tempId = `temp-${Date.now()}`;
    setProjects([
      { id: tempId, name: '', createdAt: new Date().toISOString() },
      ...projects,
    ]);
    setEditingId(tempId);
    setEditName('');
  };

  const handleSave = async (id: string) => {
    if (!editName.trim()) {
      if (id.startsWith('temp-'))
        setProjects(projects.filter((p) => p.id !== id));
      setEditingId(null);
      return;
    }
    try {
      const res = id.startsWith('temp-')
        ? await api.createProject(editName)
        : await api.updateProject(id, editName);
      setProjects(projects.map((p) => (p.id === id ? res : p)));
      setEditingId(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Box sx={{ height: '100%' }}>
      <InlineEditList
        title="Project Inventory"
        items={projects}
        onAdd={handleAdd}
        onSave={handleSave}
        onEdit={(p) => {
          setEditingId(p.id);
          setEditName(p.name);
        }}
        onDelete={async (id) => {
          await api.deleteProject(id);
          setProjects(projects.filter((p) => p.id !== id));
        }}
        editingId={editingId}
        editName={editName}
        setEditName={setEditName}
        onItemClick={(id) => navigate(`/projects/${id}`)}
      />
      {error?.includes('401') && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Please log in to view and manage your projects.
        </Alert>
      )}
      {error && !error.includes('401') && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

function ProjectDetailsView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setBreadcrumbName } = useBreadcrumbs();
  
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam ? parseInt(tabParam, 10) : 0;
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    if (tabParam) {
      const val = parseInt(tabParam, 10);
      if (!isNaN(val)) setTab(val);
    }
  }, [tabParam]);

  const [project, setProject] = useState<Project | null>(null);
  const [conditions, setConditions] = useState<Item[]>([]);
  const [features, setFeatures] = useState<Item[]>([]);
  const [keys, setKeys] = useState<Item[]>([]);
  const [projectRequirements, setProjectRequirements] = useState<Item[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('OPEN');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editInfoName, setEditInfoName] = useState('');
  const [editInfoDescription, setEditInfoDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [newKeyBlob, setNewKeyBlob] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setBreadcrumbName('projects', 'Projects');
    api
      .fetchProject(id)
      .then((p) => {
        setProject(p);
        setBreadcrumbName(id, p.name);
      })
      .catch((e) => setError(e.message));
    api
      .fetchConditions(id)
      .then(setConditions)
      .catch((e) => setError(e.message));
    api
      .fetchFeatures(id)
      .then(setFeatures)
      .catch((e) => setError(e.message));
    api
      .fetchKeys(id)
      .then(setKeys)
      .catch((e) => setError(e.message));
    api
      .fetchProjectRequirements(id)
      .then(setProjectRequirements)
      .catch((e) => setError(e.message));
  }, [id, setBreadcrumbName]);

  const handleSaveInfo = async () => {
    if (!id || !editInfoName.trim()) return;
    try {
      const res = await api.updateProject(
        id,
        editInfoName,
        editInfoDescription,
      );
      setProject(res);
      setIsEditingInfo(false);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSave = async (itemId: string) => {
    if (!editName.trim() || !id) {
      if (itemId.startsWith('temp-')) {
        if (tab === 1) setConditions(conditions.filter((i) => i.id !== itemId));
        else if (tab === 2)
          setFeatures(features.filter((i) => i.id !== itemId));
        else if (tab === 3)
          setProjectRequirements(
            projectRequirements.filter((i) => i.id !== itemId),
          );
        else setKeys(keys.filter((i) => i.id !== itemId));
      }
      setEditingId(null);
      return;
    }
    try {
      if (tab === 1) {
        const res = itemId.startsWith('temp-')
          ? await api.createCondition(id, editName)
          : await api.updateCondition(id, itemId, editName);
        setConditions(conditions.map((i) => (i.id === itemId ? res : i)));
      } else if (tab === 2) {
        const res = itemId.startsWith('temp-')
          ? await api.createFeature(id, editName)
          : await api.updateFeature(id, itemId, editName, editStatus);
        setFeatures(features.map((i) => (i.id === itemId ? res : i)));
      } else if (tab === 3) {
        const res = itemId.startsWith('temp-')
          ? await api.createProjectRequirement(id, editName)
          : await api.updateProjectRequirement(id, itemId, editName);
        setProjectRequirements(
          projectRequirements.map((i) => (i.id === itemId ? res : i)),
        );
      } else {
        const res = await api.createKey(id, editName);
        setNewKeyBlob(JSON.stringify(res, null, 2));
        api.fetchKeys(id).then(setKeys);
      }
      setEditingId(null);
      setEditStatus('OPEN');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleAdd = () => {
    const tempId = `temp-${Date.now()}`;
    if (tab === 1) {
      setConditions([
        { id: tempId, name: '', createdAt: new Date().toISOString() },
        ...conditions,
      ]);
    } else if (tab === 2) {
      setFeatures([
        { id: tempId, name: '', createdAt: new Date().toISOString() },
        ...features,
      ]);
    } else if (tab === 3) {
      setProjectRequirements([
        { id: tempId, name: '', createdAt: new Date().toISOString() },
        ...projectRequirements,
      ]);
    } else {
      setKeys([
        { id: tempId, name: '', createdAt: new Date().toISOString() },
        ...keys,
      ]);
    }
    setEditingId(tempId);
    setEditName('');
  };

  if (!project) return <Typography sx={{ p: 3 }}>Loading...</Typography>;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            console.log(`[ProjectDetailsView] Tab changed to ${v}`);
            setSearchParams({ tab: v.toString() });
            setTab(v);
            setEditingId(null);
          }}
        >
          <Tab label="Info" />
          <Tab label="Conditions" />
          <Tab label="Features" />
          <Tab label="Project Requirements" />
          <Tab label="Keys" />
        </Tabs>
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        {tab === 0 && (
          <Paper sx={{ p: 3, position: 'relative' }}>
            {!isEditingInfo ? (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {project.name}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 2,
                        color: project.description
                          ? 'text.primary'
                          : 'text.secondary',
                        fontStyle: project.description ? 'normal' : 'italic',
                      }}
                    >
                      {project.description || 'No description provided.'}
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={() => {
                      setEditInfoName(project.name);
                      setEditInfoDescription(project.description || '');
                      setIsEditingInfo(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  ID: {project.id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Created: {new Date(project.createdAt).toLocaleString()}
                </Typography>
              </>
            ) : (
              <Stack spacing={2}>
                <Typography variant="h6">Edit Project Info</Typography>
                <TextField
                  label="Project Name"
                  fullWidth
                  value={editInfoName}
                  onChange={(e) => setEditInfoName(e.target.value)}
                />
                <TextField
                  label="Project Description"
                  fullWidth
                  multiline
                  rows={4}
                  value={editInfoDescription}
                  onChange={(e) => setEditInfoDescription(e.target.value)}
                  placeholder="Describe the project goals and objectives..."
                />
                <Box
                  sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}
                >
                  <Button onClick={() => setIsEditingInfo(false)}>
                    Cancel
                  </Button>
                  <Button variant="contained" onClick={handleSaveInfo}>
                    Save Changes
                  </Button>
                </Box>
              </Stack>
            )}
          </Paper>
        )}
        {tab === 1 && (
          <InlineEditList
            title="Conditions"
            items={conditions}
            onAdd={handleAdd}
            onSave={handleSave}
            onEdit={(i) => {
              setEditingId(i.id);
              setEditName(i.name);
            }}
            onDelete={async (itemId) => {
              await api.deleteCondition(id!, itemId);
              setConditions(conditions.filter((i) => i.id !== itemId));
            }}
            editingId={editingId}
            editName={editName}
            setEditName={setEditName}
          />
        )}
        {tab === 2 && (
          <InlineEditList
            title="Features"
            items={features}
            onAdd={handleAdd}
            onSave={handleSave}
            onEdit={(i) => {
              setEditingId(i.id);
              setEditName(i.name);
              setEditStatus(i.status || 'OPEN');
            }}
            onDelete={async (itemId) => {
              await api.deleteFeature(id!, itemId);
              setFeatures(features.filter((i) => i.id !== itemId));
            }}
            editingId={editingId}
            editName={editName}
            setEditName={setEditName}
            editStatus={editStatus}
            setEditStatus={setEditStatus}
            onItemClick={(featureId) =>
              navigate(`/projects/${id}/features/${featureId}`)
            }
          />
        )}
        {tab === 3 && (
          <InlineEditList
            title="Project Requirements (Templates)"
            items={projectRequirements}
            onAdd={handleAdd}
            onSave={handleSave}
            onEdit={(i) => {
              setEditingId(i.id);
              setEditName(i.name);
            }}
            onDelete={async (itemId) => {
              await api.deleteProjectRequirement(id!, itemId);
              setProjectRequirements(
                projectRequirements.filter((i) => i.id !== itemId),
              );
            }}
            editingId={editingId}
            editName={editName}
            setEditName={setEditName}
          />
        )}
        {tab === 4 && (
          <InlineEditList
            title="Keys"
            items={keys}
            onAdd={handleAdd}
            onSave={handleSave}
            onEdit={(i) => {
              setEditingId(i.id);
              setEditName(i.name);
            }}
            onDelete={async (itemId) => {
              await api.deleteKey(id!, itemId);
              setKeys(keys.filter((i) => i.id !== itemId));
            }}
            editingId={editingId}
            editName={editName}
            setEditName={setEditName}
          />
        )}
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* New Key Dialog */}
      <Dialog
        open={newKeyBlob !== null}
        onClose={() => setNewKeyBlob(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Project API Key Generated</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Important: Store this JSON in a <strong>.key</strong> file in your
            project root. It will never be shown again.
          </DialogContentText>
          <Paper
            variant="outlined"
            sx={{ p: 2, bgcolor: 'grey.50', position: 'relative' }}
          >
            <Box
              component="pre"
              sx={{ m: 0, overflow: 'auto', fontSize: '0.85rem' }}
            >
              {newKeyBlob}
            </Box>
            <IconButton
              sx={{ position: 'absolute', top: 8, right: 8 }}
              onClick={() => {
                navigator.clipboard.writeText(newKeyBlob || '');
              }}
              size="small"
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setNewKeyBlob(null)}
            color="primary"
            variant="contained"
          >
            I have saved it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function FeatureDetailsView() {
  const { projectId, featureId } = useParams<{
    projectId: string;
    featureId: string;
  }>();
  const { setBreadcrumbName, names } = useBreadcrumbs();
  const [feature, setFeature] = useState<Item | null>(null);
  const [requirements, setRequirements] = useState<Item[]>([]);
  const [projectRequirements, setProjectRequirements] = useState<Item[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('OPEN');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !featureId) return;
    setBreadcrumbName('projects', 'Projects');
    setBreadcrumbName('features', 'Features');

    if (!names[projectId]) {
      api.fetchProject(projectId).then((p) => setBreadcrumbName(projectId, p.name));
    }

    api
      .fetchFeature(projectId, featureId)
      .then((f) => {
        setFeature(f);
        setBreadcrumbName(featureId, f.name);
      })
      .catch((e) => setError(e.message));
    api
      .fetchRequirements(projectId, featureId)
      .then(setRequirements)
      .catch((e) => setError(e.message));
    api
      .fetchProjectRequirements(projectId)
      .then(setProjectRequirements)
      .catch((e) => setError(e.message));
  }, [projectId, featureId, setBreadcrumbName, names]);

  const handleAdd = () => {
    const tempId = `temp-${Date.now()}`;
    setRequirements([
      {
        id: tempId,
        name: '',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      },
      ...requirements,
    ]);
    setEditingId(tempId);
    setEditName('');
    setEditStatus('OPEN');
  };

  const handleSave = async (id: string) => {
    if (!editName.trim() || !projectId || !featureId) {
      if (id.startsWith('temp-'))
        setRequirements(requirements.filter((r) => r.id !== id));
      setEditingId(null);
      return;
    }
    try {
      const res = id.startsWith('temp-')
        ? await api.createRequirement(projectId, featureId, editName)
        : await api.updateRequirement(
            projectId,
            featureId,
            id,
            editName,
            editStatus,
          );
      setRequirements(requirements.map((r) => (r.id === id ? res : r)));
      setEditingId(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!feature)
    return <Typography sx={{ p: 3 }}>Loading Feature...</Typography>;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {feature.name}
          </Typography>
          <Chip
            label={feature.status}
            color={
              feature.status === 'CLOSED'
                ? 'success'
                : feature.status === 'LOCKED'
                  ? 'warning'
                  : 'primary'
            }
          />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          ID: {feature.id}
        </Typography>
      </Paper>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Definition of Done (Project Templates)
            </Typography>
            <Paper variant="outlined">
              <List sx={{ p: 0 }}>
                {projectRequirements.map((pr) => (
                  <ListItem key={pr.id} divider>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <CheckIcon color="disabled" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={pr.name} />
                  </ListItem>
                ))}
                {projectRequirements.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No project-wide requirements defined."
                      sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Box>

          <InlineEditList
            title="Feature-Specific Requirements"
            items={requirements}
            onAdd={handleAdd}
            onSave={handleSave}
            onEdit={(i) => {
              setEditingId(i.id);
              setEditName(i.name);
              setEditStatus(i.status || 'OPEN');
            }}
            onDelete={async (id) => {
              await api.deleteRequirement(projectId!, featureId!, id);
              setRequirements(requirements.filter((r) => r.id !== id));
            }}
            editingId={editingId}
            editName={editName}
            setEditName={setEditName}
            editStatus={editStatus}
            setEditStatus={(s) => setEditStatus(s)}
          />
        </Stack>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

function SystemView() {
  const [health, setHealth] = useState<any>(null);
  const [apiSentinel, setApiSentinel] = useState<any>(null);
  const [dbSentinel, setDbSentinel] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    api.fetchHealth().then(setHealth);
    fetch('/api/open/health/api')
      .then(async (r) => {
        const data = await r.json();
        console.log('[SystemView] API Sentinel Response:', r.status, data);
        setApiSentinel(data);
      })
      .catch((err) => {
        console.error('[SystemView] API Sentinel Error:', err);
        setApiSentinel({ error: true });
      });
    fetch('/api/open/health/db')
      .then(async (r) => {
        const text = await r.text();
        console.log('[SystemView] DB Sentinel Raw:', r.status, text);
        try {
          const data = JSON.parse(text);
          setDbSentinel(data);
        } catch (e) {
          console.error('[SystemView] DB Sentinel JSON Parse Error:', text);
          setDbSentinel({ error: true, raw: text });
        }
      })
      .catch((err) => {
        console.error('[SystemView] DB Sentinel Error:', err);
        setDbSentinel({ error: true });
      });
    api.fetchSession().then(setSession);
  }, []);

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Diagnostic Sentinels
        </Typography>
        <Stack direction="row" spacing={2}>
          <Alert
            icon={false}
            severity={
              apiSentinel?.sentinel === 'SMRT-V1-READY' ? 'success' : 'error'
            }
            sx={{ flexGrow: 1 }}
          >
            API Status:{' '}
            {apiSentinel?.sentinel === 'SMRT-V1-READY' ? 'Ready' : 'Offline'}
            <span
              id="diag-api"
              style={{
                visibility: 'hidden',
                position: 'absolute',
                width: 0,
                height: 0,
                overflow: 'hidden',
              }}
            >
              {apiSentinel?.sentinel}
            </span>
          </Alert>
          <Alert
            icon={false}
            severity={
              dbSentinel?.sentinel === 'SMRT-V1-READY' ? 'success' : 'error'
            }
            sx={{ flexGrow: 1 }}
          >
            DB Status:{' '}
            {dbSentinel?.sentinel === 'SMRT-V1-READY' ? 'Ready' : 'Offline'}
            <span
              id="diag-db"
              style={{
                visibility: 'hidden',
                position: 'absolute',
                width: 0,
                height: 0,
                overflow: 'hidden',
              }}
            >
              {dbSentinel?.sentinel}
            </span>
          </Alert>
        </Stack>
      </Paper>
      {health && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            API Health
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(health, null, 2)}
          </Box>
        </Paper>
      )}
      {session && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Session Info
          </Typography>
          <Typography variant="body2">ID: {session.sessionId}</Typography>
          <Typography variant="body2">Visits: {session.visits}</Typography>
        </Paper>
      )}
    </Stack>
  );
}

function BreadcrumbsArea() {
  const location = useLocation();
  const { names } = useBreadcrumbs();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ flexGrow: 1, ml: 2 }}
    >
      <Link
        component={RouterLink}
        underline="hover"
        color="inherit"
        to="/"
        sx={{ display: 'flex', alignItems: 'center' }}
        aria-label="breadcrumb-home"
      >
        <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
        Home
      </Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        let to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const displayName = names[value] || value;

        // Custom logic for "features" segment:
        // If the path is /projects/:id/features, it should link to /projects/:id?tab=2
        if (value === 'features' && index > 0 && pathnames[index-1] !== 'projects') {
          const projectId = pathnames[index-1];
          to = `/projects/${projectId}?tab=2`;
        }
        
        return last ? (
          <Typography color="text.primary" key={to} aria-label={`breadcrumb-active`}>
            {displayName}
          </Typography>
        ) : (
          <Link
            component={RouterLink}
            underline="hover"
            color="inherit"
            to={to}
            key={to}
            aria-label={`breadcrumb-${value}`}
          >
            {displayName}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}

function AuthView({ onLogin }: { onLogin: () => void }) {
  const [isLogin, setIsNew] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        await api.login({ email, password });
      } else {
        await api.register({ email, password, name });
        await api.login({ email, password });
      }
      onLogin();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
      }}
    >
      <Paper sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 2 }}>
        <Typography
          variant="h5"
          align="center"
          gutterBottom
          sx={{ fontWeight: 'bold' }}
        >
          {isLogin ? 'Login to SMRT' : 'Create Account'}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {!isLogin && (
            <TextField
              fullWidth
              label="Name"
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <TextField
            fullWidth
            label="Email"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
          />
          <TextField
            fullWidth
            label="Password"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
          >
            {isLogin ? 'Login' : 'Register'}
          </Button>
          <Button fullWidth onClick={() => setIsNew(!isLogin)} sx={{ mt: 1 }}>
            {isLogin
              ? "Don't have an account? Register"
              : 'Already have an account? Login'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

function Layout({ session, onLogout }: { session: any; onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'grey.100',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 64,
          }}
        >
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
            SMRT
          </Typography>
        </Box>
        <Divider />
        <List sx={{ px: 1, flexGrow: 1 }}>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith('/projects')}
              onClick={() => navigate('/projects')}
              sx={{ borderRadius: 1, mb: 0.5 }}
              data-testid="nav-projects"
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <HomeIcon
                  color={
                    location.pathname.startsWith('/projects')
                      ? 'primary'
                      : 'inherit'
                  }
                />
              </ListItemIcon>
              <ListItemText primary="Projects" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/system'}
              onClick={() => navigate('/system')}
              sx={{ borderRadius: 1 }}
              data-testid="nav-system"
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SettingsIcon
                  color={
                    location.pathname === '/system' ? 'primary' : 'inherit'
                  }
                />
              </ListItemIcon>
              <ListItemText primary="System" />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            noWrap
            sx={{ mb: 1 }}
          >
            Logged in as: {session.userId}
          </Typography>
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            size="small"
            onClick={onLogout}
            data-testid="logout-button"
          >
            Logout
          </Button>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        <Box
          sx={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            px: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <BreadcrumbsArea />
          <Typography
            variant="h6"
            sx={{ fontWeight: 'bold', color: 'text.secondary' }}
          >
            SMRT Admin
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, minHeight: 0 }}>
          <Routes>
            {' '}
            <Route path="/projects" element={<ProjectsView />} />
            <Route path="/projects/:id" element={<ProjectDetailsView />} />
            <Route
              path="/projects/:projectId/features/:featureId"
              element={<FeatureDetailsView />}
            />
            <Route path="/system" element={<SystemView />} />
            <Route path="/" element={<ProjectsView />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const s = await api.fetchSession();
      setSession(s);
    } catch (e) {
      console.error('Session fetch failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setSession(null);
    refreshSession();
  };

  if (loading) return <Typography sx={{ p: 4 }}>Initializing...</Typography>;

  return (
    <BrowserRouter>
      {session?.userId ? (
        <BreadcrumbProvider>
          <Layout session={session} onLogout={handleLogout} />
        </BreadcrumbProvider>
      ) : (
        <AuthView onLogin={refreshSession} />
      )}
    </BrowserRouter>
  );
}

export default App;

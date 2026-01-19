import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
	Alert,
	Box,
	Button,
	IconButton,
	List,
	ListItem,
	ListItemText,
	Paper,
	Stack,
	Tab,
	Tabs,
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
	updateProject,
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

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function CustomTabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<Box
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			sx={{ flexGrow: 1, overflow: 'auto', width: '100%' }}
			{...other}
		>
			{value === index && (
				<Box sx={{ p: 3, height: '100%', boxSizing: 'border-box' }}>
					{children}
				</Box>
			)}
		</Box>
	);
}

function App() {
	const [tabValue, setTabValue] = useState(0);
	const [session, setSession] = useState<SessionData | null>(null);
	const [health, setHealth] = useState<HealthData | null>(null);
	const [projects, setProjects] = useState<Project[]>([]);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState('');
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

	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	const handleAddRow = () => {
		const tempId = `temp-${Date.now()}`;
		const newProject: Project = {
			id: tempId,
			name: '',
			createdAt: new Date().toISOString(),
		};
		setProjects([newProject, ...projects]);
		setEditingId(tempId);
		setEditName('');
	};

	const handleSave = async (id: string) => {
		if (!editName.trim()) {
			if (id.startsWith('temp-')) {
				setProjects(projects.filter((p) => p.id !== id));
				setEditingId(null);
			}
			return;
		}

		try {
			if (id.startsWith('temp-')) {
				const created = await createProject(editName);
				setProjects(projects.map((p) => (p.id === id ? created : p)));
			} else {
				const updated = await updateProject(id, editName);
				setProjects(projects.map((p) => (p.id === id ? updated : p)));
			}
			setEditingId(null);
			setEditName('');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save');
		}
	};

	const handleEdit = (project: Project) => {
		setEditingId(project.id);
		setEditName(project.name);
	};

	const handleDelete = async (id: string) => {
		if (id.startsWith('temp-')) {
			setProjects(projects.filter((p) => p.id !== id));
			setEditingId(null);
			return;
		}
		try {
			await deleteProject(id);
			setProjects(projects.filter((p) => p.id !== id));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete');
		}
	};

	return (
		<Box
			sx={{
				height: '100vh',
				width: '100vw',
				display: 'flex',
				flexDirection: 'column',
				bgcolor: 'background.default',
				overflow: 'hidden',
			}}
		>
			{/* Header with Tabs and Title */}
			<Box
				sx={{
					borderBottom: 1,
					borderColor: 'divider',
					display: 'flex',
					alignItems: 'center',
					px: 2,
					bgcolor: 'background.paper',
				}}
			>
				<Tabs
					value={tabValue}
					onChange={handleTabChange}
					sx={{ flexGrow: 1 }}
				>
					<Tab label="Projects" />
					<Tab label="System" />
				</Tabs>
				<Typography
					variant="h6"
					component="div"
					sx={{ fontWeight: 'bold', color: 'primary.main' }}
				>
					SMRT Admin
				</Typography>
			</Box>

			{/* Main Content Area */}
			<Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
				<CustomTabPanel value={tabValue} index={0}>
					<Paper
						sx={{
							height: '100%',
							display: 'flex',
							flexDirection: 'column',
							p: 0,
							overflow: 'hidden',
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
							<Typography variant="h6">Project Inventory</Typography>
							<Button
								variant="contained"
								startIcon={<AddIcon />}
								onClick={handleAddRow}
								disabled={editingId !== null}
							>
								Add Project
							</Button>
						</Box>

						<List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
							{projects.map((project) => (
								<ListItem
									key={project.id}
									divider
									sx={{ py: 1.5 }}
									secondaryAction={
										<Stack direction="row" spacing={1}>
											{editingId === project.id ? (
												<IconButton
													edge="end"
													color="primary"
													aria-label="save"
													onClick={() => handleSave(project.id)}
												>
													<CheckIcon />
												</IconButton>
											) : (
												<IconButton
													edge="end"
													aria-label="edit"
													onClick={() => handleEdit(project)}
													disabled={editingId !== null}
												>
													<EditIcon />
												</IconButton>
											)}
											<IconButton
												edge="end"
												color="error"
												aria-label="delete"
												onClick={() => handleDelete(project.id)}
											>
												<DeleteIcon />
											</IconButton>
										</Stack>
									}
								>
									{editingId === project.id ? (
										<TextField
											fullWidth
											size="small"
											autoFocus
											value={editName}
											onChange={(e) => setEditName(e.target.value)}
											onKeyPress={(e) =>
												e.key === 'Enter' && handleSave(project.id)
											}
											placeholder="Enter project name..."
											sx={{ mr: 12 }}
										/>
									) : (
										<ListItemText
											primary={project.name}
											secondary={`Created: ${new Date(
												project.createdAt,
											).toLocaleString()}`}
										/>
									)}
								</ListItem>
							))}
							{projects.length === 0 && (
								<Box sx={{ p: 4, textAlign: 'center' }}>
									<Typography variant="body1" color="textSecondary">
										No projects found. Click "Add Project" to begin.
									</Typography>
								</Box>
							)}
						</List>
					</Paper>
				</CustomTabPanel>

				<CustomTabPanel value={tabValue} index={1}>
					<Stack spacing={3}>
						{health && (
							<Paper sx={{ p: 2 }}>
								<Typography variant="h6" gutterBottom>
									API Health
								</Typography>
								<Box
									component="pre"
									sx={{
										p: 2,
										bgcolor: 'grey.100',
										borderRadius: 1,
										overflow: 'auto',
									}}
								>
									{JSON.stringify(health, null, 2)}
								</Box>
							</Paper>
						)}
						{session && (
							<Paper sx={{ p: 2 }}>
								<Typography variant="h6" gutterBottom>
									Session Information
								</Typography>
								<Typography variant="body2">
									<strong>ID:</strong> {session.sessionId}
								</Typography>
								<Typography variant="body2">
									<strong>Visits:</strong> {session.visits}
								</Typography>
							</Paper>
						)}
					</Stack>
				</CustomTabPanel>
			</Box>

			{/* Global Error Alert */}
			{error && (
				<Box
					sx={{
						position: 'fixed',
						bottom: 24,
						left: '50%',
						transform: 'translateX(-50%)',
						zIndex: 2000,
						minWidth: 300,
					}}
				>
					<Alert severity="error" onClose={() => setError(null)} variant="filled">
						{error}
					</Alert>
				</Box>
			)}
		</Box>
	);
}

export default App;

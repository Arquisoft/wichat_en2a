import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Checkbox,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControlLabel,
} from '@mui/material';
import Navbar from './Navbar';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const categories = [
  { type: 'flag', label: 'Flags' },
  { type: 'car', label: 'Cars' },
  { type: 'famous-person', label: 'Famous People' },
  { type: 'dino', label: 'Dinosaurs' },
  { type: 'place', label: 'Places' }
];

const CustomGameMode = () => {
  const [timeLimit, setTimeLimit] = useState(20);
  const [selectedCategories, setSelectedCategories] = useState({});
  const [questionCounts, setQuestionCounts] = useState({});
  const [readyEnabled, setReadyEnabled] = useState(false);
  const [shuffle, setShuffle] = useState(true);
  const navigate = useNavigate();

  const maxTotal = 30;
  const minTotal = 5;

  const totalQuestions = Object.values(questionCounts).reduce((acc, val) => acc + val, 0);

  useEffect(() => {
    setReadyEnabled(totalQuestions >= minTotal && totalQuestions <= maxTotal);
  }, [questionCounts]);

  const handleCheckboxChange = (type) => {
    setSelectedCategories(prev => {
      const updated = { ...prev, [type]: !prev[type] }; //invert result of previous
      setQuestionCounts(qc => ({ ...qc, [type]: updated[type] ? 1 : 0 })); //one by default if activated, 0 if deactivated
      return updated;
    });
  };

  const handleSpinnerChange = (type, value) => {
    value = Math.max(0, Math.min(value, 30));
    const proposedTotal = totalQuestions - (questionCounts[type] || 0) + value; //check if more than 30
    if (proposedTotal <= maxTotal) {
      setQuestionCounts(prev => ({ ...prev, [type]: value }));
    }
  };

  const handleReady = async () => {
    const selected = Object.entries(questionCounts) //transform to an array
      .filter(([_, count]) => count > 0) //pick only the ones with questions (greater than 0)
      .map(([type, count]) => ({ questionType: type, numberOfQuestions: count })); //format it to work on the backend

    try {
      await fetch(`${apiEndpoint}/clear-questions`, { method: 'POST' });
      await fetch(`${apiEndpoint}/fetch-custom-question-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeLimit,
          questions: selected,
          shuffle
        })
      });
      navigate('/game');
    } catch (error) {
      console.error('Failed to start custom game:', error);
    }
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          backgroundImage: 'url(/questionMark.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: "#6A5ACD",
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          opacity: 0.25,
          zIndex: -1,
        }}
      />

      <Container maxWidth="md" sx={{ mt: 10 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
          Custom Game Mode
        </Typography>

        <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 2 }}>Time limit per question:</Typography>
          <TextField
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            inputProps={{ min: 5, max: 60 }}
            size="small"
          />
          <Typography variant="body2" sx={{ ml: 1 }}>seconds</Typography>
        </Box>

        <Typography variant="body1" sx={{ textAlign: 'center', mb: 1 }}>
          Total number of questions must be between 5 and 30. Current total: <strong>{totalQuestions}</strong>
        </Typography>

        <FormControlLabel
          control={
            <Checkbox
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
              size="small"
            />
          }
          label="Shuffle questions?"
        />

        <Box 
        sx={{
          maxHeight: 280, //Change this to adjust for no scroll
          overflowY: 'auto',
          overflowX: 'auto',
          bgcolor: '#f4a261',
          borderRadius: 2,
          p: 2,
          mb: 3
        }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Select</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Game Mode</TableCell>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Number of Questions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map(({ type, label }) => (
                <TableRow key={type}>
                  <TableCell>
                    <Checkbox
                      checked={!!selectedCategories[type]}
                      onChange={() => handleCheckboxChange(type)}
                      disabled={
                        !selectedCategories[type] && totalQuestions >= maxTotal
                      }
                    />
                  </TableCell>
                  <TableCell>{label}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={questionCounts[type] || 0}
                      onChange={(e) => handleSpinnerChange(type, Number(e.target.value))}
                      inputProps={{ min: 0, max: 30 }}
                      disabled={!selectedCategories[type]}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Box display="flex" justifyContent="space-between">
          <Button variant="outlined" color="secondary" onClick={() => navigate('/gamemodes')}>
            Back
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleReady}
            disabled={!readyEnabled}
          >
            Ready
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default CustomGameMode;

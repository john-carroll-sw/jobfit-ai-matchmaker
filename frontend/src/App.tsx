import React, { useState } from "react";
import {
  CssBaseline, Container, Box, Typography, ThemeProvider,
  TextField, Button, Paper, CircularProgress, Divider,
  FormControl, FormControlLabel, Switch, Select, MenuItem,
  InputLabel, Slider, Chip, Card, CardContent, Rating
} from "@mui/material";
import { muiTheme } from "./theme/muiTheme";
import { matchResumes } from "./api/resumeMatchmakerApi";
import type { ResumeMatchingResponse, ResumeMatch } from "@jobfit-ai/shared/src/resumeMatchmakerTypes";

const App: React.FC = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResumeMatchingResponse | null>(null);
  const [useHybridSearch, setUseHybridSearch] = useState(true);
  const [topResults, setTopResults] = useState(10);
  const [industryType, setIndustryType] = useState<"general" | "technology" | "healthcare" | "finance" | "education">("general");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [weights, setWeights] = useState({
    experience: 0.3,
    technicalSkills: 0.3,
    certifications: 0.2,
    education: 0.2,
  });

  const handleSubmit = async () => {
    if (!jobDescription.trim()) {
      setError("Please enter a job description");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const matchingOptions = {
        useHybridSearch,
        topResults,
        industryType,
        customWeights: showAdvancedOptions ? weights : undefined,
      };
      const response = await matchResumes({ jobDescription, matchingOptions });
      setResults(response);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Failed to match resumes'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightChange = (field: keyof typeof weights) => (_: Event, value: number | number[]) => {
    setWeights(prev => ({ ...prev, [field]: value as number }));
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          width: "100vw",
          background: "linear-gradient(120deg, #181A20 0%, #23262F 100%)",
          fontFamily: muiTheme.typography.fontFamily,
        }}
      >
        <Container
          maxWidth={false}
          disableGutters
          sx={{
            height: "calc(100vh - 10px)",
            width: "100vw",
            display: "flex",
            flexDirection: "column",
            m: 0,
            p: 2,
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ color: "primary.main", mb: 2 }}>
            Jobfit AI Matchmaker
          </Typography>
          <Box sx={{ display: "flex", flexGrow: 1, gap: 2, overflow: "hidden" }}>
            {/* Left panel - Job description input */}
            <Paper
              elevation={3}
              sx={{
                flex: '0 0 40%',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(35, 38, 47, 0.7)',
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" gutterBottom color="primary.light">
                Job Description
              </Typography>
              <TextField
                multiline
                fullWidth
                rows={12}
                variant="outlined"
                placeholder="Paste job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                sx={{
                  mb: 2,
                  backgroundColor: 'rgba(24, 26, 32, 0.5)',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    }
                  }
                }}
              />
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Search Options
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useHybridSearch}
                        onChange={(e) => setUseHybridSearch(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Hybrid Search"
                  />
                  <FormControl size="small" sx={{ width: '120px' }}>
                    <InputLabel>Industry</InputLabel>
                    <Select
                      value={industryType}
                      label="Industry"
                      onChange={(e) => setIndustryType(e.target.value as typeof industryType)}
                    >
                      <MenuItem value="general">General</MenuItem>
                      <MenuItem value="technology">Technology</MenuItem>
                      <MenuItem value="healthcare">Healthcare</MenuItem>
                      <MenuItem value="finance">Finance</MenuItem>
                      <MenuItem value="education">Education</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                {/* Add Top Results slider */}
                <Box sx={{ mb: 1, mt: 1 }}>
                  <Typography variant="caption">Top Results: {topResults}</Typography>
                  <Slider
                    value={topResults}
                    min={1}
                    max={20}
                    step={1}
                    onChange={(_, value) => setTopResults(value as number)}
                    sx={{ width: 120 }}
                  />
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showAdvancedOptions}
                      onChange={(e) => setShowAdvancedOptions(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label="Advanced Options"
                />
                {showAdvancedOptions && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Matching Weights
                    </Typography>
                    <Box sx={{ px: 1 }}>
                      <Typography variant="caption">Experience ({weights.experience})</Typography>
                      <Slider
                        value={weights.experience}
                        min={0}
                        max={1}
                        step={0.1}
                        onChange={handleWeightChange('experience')}
                        sx={{ mt: 1 }}
                      />
                      <Typography variant="caption">Technical Skills ({weights.technicalSkills})</Typography>
                      <Slider
                        value={weights.technicalSkills}
                        min={0}
                        max={1}
                        step={0.1}
                        onChange={handleWeightChange('technicalSkills')}
                        sx={{ mt: 1 }}
                      />
                      <Typography variant="caption">Certifications ({weights.certifications})</Typography>
                      <Slider
                        value={weights.certifications}
                        min={0}
                        max={1}
                        step={0.1}
                        onChange={handleWeightChange('certifications')}
                        sx={{ mt: 1 }}
                      />
                      <Typography variant="caption">Education ({weights.education})</Typography>
                      <Slider
                        value={weights.education}
                        min={0}
                        max={1}
                        step={0.1}
                        onChange={handleWeightChange('education')}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
              <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleSubmit}
                  disabled={isLoading || !jobDescription.trim()}
                  sx={{ px: 4, py: 1, borderRadius: 2 }}
                >
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : "Find Matching Candidates"}
                </Button>
              </Box>
              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                  {error}
                </Typography>
              )}
            </Paper>
            {/* Right panel - Search results */}
            <Paper
              elevation={3}
              sx={{
                flex: '0 0 60%',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(35, 38, 47, 0.7)',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative', // <-- add for overlay
              }}
            >
              {/* Loading overlay */}
              {isLoading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    bgcolor: 'rgba(24, 26, 32, 0.7)',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={48} color="primary" />
                </Box>
              )}
              <Typography variant="h6" gutterBottom color="primary.light">
                Matching Candidates
              </Typography>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                  <CircularProgress />
                </Box>
              ) : results ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  {/* Best match section */}
                  {results.bestMatch && (
                    <>
                      <Paper
                        elevation={2}
                        sx={{
                          p: 2,
                          mb: 2,
                          backgroundColor: 'rgba(76, 175, 80, 0.08)',
                          borderRadius: 2,
                          border: '1px solid rgba(76, 175, 80, 0.2)',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" color="primary.light" fontWeight="bold">
                            Best Match: {results.bestMatch.candidateName}
                          </Typography>
                          <Chip
                            label={`Score: ${Math.round(results.bestMatch.overallScore * 100)}%`}
                            color="success"
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                          {results.bestMatch.recommendation}
                        </Typography>
                      </Paper>
                      <Divider sx={{ mb: 2 }} />
                    </>
                  )}
                  {/* Match list */}
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {results.matches.length} Candidates Found
                    {results.metadata?.processingTimeMs &&
                      ` in ${(results.metadata.processingTimeMs / 1000).toFixed(2)}s`}
                  </Typography>
                  <Box sx={{ overflowY: 'auto', pr: 1, flex: 1 }}>
                    {results.matches.map((match) => (
                      <CandidateCard key={match.resumeId} match={match} />
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                  <Typography color="text.secondary">
                    Enter a job description and click "Find Matching Candidates" to see results
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

const CandidateCard: React.FC<{ match: ResumeMatch }> = ({ match }) => {
  return (
    <Card sx={{ mb: 2, backgroundColor: 'rgba(24, 26, 32, 0.7)', borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" color="white">
            {match.candidateName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" mr={1}>
              Match Score:
            </Typography>
            <Rating
              value={match.matchAnalysis.overallMatch * 5}
              precision={0.5}
              readOnly
              size="small"
            />
            <Typography variant="body2" color="primary.light" ml={1}>
              {Math.round(match.matchAnalysis.overallMatch * 100)}%
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {match.matchAnalysis.summary}
        </Typography>
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Strengths:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {match.matchAnalysis.technicalSkillsMatch.strengths.slice(0, 3).map((strength, i) => (
              <Chip
                key={i}
                label={strength}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
            {match.matchAnalysis.technicalSkillsMatch.strengths.length > 3 && (
              <Chip
                label={`+${match.matchAnalysis.technicalSkillsMatch.strengths.length - 3} more`}
                size="small"
                color="default"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Gaps:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {match.matchAnalysis.technicalSkillsMatch.gaps.slice(0, 3).map((gap, i) => (
              <Chip
                key={i}
                label={gap}
                size="small"
                color="error"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
            {match.matchAnalysis.technicalSkillsMatch.gaps.length > 3 && (
              <Chip
                label={`+${match.matchAnalysis.technicalSkillsMatch.gaps.length - 3} more`}
                size="small"
                color="default"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default App;

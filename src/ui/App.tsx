import {
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { useCallback, useEffect, useState } from "react";

// Import Material-UI icons
import AnalyticsIcon from "@mui/icons-material/Analytics";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import ImageIcon from "@mui/icons-material/Image";
import KeyIcon from "@mui/icons-material/Key";
import SaveIcon from "@mui/icons-material/Save";

// Define our metadata interface matching the plugin code
interface DesignMetadata {
  headline: string | null;
  subheadline: string | null;
  body_text: string | null;
  call_to_action: string | null;
  disclaimer: string | null;
  keywords: string[];
  locale: string;
  aspect_ratio: string;
  background_color: string;
  objects: string[];
}

// Create a modern theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#2563EB",
    },
    secondary: {
      main: "#8B5CF6",
    },
    background: {
      default: "#F8FAFC",
      paper: "#FFFFFF",
    },
    success: {
      main: "#10B981",
    },
    error: {
      main: "#EF4444",
    },
    warning: {
      main: "#F59E0B",
    },
  },
  typography: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.5px",
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      lineHeight: 1.7,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          padding: "10px 20px",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow:
            "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        },
      },
    },
  },
});

// Main app component
function App() {
  // State for the analysis process
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);

  // State for the metadata
  const [metadata, setMetadata] = useState<DesignMetadata>({
    headline: null,
    subheadline: null,
    body_text: null,
    call_to_action: null,
    disclaimer: null,
    keywords: [],
    locale: "en",
    aspect_ratio: "1:1",
    background_color: "transparent",
    objects: [],
  });

  // State for the OpenAI enhanced metadata
  const [aiEnhancedMetadata, setAiEnhancedMetadata] =
    useState<DesignMetadata | null>(null);

  // Function to save API key
  const saveApiKey = useCallback(() => {
    if (!apiKey.trim()) {
      setNotification({
        message: "Please enter a valid API key",
        type: "error",
      });
      return;
    }

    setSavingApiKey(true);
    parent.postMessage(
      {
        pluginMessage: {
          type: "save-api-key",
          apiKey: apiKey.trim(),
        },
      },
      "*",
    );
  }, [apiKey]);

  // Function to start analysis
  const startAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    setImagePreview(null);
    setAiEnhancedMetadata(null);
    parent.postMessage({ pluginMessage: { type: "analyze-selection" } }, "*");
  }, []);

  // Function to save results
  const saveResults = useCallback(() => {
    const finalResults = aiEnhancedMetadata || metadata;
    parent.postMessage(
      {
        pluginMessage: {
          type: "save-results",
          results: finalResults,
        },
      },
      "*",
    );
    setNotification({
      message: "Analysis results saved successfully!",
      type: "success",
    });
  }, [metadata, aiEnhancedMetadata]);

  // Cancel and close the plugin
  const onCancel = useCallback(() => {
    parent.postMessage({ pluginMessage: { type: "cancel" } }, "*");
  }, []);

  // Function to handle the OpenAI analysis
  const performOpenAIAnalysis = useCallback(async () => {
    if (!imagePreview) {
      setNotification({
        message: "No image available for analysis",
        type: "error",
      });
      return;
    }

    if (!apiKey) {
      setShowApiKeyInput(true);
      setNotification({
        message: "Please enter your OpenAI API key",
        type: "info",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      setNotification({
        message: "Analyzing with OpenAI...",
        type: "info",
      });

      // Extract the base64 image data
      const imageData = imagePreview.split(",")[1];

      // Create the prompt for OpenAI
      const prompt = `Analyze this design image and extract the following metadata:
      1. Main headline text
      2. Subheadline text (if present)
      3. Body text content
      4. Call to action text
      5. Any disclaimer text
      6. A list of relevant keywords based on the content
      7. The locale/language of the content
      8. Aspect ratio of the design
      9. Background color description
      10. List of objects/elements visible in the design

      Also look for any design patterns, UI elements, and composition techniques.
      Format your response as a structured JSON matching this exact schema:
      {
        "headline": string or null,
        "subheadline": string or null,
        "body_text": string or null,
        "call_to_action": string or null,
        "disclaimer": string or null,
        "keywords": array of strings,
        "locale": string,
        "aspect_ratio": string,
        "background_color": string,
        "objects": array of strings
      }`;

      // Call OpenAI API (GPT-4 Vision)
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini", // Using GPT-4 Vision for image analysis
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/png;base64,${imageData}`,
                      detail: "high",
                    },
                  },
                ],
              },
            ],
            max_tokens: 1000,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || "OpenAI API request failed",
        );
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No content returned from OpenAI");
      }

      // Extract the JSON from the response
      const jsonMatch =
        content.match(/```json\n([\s\S]*?)\n```/) ||
        content.match(/{[\s\S]*?}/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

      // Parse the JSON response
      const aiResults = JSON.parse(jsonString.replace(/^```json\n|```$/g, ""));

      // Ensure the response has all required fields
      const enhancedMetadata: DesignMetadata = {
        headline: aiResults.headline || metadata.headline,
        subheadline: aiResults.subheadline || metadata.subheadline,
        body_text: aiResults.body_text || metadata.body_text,
        call_to_action: aiResults.call_to_action || metadata.call_to_action,
        disclaimer: aiResults.disclaimer || metadata.disclaimer,
        keywords: aiResults.keywords || metadata.keywords,
        locale: aiResults.locale || metadata.locale,
        aspect_ratio: aiResults.aspect_ratio || metadata.aspect_ratio,
        background_color:
          aiResults.background_color || metadata.background_color,
        objects: aiResults.objects || metadata.objects,
      };

      setAiEnhancedMetadata(enhancedMetadata);
      setIsAnalyzing(false);
      setSelectedTab(1); // Switch to results tab
      setNotification({
        message: "OpenAI analysis complete!",
        type: "success",
      });
    } catch (error) {
      console.error("Error with OpenAI analysis:", error);
      setNotification({
        message: `Error during OpenAI analysis: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        type: "error",
      });
      setIsAnalyzing(false);
    }
  }, [imagePreview, metadata, apiKey]);

  // Function to copy JSON to clipboard
  const copyToClipboard = useCallback(() => {
    const jsonString = JSON.stringify(aiEnhancedMetadata || metadata, null, 2);
    navigator.clipboard.writeText(jsonString);
    setNotification({
      message: "JSON copied to clipboard!",
      type: "success",
    });
  }, [metadata, aiEnhancedMetadata]);

  // Handle messages from the plugin code
  useEffect(() => {
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;

      if (msg.type === "metadata-extracted") {
        setMetadata(msg.metadata);
        setImagePreview(`data:image/png;base64,${msg.image}`);
        setIsAnalyzing(false);
        setNotification({
          message: "Design data extracted successfully!",
          type: "success",
        });
      } else if (msg.type === "analysis-error") {
        setIsAnalyzing(false);
        setNotification({
          message: msg.message || "Error during analysis",
          type: "error",
        });
      } else if (msg.type === "analysis-start") {
        setIsAnalyzing(true);
      } else if (msg.type === "api-key-loaded") {
        // Handle API key loaded from storage
        setApiKey(msg.apiKey);
        setShowApiKeyInput(false);
      } else if (msg.type === "api-key-saved") {
        // Handle API key saved successfully
        setSavingApiKey(false);
        setShowApiKeyInput(false);
        setNotification({
          message: "API key saved successfully",
          type: "success",
        });
      } else if (msg.type === "api-key-error") {
        // Handle API key error
        setSavingApiKey(false);
        setNotification({
          message: msg.message || "Error saving API key",
          type: "error",
        });
      }
    };
  }, []);

  // Handle updating metadata during editing
  const handleUpdateMetadata = (field: keyof DesignMetadata, value: any) => {
    setMetadata((prev: DesignMetadata) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle updating array values (keywords and objects)
  const handleUpdateArray = (field: "keywords" | "objects", value: string) => {
    const values = value.split(",").map((item) => item.trim());
    setMetadata((prev: DesignMetadata) => ({
      ...prev,
      [field]: values,
    }));
  };

  // Render API key input section
  const renderApiKeyInput = () => {
    return (
      <Paper
        sx={{
          p: 3,
          mb: 3,
          transition: "all 0.3s ease",
          display: showApiKeyInput ? "block" : "none",
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          display="flex"
          alignItems="center"
        >
          <KeyIcon sx={{ mr: 1 }} /> OpenAI API Key
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Enter your OpenAI API key to enable image analysis functionality. Your
          key will be stored securely in Figma's client storage.
        </Typography>
        <TextField
          label="OpenAI API Key"
          value={apiKey}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setApiKey(e.target.value)
          }
          fullWidth
          margin="normal"
          type="password"
          placeholder="sk-..."
          helperText="Your API key remains private and is stored locally in your Figma account."
        />
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setShowApiKeyInput(false)}
            disabled={savingApiKey}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={saveApiKey}
            disabled={!apiKey.trim() || savingApiKey}
            startIcon={
              savingApiKey ? <CircularProgress size={18} /> : <SaveIcon />
            }
          >
            {savingApiKey ? "Saving..." : "Save API Key"}
          </Button>
        </Stack>
      </Paper>
    );
  };

  // Render different content based on the selected tab
  const renderTabContent = () => {
    switch (selectedTab) {
      case 0: // Extracted Data
        return (
          <Stack spacing={3}>
            {imagePreview && (
              <Paper sx={{ p: 2, mb: 2, textAlign: "center" }}>
                <Typography variant="h6" gutterBottom>
                  Extracted Image
                </Typography>
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Selected design"
                  sx={{
                    maxWidth: "100%",
                    maxHeight: "200px",
                    objectFit: "contain",
                    borderRadius: 1,
                  }}
                />
              </Paper>
            )}

            <Typography variant="h6">
              Extracted Design Data
              <IconButton
                size="small"
                sx={{ ml: 1 }}
                onClick={() => setIsEditing(!isEditing)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Typography>

            {isEditing ? (
              <Stack spacing={2}>
                <TextField
                  label="Headline"
                  value={metadata.headline || ""}
                  onChange={(e) =>
                    handleUpdateMetadata("headline", e.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Body Text"
                  value={metadata.body_text || ""}
                  onChange={(e) =>
                    handleUpdateMetadata("body_text", e.target.value)
                  }
                  multiline
                  rows={4}
                  fullWidth
                />
                <TextField
                  label="Call to Action"
                  value={metadata.call_to_action || ""}
                  onChange={(e) =>
                    handleUpdateMetadata("call_to_action", e.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Keywords (comma separated)"
                  value={metadata.keywords.join(", ")}
                  onChange={(e) =>
                    handleUpdateArray("keywords", e.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Objects (comma separated)"
                  value={metadata.objects.join(", ")}
                  onChange={(e) => handleUpdateArray("objects", e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Background Color"
                  value={metadata.background_color}
                  onChange={(e) =>
                    handleUpdateMetadata("background_color", e.target.value)
                  }
                  fullWidth
                />
                <TextField
                  label="Aspect Ratio"
                  value={metadata.aspect_ratio}
                  onChange={(e) =>
                    handleUpdateMetadata("aspect_ratio", e.target.value)
                  }
                  fullWidth
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={() => setIsEditing(false)}
                >
                  Save Changes
                </Button>
              </Stack>
            ) : (
              <List>
                {Object.entries(metadata).map(([key, value]) => (
                  <ListItem key={key} divider>
                    <ListItemText
                      primary={key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                      secondary={
                        Array.isArray(value)
                          ? value.join(", ") || "None"
                          : value || "None"
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <Button
              variant="contained"
              color="secondary"
              startIcon={<AnalyticsIcon />}
              onClick={performOpenAIAnalysis}
              disabled={isAnalyzing}
              fullWidth
            >
              {isAnalyzing ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Analyze with OpenAI"
              )}
            </Button>
          </Stack>
        );

      case 1: // OpenAI Enhanced Results
        return (
          <Stack spacing={3}>
            {aiEnhancedMetadata ? (
              <>
                <Typography variant="h6" gutterBottom>
                  OpenAI Enhanced Results
                </Typography>

                <Paper sx={{ p: 3, position: "relative" }}>
                  <IconButton
                    sx={{ position: "absolute", top: 8, right: 8 }}
                    onClick={copyToClipboard}
                  >
                    <ContentCopyIcon />
                  </IconButton>

                  <Typography
                    component="pre"
                    sx={{
                      backgroundColor: "rgba(0, 0, 0, 0.03)",
                      p: 2,
                      borderRadius: 1,
                      overflow: "auto",
                      fontSize: "0.875rem",
                      maxHeight: "400px",
                    }}
                  >
                    {JSON.stringify(aiEnhancedMetadata, null, 2)}
                  </Typography>
                </Paper>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={saveResults}
                  fullWidth
                >
                  Save Results
                </Button>
              </>
            ) : (
              <Typography align="center" color="text.secondary">
                No OpenAI analysis results yet. Please run the analysis first.
              </Typography>
            )}
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          bgcolor: "background.default",
          minHeight: "100vh",
        }}
      >
        <Container maxWidth="sm" sx={{ py: 3 }}>
          <Stack spacing={3}>
            <Typography
              variant="h4"
              sx={{
                color: "primary.main",
                textAlign: "center",
                position: "relative",
              }}
            >
              Design Analyzer
            </Typography>

            {renderApiKeyInput()}

            <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
              <Tabs
                value={selectedTab}
                onChange={(_, newValue: number) => setSelectedTab(newValue)}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: "divider" }}
              >
                <Tab label="Extracted Data" />
                <Tab label="OpenAI Results" />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {isAnalyzing && selectedTab === 0 && !imagePreview ? (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <CircularProgress size={40} />
                    <Typography sx={{ mt: 2 }}>
                      Extracting design data...
                    </Typography>
                  </Box>
                ) : (
                  renderTabContent()
                )}
              </Box>
            </Paper>

            <Stack direction="row" spacing={2} justifyContent="space-between">
              <Button variant="outlined" color="error" onClick={onCancel}>
                Close
              </Button>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<KeyIcon />}
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                >
                  API Key
                </Button>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ImageIcon />}
                  onClick={startAnalysis}
                  disabled={isAnalyzing}
                >
                  Select New Frame
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Container>

        {notification && (
          <Snackbar
            open={!!notification}
            autoHideDuration={5000}
            onClose={() => setNotification(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <MuiAlert
              elevation={6}
              variant="filled"
              severity={notification.type}
              onClose={() => setNotification(null)}
            >
              {notification.message}
            </MuiAlert>
          </Snackbar>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;

// Show the UI with reasonable dimensions for our new analysis tool
figma.showUI(__html__, { themeColors: true, width: 500, height: 650 });

// Define our DesignMetadata interface to match expected output
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

// Initialize by loading the API key if available
(async function initializePlugin() {
  try {
    // Try to load the API key from client storage
    const apiKey = await figma.clientStorage.getAsync("openai-api-key");

    // Send the API key to the UI
    if (apiKey) {
      figma.ui.postMessage({
        type: "api-key-loaded",
        apiKey,
      });
    }
  } catch (error) {
    console.error("Error loading API key:", error);
  }
})();

// Helper function to extract text from a node
function extractTextFromNode(node: any): string {
  if (node.type === "TEXT") {
    return node.characters;
  }

  let text = "";
  if ("children" in node) {
    for (const child of node.children) {
      text += extractTextFromNode(child) + "\n";
    }
  }
  return text.trim();
}

// Helper function to determine aspect ratio
function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

// Helper to extract dominant color
function extractDominantColor(
  fills: readonly Paint[] | typeof figma.mixed,
): string {
  if (
    !fills ||
    fills === figma.mixed ||
    !Array.isArray(fills) ||
    fills.length === 0
  )
    return "transparent";

  const solidFills = fills.filter((fill) => fill.type === "SOLID");
  if (solidFills.length === 0) return "transparent";

  // Just use the first solid fill for simplicity
  const fill = solidFills[0];
  const r = Math.round(fill.color.r * 255);
  const g = Math.round(fill.color.g * 255);
  const b = Math.round(fill.color.b * 255);

  // Simple color naming logic
  if (r > 200 && g > 200 && b > 200) return "light";
  if (r < 50 && g < 50 && b < 50) return "dark";

  if (r > g && r > b) return r > 200 ? "light red" : "red";
  if (g > r && g > b) return g > 200 ? "light green" : "green";
  if (b > r && b > g) return b > 200 ? "light blue" : "blue";

  return `rgb(${r}, ${g}, ${b})`;
}

// Extract metadata from selection
async function extractMetadata(
  node: FrameNode | GroupNode,
): Promise<DesignMetadata> {
  // Initialize with default/empty values
  const metadata: DesignMetadata = {
    headline: null,
    subheadline: null,
    body_text: null,
    call_to_action: null,
    disclaimer: null,
    keywords: [],
    locale: "en", // Default to English
    aspect_ratio: "1:1", // Default
    background_color: "transparent",
    objects: [],
  };

  // Extract aspect ratio
  if ("width" in node && "height" in node) {
    metadata.aspect_ratio = calculateAspectRatio(node.width, node.height);
  }

  // Extract background color
  if ("fills" in node && node.fills) {
    metadata.background_color = extractDominantColor(node.fills);
  }

  // Extract text content (simplified approach)
  let allTexts: string[] = [];

  // Helper function to traverse nodes
  function traverse(node: any) {
    if (node.type === "TEXT") {
      allTexts.push(node.characters);
    }

    if ("children" in node) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(node);

  // Assign text to appropriate fields based on length and position
  // This is a simplified heuristic - in a real plugin you'd want more sophisticated logic
  allTexts.sort((a, b) => b.length - a.length);

  if (allTexts.length > 0) {
    // First text is likely headline
    metadata.headline = allTexts[0];
  }

  if (allTexts.length > 1) {
    // Next longest text is likely body
    metadata.body_text = allTexts[1];
  }

  if (allTexts.length > 2) {
    // Third text could be CTA
    metadata.call_to_action = allTexts[2];
  }

  return metadata;
}

// Export the frame as PNG bytes
async function exportFrameAsPng(node: FrameNode): Promise<Uint8Array> {
  const bytes = await node.exportAsync({
    format: "PNG",
    constraint: { type: "SCALE", value: 2 },
  });

  return bytes;
}

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === "analyze-selection") {
    // Check if something is selected
    if (figma.currentPage.selection.length === 0) {
      figma.notify("Please select a frame to analyze");
      figma.ui.postMessage({ type: "analysis-error", message: "No selection" });
      return;
    }

    // Get the selected node
    const selectedNode = figma.currentPage.selection[0];

    // Check if it's a frame or group
    if (selectedNode.type !== "FRAME" && selectedNode.type !== "GROUP") {
      figma.notify("Please select a frame or group to analyze");
      figma.ui.postMessage({
        type: "analysis-error",
        message: "Invalid selection type",
      });
      return;
    }

    try {
      // Show loading state
      figma.ui.postMessage({ type: "analysis-start" });

      // Extract metadata
      const metadata = await extractMetadata(
        selectedNode as FrameNode | GroupNode,
      );

      // Export the frame as PNG
      const pngData = await exportFrameAsPng(selectedNode as FrameNode);

      // Convert PNG to base64 for sending to UI
      const base64Image = figma.base64Encode(pngData);

      // Send metadata and image to UI for OpenAI processing
      figma.ui.postMessage({
        type: "metadata-extracted",
        metadata,
        image: base64Image,
      });
    } catch (error) {
      console.error("Error analyzing selection:", error);
      figma.ui.postMessage({
        type: "analysis-error",
        message: "Error analyzing selection",
      });
      figma.notify("Error analyzing selection");
    }
  } else if (msg.type === "save-results") {
    // Handle saving the results (in a real plugin, you might want to store this in figma.clientStorage)
    figma.notify("Analysis results saved!");

    // You could store the metadata on the node itself as plugin data
    if (figma.currentPage.selection.length > 0) {
      const node = figma.currentPage.selection[0];
      node.setPluginData("designAnalysis", JSON.stringify(msg.results));
    }
  } else if (msg.type === "save-api-key") {
    // Store the API key in client storage
    try {
      await figma.clientStorage.setAsync("openai-api-key", msg.apiKey);
      figma.notify("API key saved successfully");
      figma.ui.postMessage({ type: "api-key-saved" });
    } catch (error) {
      console.error("Error saving API key:", error);
      figma.notify("Error saving API key");
      figma.ui.postMessage({
        type: "api-key-error",
        message: "Failed to save API key",
      });
    }
  } else if (msg.type === "cancel") {
    figma.closePlugin();
  }
};

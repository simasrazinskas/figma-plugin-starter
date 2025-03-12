// Define the DesignMetadata interface shared between plugin and UI
export interface DesignMetadata {
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

// Define UI message types
export interface UIToPluginMessage {
  type: "analyze-selection" | "save-results" | "save-api-key" | "cancel";
  apiKey?: string;
  results?: DesignMetadata;
}

export interface PluginToUIMessage {
  type:
    | "api-key-loaded"
    | "api-key-saved"
    | "api-key-error"
    | "analysis-start"
    | "metadata-extracted"
    | "analysis-error";
  apiKey?: string;
  metadata?: DesignMetadata;
  image?: string;
  message?: string;
}

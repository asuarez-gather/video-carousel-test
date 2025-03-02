import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Constants
const MIN_VIDEO_WIDTH = 160;
const MIN_VIDEO_HEIGHT = 90;
const ASPECT_RATIO = 16 / 9;
const MAX_VIDEOS = 9; // 3x3 grid maximum

// Define interfaces for component props and state
interface ControlPanelProps {
  numParticipants: number;
  setNumParticipants: (value: number) => void;
  containerSize: {
    width: number;
    height: number;
  };
  videoDimensions: {
    width: number;
    height: number;
  };
  gridInfo: {
    rows: number;
    cols: number;
  };
}

interface VideoGridProps {
  numParticipants: number;
  containerWidth: number;
  containerHeight: number;
  gap?: number;
  onResize: (width: number, height: number) => void;
  onLayoutChange: (layout: {
    containerSize: { width: number; height: number };
    videoDimensions: { width: number; height: number };
    gridInfo: { rows: number; cols: number };
  }) => void;
  videoDimensions: { width: number; height: number };
}

function App() {
  const [numParticipants, setNumParticipants] = useState<number>(5);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [containerHeight, setContainerHeight] = useState<number>(600);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });
  const [videoDimensions, setVideoDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });
  const [gridInfo, setGridInfo] = useState<{
    rows: number;
    cols: number;
  }>({
    rows: 0,
    cols: 0,
  });

  // Simulate window resize for demonstration purposes
  const toggleWindowShape = () => {
    if (containerWidth > containerHeight) {
      // Switch to vertical layout
      setContainerWidth(400);
      setContainerHeight(800);
    } else {
      // Switch to horizontal layout
      setContainerWidth(800);
      setContainerHeight(400);
    }
  };

  return (
    <div className="app-container">
      <ControlPanel
        numParticipants={numParticipants}
        setNumParticipants={setNumParticipants}
        containerSize={containerSize}
        videoDimensions={videoDimensions}
        gridInfo={gridInfo}
      />

      <div className="demo-controls" style={{ marginBottom: "10px" }}>
        <button onClick={toggleWindowShape}>
          Toggle Window Shape (Currently:{" "}
          {containerWidth > containerHeight ? "Landscape" : "Portrait"})
        </button>
      </div>

      <ResizableVideoGrid
        numParticipants={numParticipants}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
        onResize={(newWidth: number, newHeight: number) => {
          setContainerWidth(newWidth);
          setContainerHeight(newHeight);
        }}
        onLayoutChange={(layout) => {
          setContainerSize(layout.containerSize);
          setVideoDimensions(layout.videoDimensions);
          setGridInfo(layout.gridInfo);
        }}
        videoDimensions={videoDimensions}
      />
    </div>
  );
}

// Separate control panel component
const ControlPanel: React.FC<ControlPanelProps> = ({
  numParticipants,
  setNumParticipants,
  containerSize,
  videoDimensions,
  gridInfo,
}) => {
  return (
    <div className="control-panel">
      <h3>Video Grid Controls</h3>

      <div className="control-row">
        <label htmlFor="participants">Participants:</label>
        <input
          id="participants"
          type="number"
          min="1"
          max={MAX_VIDEOS}
          value={numParticipants}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNumParticipants(
              Math.min(MAX_VIDEOS, parseInt(e.target.value) || 1),
            )
          }
        />
        <span>{numParticipants}</span>
      </div>

      <div className="control-section">
        <h4>Grid Layout</h4>
        <div className="control-row">
          <label>Grid:</label>
          <span>
            {gridInfo.rows} × {gridInfo.cols}
          </span>
        </div>
      </div>

      <div className="control-section">
        <h4>Container Dimensions</h4>
        <div className="control-row">
          <label>Width:</label>
          <span>{Math.round(containerSize.width)}px</span>
        </div>
        <div className="control-row">
          <label>Height:</label>
          <span>{Math.round(containerSize.height)}px</span>
        </div>
      </div>

      <div className="control-section">
        <h4>Video Dimensions</h4>
        <div className="control-row">
          <label>Video width:</label>
          <span>{Math.round(videoDimensions.width)}px</span>
        </div>
        <div className="control-row">
          <label>Video height:</label>
          <span>{Math.round(videoDimensions.height)}px</span>
        </div>
        <div className="control-row">
          <label>Aspect ratio:</label>
          <span>
            {videoDimensions.width > 0
              ? (videoDimensions.width / videoDimensions.height).toFixed(2)
              : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
};

const ResizableVideoGrid: React.FC<VideoGridProps> = ({
  numParticipants,
  containerWidth = 800,
  containerHeight = 600,
  gap = 8,
  onResize,
  onLayoutChange,
  videoDimensions,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [startSize, setStartSize] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 },
  );

  // Calculate the optimal grid layout based on container dimensions and participant count
  const calculateOptimalGridLayout = (
    participants: number,
    containerWidth: number,
    containerHeight: number,
    gap: number,
  ) => {
    if (participants <= 0) return { rows: 0, cols: 0 };
    if (participants === 1) return { rows: 1, cols: 1 };

    // Maximum 9 videos (3x3)
    const maxVideos = Math.min(participants, MAX_VIDEOS);

    // Try all possible grid configurations and find the one that gives the largest video size
    let bestLayout = { rows: 1, cols: maxVideos };
    let bestVideoSize = 0;

    // Test different row/column combinations
    for (let rows = 1; rows <= maxVideos; rows++) {
      // Calculate needed columns (ceiling to ensure all participants fit)
      const cols = Math.ceil(maxVideos / rows);

      // Skip if we need more than MAX_VIDEOS
      if (rows * cols > MAX_VIDEOS) continue;

      // Calculate available space accounting for gaps
      const availableWidth = containerWidth - (cols - 1) * gap;
      const availableHeight = containerHeight - (rows - 1) * gap;

      // Calculate potential video dimensions
      let videoWidth = availableWidth / cols;
      let videoHeight = videoWidth / ASPECT_RATIO;

      // If too tall, constrain by height
      if (videoHeight * rows > availableHeight) {
        videoHeight = availableHeight / rows;
        videoWidth = videoHeight * ASPECT_RATIO;
      }

      // Calculate the video area
      const videoSize = videoWidth * videoHeight;

      // Update best layout if this one is better
      if (videoSize > bestVideoSize) {
        bestVideoSize = videoSize;
        bestLayout = { rows, cols };
      }
    }

    return bestLayout;
  };

  // Calculate video dimensions based on container size and optimize grid layout
  useEffect(() => {
    if (numParticipants <= 0) {
      onLayoutChange({
        containerSize: { width: containerWidth, height: containerHeight },
        videoDimensions: { width: 0, height: 0 },
        gridInfo: { rows: 0, cols: 0 },
      });
      return;
    }

    // Calculate the optimal grid layout based on container dimensions
    const gridLayout = calculateOptimalGridLayout(
      numParticipants,
      containerWidth - 2 * 8, // Account for padding
      containerHeight - 2 * 8, // Account for padding
      gap,
    );

    const { rows, cols } = gridLayout;

    // Calculate available space for videos
    const totalGapWidth = gap * (cols - 1);
    const totalGapHeight = gap * (rows - 1);

    const availableWidth = containerWidth - totalGapWidth - 2 * 8; // Account for padding
    const availableHeight = containerHeight - totalGapHeight - 2 * 8; // Account for padding

    // Calculate video dimensions while strictly maintaining aspect ratio
    let videoWidth = availableWidth / cols;
    let videoHeight = videoWidth / ASPECT_RATIO;

    // If videos are too tall, constrain by height
    if (videoHeight * rows > availableHeight) {
      videoHeight = availableHeight / rows;
      videoWidth = videoHeight * ASPECT_RATIO;
    }

    // Ensure minimum dimensions
    videoWidth = Math.max(MIN_VIDEO_WIDTH, videoWidth);
    videoHeight = Math.max(MIN_VIDEO_HEIGHT, videoHeight);

    // Update layout
    onLayoutChange({
      containerSize: {
        width: containerWidth,
        height: containerHeight,
      },
      videoDimensions: {
        width: videoWidth,
        height: videoHeight,
      },
      gridInfo: gridLayout,
    });
  }, [numParticipants, containerWidth, containerHeight, gap, onLayoutChange]);

  // Handle mouse down on resize handle
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    // Start resizing
    setIsResizing(true);

    // Store initial mouse position
    setStartPos({
      x: e.clientX,
      y: e.clientY,
    });

    // Store initial dimensions
    setStartSize({
      width: containerWidth,
      height: containerHeight,
    });

    // Add event listeners for mouse movement and mouse up
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Set cursor and prevent text selection
    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";
  };

  // Handle mouse movement while resizing
  const handleMouseMove = (e: MouseEvent) => {
    // Calculate the delta movement from the start position
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    // Calculate new dimensions
    const newWidth = Math.max(MIN_VIDEO_WIDTH, startSize.width + deltaX);
    const newHeight = Math.max(MIN_VIDEO_HEIGHT, startSize.height + deltaY);

    // Update the dimensions
    onResize(newWidth, newHeight);
  };

  // Handle mouse up to end resizing
  const handleMouseUp = () => {
    // Stop resizing
    setIsResizing(false);

    // Remove event listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    // Reset cursor and text selection
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  // Update references to the grid layout function
  const gridInfo: { cols: number; rows: number } = calculateOptimalGridLayout(
    numParticipants,
    containerWidth - 2 * 8, // Account for padding
    containerHeight - 2 * 8, // Account for padding
    gap,
  );

  return (
    <div className="video-grid-container" ref={gridRef}>
      <div
        className={`video-grid ${isResizing ? "resizing" : ""}`}
        style={{
          width: `${containerWidth}px`,
          height: `${containerHeight}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          transition: isResizing ? "none" : "width 0.3s ease, height 0.3s ease",
          position: "relative",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "8px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Grid wrapper with fixed aspect ratio videos */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridInfo.cols}, ${Math.round(videoDimensions.width)}px)`,
            gridTemplateRows: `repeat(${gridInfo.rows}, ${Math.round(videoDimensions.height)}px)`,
            gap: `${gap}px`,
          }}
        >
          {/* Video tiles */}
          {Array.from({ length: numParticipants }).map((_, index) => (
            <div
              key={index}
              className="video-tile"
              style={{
                backgroundColor: "#000",
                borderRadius: "8px",
                position: "relative",
                overflow: "hidden",
                width: `${Math.round(videoDimensions.width)}px`,
                height: `${Math.round(videoDimensions.height)}px`,
              }}
            >
              {/* Participant label */}
              <div
                style={{
                  position: "absolute",
                  bottom: 4,
                  right: 4,
                  color: "white",
                  fontSize: "12px",
                  padding: "2px 6px",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  borderRadius: "4px",
                }}
              >
                P{index + 1}
              </div>

              {/* Size indicator (for debugging) */}
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  left: 4,
                  color: "white",
                  fontSize: "10px",
                  padding: "1px 4px",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  borderRadius: "4px",
                }}
              >
                {Math.round(videoDimensions.width)}×
                {Math.round(videoDimensions.height)}
              </div>
            </div>
          ))}
        </div>

        {/* Resize handle */}
        <div
          className="resize-handle resize-corner"
          onMouseDown={handleMouseDown}
          title="Drag to resize grid"
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 16,
            height: 16,
            cursor: "nwse-resize",
            background: "transparent",
            zIndex: 10,
          }}
        />
      </div>
    </div>
  );
};

export default App;

import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Constants
const MIN_VIDEO_WIDTH = 160;
const MIN_VIDEO_HEIGHT = 90;

// Define interfaces for component props and state
interface ControlPanelProps {
  numParticipants: number;
  setNumParticipants: (value: number) => void;
  maxWidth: number;
  setMaxWidth: (value: number) => void;
  maxHeight: number;
  setMaxHeight: (value: number) => void;
}

interface VideoDimensions {
  videoWidth: number;
  videoHeight: number;
  windowWidth: number;
  windowHeight: number;
  videosToShow: number;
}

interface ResizableVideoGridProps {
  numParticipants: number;
  maxWidth: number;
  maxHeight: number;
  gap?: number;
  onResize: (width: number, height: number) => void;
}

function App() {
  const [numParticipants, setNumParticipants] = useState<number>(8);
  const [maxWidth, setMaxWidth] = useState<number>(1200);
  const [maxHeight, setMaxHeight] = useState<number>(300);

  return (
    <div className="app-container">
      <ControlPanel
        numParticipants={numParticipants}
        setNumParticipants={setNumParticipants}
        maxWidth={maxWidth}
        setMaxWidth={setMaxWidth}
        maxHeight={maxHeight}
        setMaxHeight={setMaxHeight}
      />

      <BrowserResizableVideoGrid
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        numParticipants={numParticipants}
        onResize={(newWidth: number, newHeight: number) => {
          console.log("newWidth", newWidth);
          setMaxWidth(newWidth);
          setMaxHeight(newHeight);
        }}
      />
    </div>
  );
}

// Separate control panel component
const ControlPanel: React.FC<ControlPanelProps> = ({
  numParticipants,
  setNumParticipants,
  maxWidth,
  setMaxWidth,
  maxHeight,
  setMaxHeight,
}) => {
  return (
    <div className="control-panel">
      <h3>Video Grid Controls</h3>

      <div className="control-row">
        <label htmlFor="participants">Participants:</label>
        <input
          id="participants"
          type="number"
          min="0"
          max="20"
          value={numParticipants}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNumParticipants(parseInt(e.target.value) || 0)
          }
        />
        <span>{numParticipants}</span>
      </div>
    </div>
  );
};

const BrowserResizableVideoGrid: React.FC<ResizableVideoGridProps> = ({
  numParticipants = 8,
  maxWidth = 1200,
  maxHeight = 300,
  gap = 8,
  onResize,
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
  const [dimensions, setDimensions] = useState<VideoDimensions>({
    videoWidth: 0,
    videoHeight: 0,
    windowWidth: 0,
    windowHeight: 0,
    videosToShow: 0,
  });

  // Calculate video dimensions when inputs change
  useEffect(() => {
    // Calculate how many videos can fit
    const maxVideosToShow = Math.floor(
      (maxWidth + gap) / (MIN_VIDEO_WIDTH + gap),
    );
    const videosToShow = Math.min(numParticipants, maxVideosToShow, 8);

    if (videosToShow === 0) {
      setDimensions({
        videoWidth: 0,
        videoHeight: 0,
        windowWidth: 0,
        windowHeight: 0,
        videosToShow: 0,
      });
      return;
    }

    // Calculate dimensions
    const availableWidth = maxWidth - gap * (videosToShow - 1);
    const videoWidth = Math.max(MIN_VIDEO_WIDTH, availableWidth / videosToShow);
    const heightFromWidth = videoWidth * (9 / 16);
    const videoHeight = Math.min(heightFromWidth, maxHeight);
    const finalVideoWidth = videoHeight * (16 / 9);

    // Calculate window dimensions
    const windowWidth =
      finalVideoWidth * videosToShow + gap * (videosToShow - 1);

    setDimensions({
      videoWidth: finalVideoWidth,
      videoHeight,
      windowWidth,
      windowHeight: videoHeight,
      videosToShow,
    });
  }, [maxWidth, maxHeight, gap, numParticipants]);

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
      width: maxWidth,
      height: maxHeight,
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
    console.log("handleMouseMove");

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

    console.log("handleMouseUp");

    // Remove event listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    // Reset cursor and text selection
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  return (
    <div className="video-grid-container" ref={gridRef}>
      <div
        className={`video-grid ${isResizing ? "resizing" : ""}`}
        style={{
          width: dimensions.windowWidth,
          height: dimensions.windowHeight,
          display: "flex",
          gap: `${gap}px`,
          transition: isResizing ? "none" : "width 0.3s ease, height 0.3s ease",
          position: "relative",
        }}
      >
        {/* Video tiles */}
        {Array.from({ length: dimensions.videosToShow }).map((_, index) => (
          <div
            key={index}
            className="video-tile"
            style={{
              width: dimensions.videoWidth,
              height: dimensions.videoHeight,
              backgroundColor: "#000",
              borderRadius: "8px",
            }}
          />
        ))}

        {/* Single resize handle in the corner, like a browser window */}
        <div
          className="resize-handle resize-corner"
          onMouseDown={handleMouseDown}
          title="Drag to resize window"
        />
      </div>
    </div>
  );
};

export default App;

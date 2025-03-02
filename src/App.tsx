import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Constants
const MIN_VIDEO_WIDTH = 160;
const MIN_VIDEO_HEIGHT = 90;

// Define interfaces for component props and state
interface ControlPanelProps {
  numParticipants: number;
  setNumParticipants: (value: number) => void;
  maxVideosDisplayed: number;
  windowDimensions: {
    width: number;
    height: number;
  };
  videoDimensions: {
    width: number;
    height: number;
  };
}

interface VideoDimensions {
  videoWidth: number;
  videoHeight: number;
  windowWidth: number;
  windowHeight: number;
}

interface ResizableVideoGridProps {
  numParticipants: number;
  maxWidth: number;
  maxHeight: number;
  gap?: number;
  videosToShow: number;
  onResize: (width: number, height: number) => void;
  onDimensionsChange: (dimensions: VideoDimensions) => void;
}

function App() {
  const [numParticipants, setNumParticipants] = useState<number>(8);
  const [maxWidth, setMaxWidth] = useState<number>(1200);
  const [maxHeight, setMaxHeight] = useState<number>(300);
  const [videosToShow, setVideosToShow] = useState<number>(0);
  const [windowDimensions, setWindowDimensions] = useState<{
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
  const gap = 8;

  // Calculate videosToShow based on available space and participants
  useEffect(() => {
    // Calculate how many videos can fit
    const maxVideosToShow = Math.floor(
      (maxWidth + gap) / (MIN_VIDEO_WIDTH + gap),
    );
    // Limit to the number of participants and a maximum of 8
    const calculatedVideosToShow = Math.min(
      numParticipants,
      maxVideosToShow,
      8,
    );

    setVideosToShow(calculatedVideosToShow);
  }, [maxWidth, gap, numParticipants]);

  return (
    <div className="app-container">
      <ControlPanel
        numParticipants={numParticipants}
        setNumParticipants={setNumParticipants}
        maxVideosDisplayed={videosToShow}
        windowDimensions={windowDimensions}
        videoDimensions={videoDimensions}
      />

      <BrowserResizableVideoGrid
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        numParticipants={numParticipants}
        videosToShow={videosToShow}
        onResize={(newWidth: number, newHeight: number) => {
          console.log("newWidth", newWidth);
          setMaxWidth(newWidth);
          setMaxHeight(newHeight);
        }}
        onDimensionsChange={(dimensions) => {
          setWindowDimensions({
            width: dimensions.windowWidth,
            height: dimensions.windowHeight,
          });
          setVideoDimensions({
            width: dimensions.videoWidth,
            height: dimensions.videoHeight,
          });
        }}
      />
    </div>
  );
}

// Separate control panel component
const ControlPanel: React.FC<ControlPanelProps> = ({
  numParticipants,
  setNumParticipants,
  maxVideosDisplayed,
  windowDimensions,
  videoDimensions,
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

      <div className="control-row">
        <label>Maximum videos displayed:</label>
        <span>{maxVideosDisplayed}</span>
      </div>

      <div className="control-section">
        <h4>Grid Dimensions</h4>
        <div className="control-row">
          <label>Window width:</label>
          <span>{Math.round(windowDimensions.width)}px</span>
        </div>
        <div className="control-row">
          <label>Window height:</label>
          <span>{Math.round(windowDimensions.height)}px</span>
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

const BrowserResizableVideoGrid: React.FC<ResizableVideoGridProps> = ({
  maxWidth = 1200,
  maxHeight = 300,
  gap = 8,
  videosToShow,
  onResize,
  onDimensionsChange,
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
  });

  // Calculate video dimensions when inputs change
  useEffect(() => {
    if (videosToShow === 0) {
      const newDimensions = {
        videoWidth: 0,
        videoHeight: 0,
        windowWidth: 0,
        windowHeight: 0,
      };
      setDimensions(newDimensions);
      onDimensionsChange(newDimensions);
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

    const newDimensions = {
      videoWidth: finalVideoWidth,
      videoHeight,
      windowWidth,
      windowHeight: videoHeight,
    };

    setDimensions(newDimensions);
    onDimensionsChange(newDimensions);
  }, [maxWidth, maxHeight, gap, videosToShow, onDimensionsChange]);

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
        {Array.from({ length: videosToShow }).map((_, index) => (
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

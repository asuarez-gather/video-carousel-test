import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

// Constants
const MIN_VIDEO_WIDTH = 160;
const MIN_VIDEO_HEIGHT = 90;
const GAP = 8;
const MAX_VIDEOS = 8;
const ASPECT_RATIO = 16 / 9;

// Types
interface Dimensions {
  width: number;
  height: number;
}

interface GridDimensions {
  videoWidth: number;
  videoHeight: number;
  windowWidth: number;
  windowHeight: number;
}

interface ControlPanelProps {
  numParticipants: number;
  setNumParticipants: (value: number) => void;
  videosToShow: number;
  windowDimensions: Dimensions;
  videoDimensions: Dimensions;
  lastSavedMaxWidth: number;
}

interface VideoGridProps {
  maxWidth: number;
  maxHeight: number;
  videosToShow: number;
  onResize: (width: number, height: number) => void;
  onDimensionsChange: (dimensions: GridDimensions) => void;
}

function App() {
  const initialMaxWidth = 1200;
  const [numParticipants, setNumParticipants] = useState(8);
  const [maxWidth, setMaxWidth] = useState(initialMaxWidth);
  const [maxHeight, setMaxHeight] = useState(300);
  const [lastSavedMaxWidth, setLastSavedMaxWidth] = useState(initialMaxWidth);
  const [videosToShow, setVideosToShow] = useState(0);
  const [windowDimensions, setWindowDimensions] = useState<Dimensions>({
    width: maxWidth,
    height: maxHeight,
  });
  const [videoDimensions, setVideoDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
  });
  const [prevNumParticipants, setPrevNumParticipants] =
    useState(numParticipants);

  // Calculate videosToShow based on available space and participants
  useEffect(() => {
    const maxVideosDisplayed = Math.floor(
      (maxWidth + GAP) / (MIN_VIDEO_WIDTH + GAP),
    );
    const newVideosToShow = Math.min(
      numParticipants,
      maxVideosDisplayed,
      MAX_VIDEOS,
    );
    setVideosToShow(newVideosToShow);

    setWindowDimensions({
      width: maxWidth,
      height: maxHeight,
    });
  }, [maxWidth, maxHeight, numParticipants]);

  // Auto-adjust window size when number of participants changes
  useEffect(() => {
    // Check if participants decreased
    if (numParticipants < prevNumParticipants && numParticipants > 0) {
      // Calculate optimal width for the current number of videos
      const optimalVideoWidth = 320; // Desired video width
      const optimalWindowWidth =
        numParticipants * optimalVideoWidth + (numParticipants - 1) * GAP;

      // Shrink the window
      if (optimalWindowWidth < maxWidth) {
        setMaxWidth(optimalWindowWidth);
      }
    }
    // Check if participants increased
    else if (numParticipants > prevNumParticipants) {
      // Calculate optimal width for the current number of participants
      const optimalVideoWidth = 320; // Desired video width
      const optimalWindowWidth =
        numParticipants * optimalVideoWidth + (numParticipants - 1) * GAP;

      // Expand window but don't exceed lastSavedMaxWidth
      const newWidth = Math.min(optimalWindowWidth, lastSavedMaxWidth);
      setMaxWidth(newWidth);
    }

    setPrevNumParticipants(numParticipants);
  }, [numParticipants, prevNumParticipants, maxWidth, lastSavedMaxWidth]);

  const handleDimensionsChange = useCallback((dimensions: GridDimensions) => {
    setWindowDimensions({
      width: dimensions.windowWidth,
      height: dimensions.windowHeight,
    });
    setVideoDimensions({
      width: dimensions.videoWidth,
      height: dimensions.videoHeight,
    });
  }, []);

  const handleResize = useCallback(
    (width: number, height: number) => {
      setMaxWidth(width);
      setMaxHeight(height);
      setLastSavedMaxWidth(width);
    },
    [lastSavedMaxWidth],
  );

  return (
    <div className="app-container">
      <ControlPanel
        numParticipants={numParticipants}
        setNumParticipants={setNumParticipants}
        videosToShow={videosToShow}
        windowDimensions={windowDimensions}
        videoDimensions={videoDimensions}
        lastSavedMaxWidth={lastSavedMaxWidth}
      />

      <ResizableVideoGrid
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        videosToShow={videosToShow}
        onResize={handleResize}
        onDimensionsChange={handleDimensionsChange}
      />
    </div>
  );
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  numParticipants,
  setNumParticipants,
  videosToShow,
  windowDimensions,
  videoDimensions,
  lastSavedMaxWidth,
}) => {
  const aspectRatio =
    videoDimensions.width > 0
      ? (videoDimensions.width / videoDimensions.height).toFixed(2)
      : "N/A";

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
          onChange={(e) => setNumParticipants(parseInt(e.target.value) || 0)}
        />
        <span>{numParticipants}</span>
      </div>

      <div className="control-row">
        <label>Maximum videos displayed:</label>
        <span>{videosToShow}</span>
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
        <div className="control-row">
          <label>Last saved max width:</label>
          <span>{Math.round(lastSavedMaxWidth)}px</span>
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
          <span>{aspectRatio}</span>
        </div>
      </div>
    </div>
  );
};

const ResizableVideoGrid: React.FC<VideoGridProps> = ({
  maxWidth,
  maxHeight,
  videosToShow,
  onResize,
  onDimensionsChange,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState<GridDimensions>({
    videoWidth: 0,
    videoHeight: 0,
    windowWidth: 0,
    windowHeight: 0,
  });

  // Calculate dimensions when inputs change - with fixed container size
  useEffect(() => {
    if (videosToShow === 0) {
      const emptyDimensions = {
        videoWidth: 0,
        videoHeight: 0,
        windowWidth: maxWidth,
        windowHeight: maxHeight,
      };
      setDimensions(emptyDimensions);
      onDimensionsChange(emptyDimensions);
      return;
    }

    // Keep container size fixed at maxWidth and maxHeight
    const windowWidth = maxWidth;
    const windowHeight = maxHeight;

    // Calculate available space for videos
    const availableWidth = windowWidth - GAP * (videosToShow - 1);
    // Calculate ideal video width based on available space
    const videoWidth = availableWidth / videosToShow;

    // Calculate video height maintaining aspect ratio
    const videoHeight = videoWidth / ASPECT_RATIO;

    // Adjust video height to fit the window height
    const adjustedVideoHeight = Math.min(videoHeight, windowHeight);
    const adjustedVideoWidth = adjustedVideoHeight * ASPECT_RATIO;

    const newDimensions = {
      videoWidth: adjustedVideoWidth,
      videoHeight: adjustedVideoHeight,
      windowWidth,
      windowHeight,
    };

    setDimensions(newDimensions);
    onDimensionsChange(newDimensions);
  }, [maxWidth, maxHeight, videosToShow, onDimensionsChange]);

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      // Initialize resizing state
      setIsResizing(true);
      const startPos = { x: e.clientX, y: e.clientY };
      const startSize = { width: maxWidth, height: maxHeight };

      // Mouse move handler for resizing
      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startPos.x;
        const deltaY = e.clientY - startPos.y;

        const newWidth = Math.max(MIN_VIDEO_WIDTH, startSize.width + deltaX);
        const newHeight = Math.max(MIN_VIDEO_HEIGHT, startSize.height + deltaY);

        onResize(newWidth, newHeight);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [maxWidth, maxHeight, onResize],
  );

  return (
    <div className="video-grid-container">
      <div
        className={`video-grid ${isResizing ? "resizing" : ""}`}
        style={{
          width: maxWidth,
          height: maxHeight,
          display: "flex",
          gap: `${GAP}px`,
          transition: isResizing ? "none" : "width 0.3s ease, height 0.3s ease",
          position: "relative",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
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

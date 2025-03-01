import { useState, useEffect } from "react";
import "./App.css";

// Constants
const MIN_VIDEO_WIDTH = 160;
const MIN_VIDEO_HEIGHT = 90;

function App() {
  const [numParticipants, setNumParticipants] = useState(8);
  const [maxWidth, setMaxWidth] = useState(1200);
  const [maxHeight, setMaxHeight] = useState(300);

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

      <ResponsiveVideoGrid
        maxWidth={maxWidth}
        maxHeight={maxHeight}
        numParticipants={numParticipants}
      />
    </div>
  );
}

// Separate control panel component
const ControlPanel = ({
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
          onChange={(e) => setNumParticipants(parseInt(e.target.value) || 0)}
        />
        <span>{numParticipants}</span>
      </div>

      <div className="control-row">
        <label htmlFor="width">Max Width:</label>
        <input
          id="width"
          type="range"
          min={MIN_VIDEO_WIDTH}
          max="2000"
          value={maxWidth}
          onChange={(e) => setMaxWidth(parseInt(e.target.value))}
        />
        <span>{maxWidth}px</span>
      </div>

      <div className="control-row">
        <label htmlFor="height">Max Height:</label>
        <input
          id="height"
          type="range"
          min={MIN_VIDEO_HEIGHT}
          max="500"
          value={maxHeight}
          onChange={(e) => setMaxHeight(parseInt(e.target.value))}
        />
        <span>{maxHeight}px</span>
      </div>
    </div>
  );
};

const ResponsiveVideoGrid = ({
  numParticipants = 8,
  maxWidth = 1200,
  maxHeight = 300,
  gap = 8,
}) => {
  const [dimensions, setDimensions] = useState({
    videoWidth: 0,
    videoHeight: 0,
    windowWidth: 0,
    windowHeight: 0,
    videosToShow: 0,
  });

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

  return (
    <div className="video-grid-container">
      <div
        className="video-grid"
        style={{
          width: dimensions.windowWidth,
          height: dimensions.windowHeight,
          display: "flex",
          gap: `${gap}px`,
          transition: "width 0.3s ease, height 0.3s ease",
        }}
      >
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
      </div>
    </div>
  );
};

export default App;

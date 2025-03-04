import React, { useState, useRef, useMemo, MouseEventHandler } from "react";
import "./App.css";

// Constants
const MIN_VIDEO_WIDTH = 160;
const MIN_VIDEO_HEIGHT = 90;
const ASPECT_RATIO = 16 / 9;
const MAX_VIDEOS_PER_PAGE = 25;

// Simplified interfaces
interface GridInfo {
  rows: number;
  cols: number;
  visibleParticipants: number;
  totalParticipants: number;
  currentPage: number;
  totalPages: number;
}

interface VideoDimensions {
  width: number;
  height: number;
}

function App() {
  // State management
  const [numParticipants, setNumParticipants] = useState(9);
  const [containerWidth, setContainerWidth] = useState(800);
  const [containerHeight, setContainerHeight] = useState(600);
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="app-container">
      <VideoGridWithControls
        participants={numParticipants}
        setParticipants={setNumParticipants}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
        initialPage={currentPage}
        onPageChange={setCurrentPage}
        onResize={(width, height) => {
          setContainerWidth(width);
          setContainerHeight(height);
        }}
      />
    </div>
  );
}

// Combined component to avoid state syncing issues
const VideoGridWithControls = ({
  participants,
  setParticipants,
  containerWidth,
  containerHeight,
  initialPage,
  onPageChange,
  onResize,
}: {
  participants: number;
  setParticipants: (participants: number) => void;
  containerWidth: number;
  containerHeight: number;
  initialPage: number;
  onPageChange: (page: number) => void;
  onResize: (width: number, height: number) => void;
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [currentPage, setCurrentPage] = useState(initialPage);
  const gap = 8;

  // Calculate the optimal grid layout
  const calculateGrid = (
    participants: number,
    containerWidth: number,
    containerHeight: number,
    gap: number,
  ) => {
    if (participants <= 0) {
      return { rows: 0, cols: 0, videoWidth: 0, videoHeight: 0 };
    }

    // Adjust for padding
    const effectiveWidth = containerWidth - 16;
    const effectiveHeight = containerHeight - 16;

    // Single participant case
    if (participants === 1) {
      let videoWidth = effectiveWidth;
      let videoHeight = videoWidth / ASPECT_RATIO;

      if (videoHeight > effectiveHeight) {
        videoHeight = effectiveHeight;
        videoWidth = videoHeight * ASPECT_RATIO;
      }

      return { rows: 1, cols: 1, videoWidth, videoHeight };
    }

    // Find best layout
    let maxArea = 0;
    let bestLayout = {
      rows: 1,
      cols: 1,
      videoWidth: MIN_VIDEO_WIDTH,
      videoHeight: MIN_VIDEO_HEIGHT,
    };

    // Try different row configurations
    for (let rows = 1; rows <= participants; rows++) {
      const cols = Math.ceil(participants / rows);

      const availableWidth = effectiveWidth - (cols - 1) * gap;
      const availableHeight = effectiveHeight - (rows - 1) * gap;

      let videoWidth = availableWidth / cols;
      let videoHeight = availableHeight / rows;

      // Maintain aspect ratio
      if (videoWidth / videoHeight > ASPECT_RATIO) {
        videoWidth = videoHeight * ASPECT_RATIO;
      } else {
        videoHeight = videoWidth / ASPECT_RATIO;
      }

      // Check if size meets minimum requirements
      if (videoWidth >= MIN_VIDEO_WIDTH && videoHeight >= MIN_VIDEO_HEIGHT) {
        const area = videoWidth * videoHeight;
        if (area > maxArea) {
          maxArea = area;
          bestLayout = { rows, cols, videoWidth, videoHeight };
        }
      }
    }

    return bestLayout;
  };

  // Calculate layout for current page
  const layout = useMemo(() => {
    const participantsPerPage = Math.min(participants, MAX_VIDEOS_PER_PAGE);
    const totalPages = Math.ceil(participants / MAX_VIDEOS_PER_PAGE);

    // Ensure current page is valid
    const validPage = Math.min(
      Math.max(1, currentPage),
      Math.max(1, totalPages),
    );
    if (validPage !== currentPage) {
      setCurrentPage(validPage);
      onPageChange(validPage);
    }

    // Calculate participants on current page
    const startIndex = (validPage - 1) * MAX_VIDEOS_PER_PAGE;
    const participantsOnPage = Math.min(
      participantsPerPage,
      participants - startIndex,
    );

    // Get grid dimensions
    const { rows, cols, videoWidth, videoHeight } = calculateGrid(
      participantsOnPage,
      containerWidth,
      containerHeight,
      gap,
    );

    return {
      rows,
      cols,
      videoWidth,
      videoHeight,
      visibleParticipants: participantsOnPage,
      totalParticipants: participants,
      currentPage: validPage,
      totalPages,
      startIndex,
    };
  }, [
    participants,
    containerWidth,
    containerHeight,
    currentPage,
    onPageChange,
  ]);

  // Handle page changes
  const handlePageChange = (page: number) => {
    const newPage = Math.min(Math.max(1, page), layout.totalPages);
    setCurrentPage(newPage);
    onPageChange(newPage);
  };

  // Resize handlers
  const handleMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsResizing(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ width: containerWidth, height: containerHeight });

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "nwse-resize";
  };

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    const newWidth = Math.max(MIN_VIDEO_WIDTH + 16, startSize.width + deltaX);
    const newHeight = Math.max(
      MIN_VIDEO_HEIGHT + 16,
      startSize.height + deltaY,
    );

    onResize(newWidth, newHeight);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
  };

  return (
    <div className="video-grid-with-controls">
      {/* Control Panel */}
      <div className="control-panel">
        <h3>Video Grid Controls</h3>

        <div className="control-row">
          <label htmlFor="participants">Participants:</label>
          <input
            id="participants"
            type="number"
            min="1"
            max="100"
            value={participants}
            onChange={(e) =>
              setParticipants(Math.max(1, parseInt(e.target.value) || 1))
            }
          />
        </div>

        <div className="control-section">
          <h4>Grid Layout</h4>
          <div>
            Grid: {layout.rows} × {layout.cols}
          </div>
          <div>
            Visible/Total: {layout.visibleParticipants} /{" "}
            {layout.totalParticipants}
          </div>

          {layout.totalPages > 1 && (
            <div className="pagination-controls">
              <span>
                Page: {layout.currentPage} / {layout.totalPages}
              </span>
              <button
                disabled={layout.currentPage === 1}
                onClick={() => handlePageChange(layout.currentPage - 1)}
              >
                ←
              </button>
              <button
                disabled={layout.currentPage === layout.totalPages}
                onClick={() => handlePageChange(layout.currentPage + 1)}
              >
                →
              </button>
            </div>
          )}
        </div>

        <div className="control-section">
          <h4>
            Container: {Math.round(containerWidth)}×
            {Math.round(containerHeight)}
            px
          </h4>
          <h4>
            Video: {Math.round(layout.videoWidth)}×
            {Math.round(layout.videoHeight)}px
          </h4>
        </div>
      </div>

      {/* Video Grid */}
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
            transition: isResizing
              ? "none"
              : "width 0.3s ease, height 0.3s ease",
            position: "relative",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "8px",
            boxSizing: "border-box",
          }}
        >
          {/* Grid of videos */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${layout.cols}, ${Math.round(layout.videoWidth)}px)`,
              gridTemplateRows: `repeat(${layout.rows}, ${Math.round(layout.videoHeight)}px)`,
              gap: `${gap}px`,
            }}
          >
            {/* Video tiles */}
            {Array.from({ length: layout.visibleParticipants }).map(
              (_, index) => {
                const participantIndex = layout.startIndex + index;
                return (
                  <div
                    key={participantIndex}
                    className="video-tile"
                    style={{
                      backgroundColor: "#000",
                      borderRadius: "8px",
                      position: "relative",
                      width: `${Math.round(layout.videoWidth)}px`,
                      height: `${Math.round(layout.videoHeight)}px`,
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
                      P{participantIndex + 1}
                    </div>

                    {/* Active speaker indicator */}
                    {participantIndex === 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          color: "white",
                          fontSize: "10px",
                          padding: "1px 4px",
                          backgroundColor: "rgba(76,175,80,0.8)",
                          borderRadius: "4px",
                        }}
                      >
                        Speaking
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>

          {/* Pagination */}
          {layout.totalPages > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: 12,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <button
                onClick={() => handlePageChange(layout.currentPage - 1)}
                disabled={layout.currentPage === 1}
                style={{
                  backgroundColor: "rgba(0,0,0,0.7)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: layout.currentPage === 1 ? "not-allowed" : "pointer",
                  opacity: layout.currentPage === 1 ? 0.5 : 1,
                }}
              >
                ←
              </button>
              <span
                style={{
                  color: "white",
                  backgroundColor: "rgba(0,0,0,0.7)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                }}
              >
                {layout.currentPage} / {layout.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(layout.currentPage + 1)}
                disabled={layout.currentPage === layout.totalPages}
                style={{
                  backgroundColor: "rgba(0,0,0,0.7)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor:
                    layout.currentPage === layout.totalPages
                      ? "not-allowed"
                      : "pointer",
                  opacity: layout.currentPage === layout.totalPages ? 0.5 : 1,
                }}
              >
                →
              </button>
            </div>
          )}

          {/* Resize handle */}
          <div
            className="resize-handle"
            onMouseDown={handleMouseDown}
            title="Resize"
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
    </div>
  );
};

export default App;

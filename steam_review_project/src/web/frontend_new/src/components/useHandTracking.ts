import { useEffect, useRef, useState } from 'react';

export interface HandTrackingResult {
  x: number;
  y: number;
  isTracking: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function useHandTracking(active: boolean): HandTrackingResult {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isTracking, setIsTracking] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (!active) {
      setIsTracking(false);
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (e) {
          console.warn("Error stopping camera:", e);
        }
        cameraRef.current = null;
      }
      if (handsRef.current) {
        try {
          handsRef.current.close();
        } catch (e) {
          console.warn("Error closing hands tracking:", e);
        }
        handsRef.current = null;
      }
      // Stop webcam stream tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    const Hands = (window as any).Hands;
    const Camera = (window as any).Camera;

    if (!Hands || !Camera) {
      console.warn("MediaPipe Hands or Camera is not loaded from CDN.");
      return;
    }

    const hands = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults((results: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the video frame mirrored
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      if (videoRef.current) {
        try {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        } catch (e) {
          // Video frame might not be ready yet
        }
      }
      ctx.restore();

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        setIsTracking(true);
        const landmarks = results.multiHandLandmarks[0];
        
        // Index fingertip is landmark 8
        const indexFingertip = landmarks[8];
        
        // Normalize to [-0.5, 0.5] range
        // Mirrored x: 0.5 - indexFingertip.x
        const normX = 0.5 - indexFingertip.x;
        const normY = 0.5 - indexFingertip.y; // up is positive

        setCoords({ x: normX, y: normY });

        // Draw HUD overlay on canvas: Draw entire hand skeleton
        const HAND_CONNECTIONS = [
          // Thumb
          [0, 1], [1, 2], [2, 3], [3, 4],
          // Index
          [0, 5], [5, 6], [6, 7], [7, 8],
          // Middle
          [0, 9], [9, 10], [10, 11], [11, 12],
          // Ring
          [0, 13], [13, 14], [14, 15], [15, 16],
          // Pinky
          [0, 17], [17, 18], [18, 19], [19, 20],
          // Palm base connections
          [5, 9], [9, 13], [13, 17]
        ];

        // Draw connections (Bones)
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.45)'; // Theme violet translucent
        ctx.lineWidth = 1.5;
        HAND_CONNECTIONS.forEach(([start, end]) => {
          const ptStart = landmarks[start];
          const ptEnd = landmarks[end];
          if (ptStart && ptEnd) {
            const startX = (1 - ptStart.x) * canvas.width;
            const startY = ptStart.y * canvas.height;
            const endX = (1 - ptEnd.x) * canvas.width;
            const endY = ptEnd.y * canvas.height;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          }
        });

        // Draw joints (Landmarks)
        ctx.fillStyle = '#818cf8'; // Indigo color for joints
        landmarks.forEach((pt: any, idx: number) => {
          const jointX = (1 - pt.x) * canvas.width;
          const jointY = pt.y * canvas.height;
          ctx.beginPath();
          ctx.arc(jointX, jointY, 2, 0, 2 * Math.PI);
          ctx.fill();
        });

        // Mirror coordinates for index fingertip HUD target sight
        const drawX = (1 - indexFingertip.x) * canvas.width;
        const drawY = indexFingertip.y * canvas.height;

        // Draw index fingertip pointer (NASA HUD target sight style)
        ctx.strokeStyle = '#c084fc'; // Bright purple for fingertip
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(drawX, drawY, 8, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw target reticle crosshairs
        ctx.beginPath();
        ctx.moveTo(drawX - 12, drawY);
        ctx.lineTo(drawX + 12, drawY);
        ctx.moveTo(drawX, drawY - 12);
        ctx.lineTo(drawX, drawY + 12);
        ctx.stroke();
      } else {
        setIsTracking(false);
      }
    });

    handsRef.current = hands;

    const video = videoRef.current;
    if (video) {
      const camera = new Camera(video, {
        onFrame: async () => {
          if (handsRef.current) {
            try {
              await handsRef.current.send({ image: video });
            } catch (e) {
              // Frame processing error
            }
          }
        },
        width: 320,
        height: 240
      });
      camera.start()
        .then(() => {
          cameraRef.current = camera;
        })
        .catch((err: any) => {
          console.error("Failed to start MediaPipe camera:", err);
        });
    }

    return () => {
      setIsTracking(false);
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (e) {
          // ignore
        }
        cameraRef.current = null;
      }
      if (handsRef.current) {
        try {
          handsRef.current.close();
        } catch (e) {
          // ignore
        }
        handsRef.current = null;
      }
      // Stop webcam stream tracks
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
    };
  }, [active]);

  return {
    x: coords.x,
    y: coords.y,
    isTracking,
    videoRef,
    canvasRef
  };
}
